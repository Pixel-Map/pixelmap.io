package ingestor

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

func TestNewEtherscanClient(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	client := NewEtherscanClient("test_api_key", logger)

	assert.NotNil(t, client)
	assert.Equal(t, "test_api_key", client.apiKey)
	assert.Equal(t, "https://api.etherscan.io/api", client.baseURL)
	assert.NotNil(t, client.logger)
	assert.NotNil(t, client.client)
	assert.NotNil(t, client.limiter)
}

func TestGetLatestBlockNumber(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/api", r.URL.Path)
		assert.Equal(t, "proxy", r.URL.Query().Get("module"))
		assert.Equal(t, "eth_blockNumber", r.URL.Query().Get("action"))
		assert.Equal(t, "test_api_key", r.URL.Query().Get("apikey"))

		response := `{"jsonrpc":"2.0","id":1,"result":"0x100"}`
		w.Write([]byte(response))
	}))
	defer server.Close()

	logger, _ := zap.NewDevelopment()
	client := NewEtherscanClient("test_api_key", logger)
	client.baseURL = server.URL + "/api"

	blockNumber, err := client.GetLatestBlockNumber()
	require.NoError(t, err)
	assert.Equal(t, uint64(256), blockNumber) // 0x100 in decimal
}
