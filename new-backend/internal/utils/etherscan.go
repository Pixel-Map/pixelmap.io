package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

type EtherscanResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Result  interface{} `json:"result"`
}

func MakeRateLimitedRequest(url string, params map[string]string, logger *zap.Logger) (*EtherscanResponse, error) {
	const maxRetries = 3
	client := &http.Client{Timeout: 10 * time.Second}

	for i := 0; i < maxRetries; i++ {
		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, fmt.Errorf("creating request: %w", err)
		}

		q := req.URL.Query()
		for k, v := range params {
			q.Add(k, v)
		}
		req.URL.RawQuery = q.Encode()

		resp, err := client.Do(req)
		if err != nil {
			logger.Error("HTTP request failed", zap.Error(err))
			time.Sleep(5 * time.Second)
			continue
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("reading response body: %w", err)
		}

		var ethResp EtherscanResponse
		if err := json.Unmarshal(body, &ethResp); err != nil {
			return nil, fmt.Errorf("unmarshaling response: %w", err)
		}

		// Check if Result is a string (error message) or an array
		switch result := ethResp.Result.(type) {
		case string:
			logger.Warn("Etherscan returned an error in the result field", zap.String("result", result))
			return &ethResp, nil
		case []interface{}:
			if len(result) == 0 {
				logger.Info("No transactions found", zap.String("startBlock", params["startblock"]), zap.String("endBlock", params["endblock"]))
			}
			return &ethResp, nil
		default:
			return nil, fmt.Errorf("unexpected result type: %T", ethResp.Result)
		}

		if ethResp.Message == "No transactions found" {
			logger.Info("No transactions found", zap.String("startBlock", params["startblock"]), zap.String("endBlock", params["endblock"]))
			return &EtherscanResponse{Result: []interface{}{}}, nil
		}

		logger.Error("Invalid response from Etherscan", zap.String("message", ethResp.Message))
		time.Sleep(5 * time.Second)
	}

	return nil, fmt.Errorf("max retries reached")
}
