package ingestor

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
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

func NewEtherscanClient(apiKey string, logger *zap.Logger) *EtherscanClient {
	return &EtherscanClient{
		apiKey:  apiKey,
		baseURL: "https://api.etherscan.io/api",
		logger:  logger,
		client:  &http.Client{Timeout: 10 * time.Second},
		limiter: rate.NewLimiter(rate.Every(300*time.Millisecond), 1),
	}
}

func (c *EtherscanClient) GetLatestBlockNumber() (uint64, error) {
	url := fmt.Sprintf("%s?module=proxy&action=eth_blockNumber&apikey=%s", c.baseURL, c.apiKey)

	resp, err := http.Get(url)
	if err != nil {
		return 0, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

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

	if result.Result == "" {
		return 0, fmt.Errorf("empty result from Etherscan API")
	}

	blockNumber, err := strconv.ParseUint(result.Result[2:], 16, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse block number: %w", err)
	}

	return blockNumber, nil
}

func (c *EtherscanClient) GetTransactions(ctx context.Context, startBlock, endBlock int64) ([]EtherscanTransaction, error) {
	addresses := []string{
		"0x015a06a433353f8db634df4eddf0c109882a15ab",
		"0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b",
	}

	var allTransactions []EtherscanTransaction

	for i, address := range addresses {
		c.logger.Debug("Processing address",
			zap.Int("index", i),
			zap.String("address", address),
			zap.Int64("startBlock", startBlock),
			zap.Int64("endBlock", endBlock))

		params := map[string]string{
			"module":     "account",
			"action":     "txlist",
			"address":    address,
			"startblock": strconv.FormatInt(startBlock, 10),
			"endblock":   strconv.FormatInt(endBlock, 10),
			"sort":       "asc",
			"apikey":     c.apiKey,
		}

		var rawResp json.RawMessage
		if err := c.makeRequestWithRetry(ctx, params, &rawResp); err != nil {
			if strings.Contains(err.Error(), "No transactions found") {
				c.logger.Debug("No transactions found for address",
					zap.String("address", address))
				continue // Skip this address and continue with the next one
			}
			c.logger.Error("Failed to make request",
				zap.Error(err),
				zap.String("address", address))
			continue // Skip this address and continue with the next one
		}

		// Try to unmarshal as an array first
		var transactions []EtherscanTransaction
		err := json.Unmarshal(rawResp, &transactions)
		if err == nil {
			c.logger.Debug("Successfully unmarshaled response as array",
				zap.Int("transactionCount", len(transactions)),
				zap.String("address", address))
			allTransactions = append(allTransactions, transactions...)
			continue
		}

		// If array unmarshal fails, try as EtherscanResponse
		var resp EtherscanResponse
		if err := json.Unmarshal(rawResp, &resp); err != nil {
			c.logger.Error("Failed to unmarshal response",
				zap.Error(err),
				zap.String("rawResponse", string(rawResp)),
				zap.String("address", address))
			continue
		}

		if resp.Status != "1" {
			c.logger.Warn("API returned non-success status",
				zap.String("status", resp.Status),
				zap.String("message", resp.Message),
				zap.String("address", address))
			continue
		}

		transactions, ok := resp.Result.([]EtherscanTransaction)
		if !ok {
			c.logger.Warn("Unexpected result type for transactions",
				zap.String("type", fmt.Sprintf("%T", resp.Result)),
				zap.String("address", address))
			continue
		}

		c.logger.Info("Transactions found for address",
			zap.String("address", address),
			zap.Int("count", len(transactions)))

		allTransactions = append(allTransactions, transactions...)
	}

	// Fetch Transfer events for the NFT contracts
	transferEvents, err := c.GetTransferEvents(ctx, startBlock, endBlock)

	if err != nil {
		c.logger.Info(err.Error())
		if strings.Contains(err.Error(), "No records found") {
			c.logger.Debug("No records found for contract")
		} else {
			c.logger.Error("Failed to fetch transfer events", zap.Error(err))
		}
	} else {
		c.logger.Debug("Transfer events found", zap.Int("count", len(transferEvents)))
		c.logger.Debug("Transfer events", zap.Any("events", transferEvents))
		for _, event := range transferEvents {
			transaction := ConvertTransferEventToTransaction(event)
			c.logger.Debug("Transaction", zap.Any("transaction", transaction))
			allTransactions = append(allTransactions, transaction)
		}
	}

	c.logger.Debug("Finished processing all transactions",
		zap.Int("totalTransactions", len(allTransactions)))

	return allTransactions, nil
}

func (c *EtherscanClient) GetTransferEvents(ctx context.Context, startBlock, endBlock int64) ([]EtherscanTransferEvent, error) {
	contractAddresses := []string{
		"0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b", // OpenSea contract address
		// Add other relevant contract addresses here
	}

	var allEvents []EtherscanTransferEvent

	for _, contract := range contractAddresses {
		params := map[string]string{
			"module":    "logs",
			"action":    "getLogs",
			"fromBlock": strconv.FormatInt(startBlock, 10),
			"toBlock":   strconv.FormatInt(endBlock, 10),
			"address":   contract,
			"topic0":    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event signature
			"apikey":    c.apiKey,
		}

		var rawResp json.RawMessage
		if err := c.makeRequestWithRetry(ctx, params, &rawResp); err != nil {
			if strings.Contains(err.Error(), "No records found") {
				c.logger.Debug("No records found for contract", zap.String("contract", contract))
				continue
			} else {
				c.logger.Error("Failed to fetch transfer events",
					zap.Error(err),
					zap.String("contract", contract))
				continue
			}
		}
		c.logger.Debug("Raw response", zap.String("rawResponse", string(rawResp)))

		var events []EtherscanTransferEvent
		if err := json.Unmarshal(rawResp, &events); err != nil {
			c.logger.Error("Failed to unmarshal transfer events",
				zap.Error(err),
				zap.String("rawResponse", string(rawResp)),
				zap.String("contract", contract))
			continue
		}

		allEvents = append(allEvents, events...)
	}

	return allEvents, nil
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
	for k, v := range params {
		q.Add(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("making request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("reading response body: %w", err)
	}

	var ethResp EtherscanResponse
	if err := json.Unmarshal(body, &ethResp); err != nil {
		return fmt.Errorf("unmarshaling response: %w", err)
	}

	if ethResp.Status != "1" {
		return fmt.Errorf("API error: %s", ethResp.Message)
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
				// Local rate limiter error, retry immediately
				return nil
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

	return backoff.Retry(operation, b)
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

	return EtherscanTransaction{
		BlockNumber:       strconv.FormatInt(blockNumber, 10),
		TimeStamp:         strconv.FormatInt(timeStamp, 10), // Convert int64 to string
		Hash:              event.TransactionHash,
		From:              from,
		To:                "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b",
		Value:             "0", // safeTransferFrom typically has no value transfer
		ContractAddress:   event.ContractAddress,
		TransactionIndex:  event.TransactionIndex,
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
