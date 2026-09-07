package ingestor

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"sort"
	"strings"

	"net/http"
	"strconv"
	"time"

	"github.com/cenkalti/backoff/v4"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
)

type EtherscanClient struct {
	apiKey  string
	baseURL string
	chainId int
	logger  *zap.Logger
	client  *http.Client
	limiter *rate.Limiter
}

type EtherscanResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Result  interface{} `json:"result"`
}

type EtherscanTransaction struct {
	TransferLog       bool   `json:"-"`
	LogIndex          uint64 `json:"-"`
	BlockNumber       string `json:"blockNumber"`
	TimeStamp         string `json:"timeStamp"`
	Hash              string `json:"hash"`
	Nonce             string `json:"nonce"`
	BlockHash         string `json:"blockHash"`
	TransactionIndex  string `json:"transactionIndex"`
	From              string `json:"from"`
	To                string `json:"to"`
	Value             string `json:"value"`
	Gas               string `json:"gas"`
	GasPrice          string `json:"gasPrice"`
	IsError           string `json:"isError"`
	TxreceiptStatus   string `json:"txreceipt_status"`
	Input             string `json:"input"`
	ContractAddress   string `json:"contractAddress"`
	CumulativeGasUsed string `json:"cumulativeGasUsed"`
	GasUsed           string `json:"gasUsed"`
	Confirmations     string `json:"confirmations"`
}

type EtherscanTransferEvent struct {
	BlockNumber       string   `json:"blockNumber"`
	TimeStamp         string   `json:"timeStamp"`
	TransactionHash   string   `json:"transactionHash"`
	LogIndex          string   `json:"logIndex"`
	From              string   `json:"from"`
	To                string   `json:"to"`
	Value             string   `json:"value"`
	ContractAddress   string   `json:"address"`
	TransactionIndex  string   `json:"transactionIndex"`
	GasUsed           string   `json:"gasUsed"`
	CumulativeGasUsed string   `json:"cumulativeGasUsed"`
	BlockHash         string   `json:"blockHash"`
	Data              string   `json:"data"`
	Topics            []string `json:"topics"`
}

func NewEtherscanClient(apiKey string, chainId int, logger *zap.Logger) *EtherscanClient {
	return &EtherscanClient{
		apiKey:  apiKey,
		baseURL: "https://api.etherscan.io/v2/api",
		chainId: chainId,
		logger:  logger,
		client:  &http.Client{Timeout: 10 * time.Second},
		// Etherscan's free tier allows 3 req/sec. 300ms (~3.3/sec) sat just over
		// the cap and periodically tripped "NOTOK / Max calls per sec"; 500ms
		// (2/sec) stays comfortably under even with burst alignment. The indexer
		// makes only a handful of calls per 30s cycle, so the extra spacing is
		// immaterial.
		limiter: rate.NewLimiter(rate.Every(500*time.Millisecond), 1),
	}
}

func (c *EtherscanClient) GetLatestBlockNumber() (uint64, error) {
	// Count this call against the shared Etherscan rate budget too; otherwise it
	// bursts alongside the txlist/getLogs calls and trips the free tier's 3
	// req/sec cap (surfaced as "NOTOK / Max calls per sec rate limit reached").
	if err := c.limiter.Wait(context.Background()); err != nil {
		return 0, fmt.Errorf("rate limiter wait: %w", err)
	}
	url := fmt.Sprintf("%s?chainid=%d&module=proxy&action=eth_blockNumber&apikey=%s", c.baseURL, c.chainId, c.apiKey)

	resp, err := c.client.Get(url)
	if err != nil {
		return 0, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("Etherscan HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response body: %w", err)
	}

	c.logger.Debug("Etherscan API response", zap.String("body", string(body)))

	var result struct {
		JsonRPC string `json:"jsonrpc"`
		ID      int    `json:"id"`
		Result  string `json:"result"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return 0, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if !strings.HasPrefix(result.Result, "0x") || len(result.Result) < 3 {
		return 0, fmt.Errorf("empty result from Etherscan API")
	}

	blockNumber, err := strconv.ParseUint(result.Result[2:], 16, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse block number: %w", err)
	}

	return blockNumber, nil
}

// Fetch every page from every source. A partial result must never advance the
// block checkpoint. Keep the page size below the logs endpoint's 1000-row cap.
const etherscanPageSize = 1000

func (c *EtherscanClient) fetchPages(ctx context.Context, params map[string]string) ([]json.RawMessage, error) {
	var rows []json.RawMessage
	seenPages := make(map[[32]byte]bool)
	for page := 1; ; page++ {
		params["page"] = strconv.Itoa(page)
		params["offset"] = strconv.Itoa(etherscanPageSize)
		var raw json.RawMessage
		if err := c.makeRequestWithRetry(ctx, params, &raw); err != nil {
			return nil, err
		}
		var batch []json.RawMessage
		if err := json.Unmarshal(raw, &batch); err != nil || string(raw) == "null" {
			return nil, fmt.Errorf("invalid %s page %d", params["action"], page)
		}
		if len(batch) > 0 {
			hash := sha256.Sum256(raw)
			if seenPages[hash] {
				return nil, fmt.Errorf("%s pagination did not advance", params["action"])
			}
			seenPages[hash] = true
		}
		rows = append(rows, batch...)
		if len(batch) < etherscanPageSize {
			return rows, nil
		}
	}
}

func (c *EtherscanClient) GetTransactions(ctx context.Context, startBlock, endBlock int64) ([]EtherscanTransaction, error) {
	var transactions []EtherscanTransaction
	for _, address := range []string{"0x015a06a433353f8db634df4eddf0c109882a15ab", "0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b"} {
		rows, err := c.fetchPages(ctx, map[string]string{
			"module": "account", "action": "txlist", "address": address,
			"startblock": strconv.FormatInt(startBlock, 10), "endblock": strconv.FormatInt(endBlock, 10),
			"sort": "asc", "apikey": c.apiKey,
		})
		if err != nil {
			return nil, fmt.Errorf("fetch transactions for %s: %w", address, err)
		}
		for _, row := range rows {
			var tx EtherscanTransaction
			if err := json.Unmarshal(row, &tx); err != nil {
				return nil, err
			}
			transactions = append(transactions, tx)
		}
	}
	events, err := c.GetTransferEvents(ctx, startBlock, endBlock)
	if err != nil {
		return nil, err
	}
	for _, event := range events {
		if err := validateTransferEvent(event); err != nil {
			return nil, err
		}
		transactions = append(transactions, ConvertTransferEventToTransaction(event))
	}
	// Validate ordering fields before sorting, rather than treating malformed
	// upstream data as block zero. Log events follow the call in their transaction.
	for _, tx := range transactions {
		if _, err := strconv.ParseUint(tx.BlockNumber, 10, 64); err != nil {
			return nil, fmt.Errorf("invalid transaction block: %w", err)
		}
		if _, err := chainIndex(tx.TransactionIndex); err != nil {
			return nil, err
		}
	}
	sort.SliceStable(transactions, func(i, j int) bool {
		a, b := transactions[i], transactions[j]
		ab, _ := strconv.ParseUint(a.BlockNumber, 10, 64)
		bb, _ := strconv.ParseUint(b.BlockNumber, 10, 64)
		if ab != bb {
			return ab < bb
		}
		ai, _ := chainIndex(a.TransactionIndex)
		bi, _ := chainIndex(b.TransactionIndex)
		if ai != bi {
			return ai < bi
		}
		if a.TransferLog != b.TransferLog {
			return !a.TransferLog
		}
		return a.LogIndex < b.LogIndex
	})
	// Pagination may overlap; preserve different logs from the same transaction.
	seen := make(map[string]bool)
	result := make([]EtherscanTransaction, 0, len(transactions))
	for _, tx := range transactions {
		key := fmt.Sprintf("%s/%t/%d", strings.ToLower(tx.Hash), tx.TransferLog, tx.LogIndex)
		if tx.Hash != "" && seen[key] {
			continue
		}
		seen[key] = true
		result = append(result, tx)
	}
	return result, nil
}

func chainIndex(value string) (uint64, error) {
	if value == "" {
		return 0, nil
	}
	base := 10
	if strings.HasPrefix(value, "0x") {
		value = value[2:]
		base = 16
	}
	n, err := strconv.ParseUint(value, base, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid chain index: %w", err)
	}
	return n, nil
}

func validateTransferEvent(e EtherscanTransferEvent) error {
	for _, value := range []string{e.BlockNumber, e.TimeStamp, e.LogIndex, e.GasUsed} {
		if !strings.HasPrefix(value, "0x") || len(value) < 3 {
			return fmt.Errorf("invalid transfer event quantity")
		}
		if _, err := strconv.ParseUint(value[2:], 16, 64); err != nil {
			return fmt.Errorf("invalid transfer event quantity: %w", err)
		}
	}
	if len(e.Topics) != 4 {
		return fmt.Errorf("invalid Transfer topic count")
	}
	for _, topic := range e.Topics {
		if len(topic) != 66 || !strings.HasPrefix(topic, "0x") || strings.Trim(topic[2:], "0123456789abcdefABCDEF") != "" {
			return fmt.Errorf("invalid Transfer topic")
		}
	}
	return nil
}

func (c *EtherscanClient) GetTransferEvents(ctx context.Context, startBlock, endBlock int64) ([]EtherscanTransferEvent, error) {
	rows, err := c.fetchPages(ctx, map[string]string{
		"module": "logs", "action": "getLogs",
		"fromBlock": strconv.FormatInt(startBlock, 10), "toBlock": strconv.FormatInt(endBlock, 10),
		"address": "0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b",
		"topic0":  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		"apikey":  c.apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("fetch transfer logs: %w", err)
	}
	events := make([]EtherscanTransferEvent, 0, len(rows))
	for _, row := range rows {
		var event EtherscanTransferEvent
		if err := json.Unmarshal(row, &event); err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, nil
}

func (c *EtherscanClient) makeRequest(ctx context.Context, params map[string]string, result interface{}) error {
	if err := c.limiter.Wait(ctx); err != nil {
		return fmt.Errorf("rate limiter wait: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL, nil)
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}

	q := req.URL.Query()
	// Add chainId parameter for V2 API
	q.Add("chainid", strconv.Itoa(c.chainId))
	for k, v := range params {
		q.Add(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("making request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Etherscan HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("reading response body: %w", err)
	}

	var ethResp EtherscanResponse
	if err := json.Unmarshal(body, &ethResp); err != nil {
		return fmt.Errorf("unmarshaling response: %w", err)
	}

	if ethResp.Status == "0" && (ethResp.Message == "No transactions found" || ethResp.Message == "No records found") {
		return json.Unmarshal([]byte("[]"), result)
	}
	if ethResp.Status != "1" {
		// Include Result: Etherscan puts the real reason there (e.g. "Max calls
		// per sec rate limit reached") while Message is just "NOTOK". Keeps the
		// "API error: NOTOK" / "No transactions found" substrings the retry
		// logic matches on.
		return fmt.Errorf("API error: %s (%v)", ethResp.Message, ethResp.Result)
	}

	resultJSON, err := json.Marshal(ethResp.Result)
	if err != nil {
		return fmt.Errorf("marshaling result: %w", err)
	}

	if err := json.Unmarshal(resultJSON, result); err != nil {
		return fmt.Errorf("unmarshaling result: %w", err)
	}

	return nil
}

func (c *EtherscanClient) makeRequestWithRetry(ctx context.Context, params map[string]string, result *json.RawMessage) error {
	b := backoff.NewExponentialBackOff()
	b.MaxElapsedTime = 2 * time.Minute

	operation := func() error {
		err := c.makeRequest(ctx, params, result)
		if err != nil {
			if strings.Contains(err.Error(), "rate limiter wait:") {
				// Cancellation or a deadline must propagate to the batch caller.
				return backoff.Permanent(err)
			}
			if strings.Contains(err.Error(), "Max rate limit reached") ||
				strings.Contains(err.Error(), "API error: NOTOK") {
				c.logger.Warn("API rate limit or error encountered, retrying", zap.Error(err))
				return err // Retry for these API errors
			}
			return backoff.Permanent(err) // Don't retry for other errors
		}
		return nil
	}

	return backoff.Retry(operation, backoff.WithContext(b, ctx))
}

// ConvertTransferEventToTransaction converts an EtherscanTransferEvent to an EtherscanTransaction
func ConvertTransferEventToTransaction(event EtherscanTransferEvent) EtherscanTransaction {
	// event.BlockNumber is a string hex value, need to convert to int but still as string
	blockNumber, _ := strconv.ParseInt(event.BlockNumber[2:], 16, 64)
	timeStamp, _ := strconv.ParseInt(event.TimeStamp[2:], 16, 64) // Convert hex to int64
	nonce, _ := strconv.ParseInt(event.LogIndex[2:], 16, 64)      // Convert hex to int64
	gas, _ := strconv.ParseInt(event.GasUsed[2:], 16, 64)         // Convert hex to int64

	// Construct the input data for safeTransferFrom
	from := "0x" + event.Topics[1][26:] // Extracting the 'from' address from topics
	to := "0x" + event.Topics[2][26:]   // Extracting the 'to' address from topics
	tokenId := event.Topics[3]          // Token ID in hex

	// Pad addresses and tokenId to 32 bytes (64 hex characters)
	paddedFrom := fmt.Sprintf("%064s", strings.TrimPrefix(from, "0x"))
	paddedTo := fmt.Sprintf("%064s", strings.TrimPrefix(to, "0x"))
	paddedTokenId := fmt.Sprintf("%064s", strings.TrimPrefix(tokenId, "0x"))

	// safeTransferFrom(address,address,uint256) method signature
	methodSignature := "0x42842e0e"
	inputData := methodSignature + paddedFrom + paddedTo + paddedTokenId

	index, _ := chainIndex(event.TransactionIndex)
	return EtherscanTransaction{
		TransferLog: true, LogIndex: uint64(nonce),
		BlockNumber:       strconv.FormatInt(blockNumber, 10),
		TimeStamp:         strconv.FormatInt(timeStamp, 10), // Convert int64 to string
		Hash:              event.TransactionHash,
		From:              from,
		To:                "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b",
		Value:             "0", // safeTransferFrom typically has no value transfer
		ContractAddress:   event.ContractAddress,
		TransactionIndex:  strconv.FormatUint(index, 10),
		Gas:               strconv.FormatInt(gas, 10),
		GasUsed:           strconv.FormatInt(gas, 10),
		GasPrice:          "0",
		CumulativeGasUsed: "0",
		Nonce:             strconv.FormatInt(nonce, 10),
		Confirmations:     "0",
		Input:             inputData, // Set the input data to mimic safeTransferFrom
	}
}

// Helper function to parse hex string to uint64
func parseHexToUint64(hexStr string) uint64 {
	value, _ := strconv.ParseUint(hexStr[2:], 16, 64)
	return value
}
