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
	// List of addresses to fetch transactions for
	addresses := []string{
		"0x015A06a433353f8db634dF4eDdF0C109882A15AB",
		"0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b",
	}

	var allTransactions []EtherscanTransaction

	for _, address := range addresses {
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
			return nil, err
		}

		// Try to unmarshal as an array first
		var transactions []EtherscanTransaction
		err := json.Unmarshal(rawResp, &transactions)
		if err == nil {
			allTransactions = append(allTransactions, transactions...)
			continue
		}

		// If array unmarshal fails, try as EtherscanResponse
		var resp EtherscanResponse
		if err := json.Unmarshal(rawResp, &resp); err != nil {
			c.logger.Error("Failed to unmarshal response",
				zap.Error(err),
				zap.String("rawResponse", string(rawResp)))
			return nil, fmt.Errorf("failed to unmarshal response: %w", err)
		}

		if resp.Status != "1" {
			return nil, fmt.Errorf("API error: %s (Message: %s)", resp.Status, resp.Message)
		}

		// Handle the case where Result is a string (error message)
		if resultStr, ok := resp.Result.(string); ok {
			return nil, fmt.Errorf("API returned an error in Result: %s", resultStr)
		}

		// Handle the case where Result is an array of transactions
		transactions, ok := resp.Result.([]EtherscanTransaction)
		if !ok {
			return nil, fmt.Errorf("unexpected result type for transactions: %T", resp.Result)
		}

		allTransactions = append(allTransactions, transactions...)
	}

	if len(allTransactions) == 0 {
		return nil, fmt.Errorf("no transactions found")
	}

	return allTransactions, nil
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

func (c *EtherscanClient) makeRequestWithRetry(ctx context.Context, params map[string]string, result interface{}) error {
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
