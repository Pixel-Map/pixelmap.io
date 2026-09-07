package ingestor

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"golang.org/x/time/rate"
	"net/http"
	"net/http/httptest"
	"pixelmap.io/backend/internal/db"
	"strconv"
	"testing"
	"time"
)

func serveChain(t *testing.T, handler http.HandlerFunc) *EtherscanClient {
	t.Helper()
	s := httptest.NewServer(handler)
	t.Cleanup(s.Close)
	c := NewEtherscanClient("test", 1, zap.NewNop())
	c.baseURL = s.URL
	c.limiter = rate.NewLimiter(rate.Inf, 1)
	return c
}

func TestUpstreamFailureNeverReturnsPartialSuccess(t *testing.T) {
	for _, failure := range []string{"txlist", "getLogs"} {
		t.Run(failure, func(t *testing.T) {
			c := serveChain(t, func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Query().Get("action") == failure {
					w.WriteHeader(503)
					fmt.Fprint(w, `{"status":"1","result":[]}`)
					return
				}
				fmt.Fprint(w, `{"status":"1","result":[{"blockNumber":"100","transactionIndex":"2"}]}`)
			})
			rows, err := c.GetTransactions(context.Background(), 1, 200)
			require.Error(t, err)
			require.Empty(t, rows)
		})
	}
}

func TestFetchAllPagesAndSortCombinedTransactions(t *testing.T) {
	c := serveChain(t, func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		require.Equal(t, "1000", q.Get("offset"))
		if q.Get("action") == "getLogs" {
			fmt.Fprint(w, `{"status":"0","message":"No records found","result":[]}`)
			return
		}
		rows := []EtherscanTransaction{}
		if q.Get("address") == "0x015a06a433353f8db634df4eddf0c109882a15ab" {
			if q.Get("page") == "1" {
				for n := 0; n < 1000; n++ {
					rows = append(rows, EtherscanTransaction{Hash: strconv.Itoa(n), BlockNumber: "200", TransactionIndex: strconv.Itoa(n)})
				}
			} else {
				rows = append(rows, EtherscanTransaction{Hash: "last-page", BlockNumber: "201", TransactionIndex: "0"})
			}
		} else {
			rows = append(rows, EtherscanTransaction{Hash: "wrapper", BlockNumber: "100", TransactionIndex: "0x2"})
		}
		require.NoError(t, json.NewEncoder(w).Encode(map[string]interface{}{"status": "1", "result": rows}))
	})
	rows, err := c.GetTransactions(context.Background(), 1, 300)
	require.NoError(t, err)
	require.Len(t, rows, 1002)
	require.Equal(t, "wrapper", rows[0].Hash)
	require.Equal(t, "last-page", rows[len(rows)-1].Hash)
}

func TestMalformedLatestBlockFailsWithoutPanic(t *testing.T) {
	c := serveChain(t, func(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, `{"result":"0"}`) })
	_, err := c.GetLatestBlockNumber()
	require.Error(t, err)
}

func TestTransferLogsAreOrderedWithoutDroppingDistinctEvents(t *testing.T) {
	c := serveChain(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("action") != "getLogs" {
			fmt.Fprint(w, `{"status":"1","result":[{"hash":"call","blockNumber":"11","transactionIndex":"0"}]}`)
			return
		}
		topics := []string{"0x" + fmt.Sprintf("%064x", 1), "0x" + fmt.Sprintf("%064x", 2), "0x" + fmt.Sprintf("%064x", 3), "0x" + fmt.Sprintf("%064x", 100)}
		later := EtherscanTransferEvent{BlockNumber: "0xa", TimeStamp: "0x1", GasUsed: "0x0", LogIndex: "0x2", TransactionIndex: "0x1", TransactionHash: "logs", Topics: topics}
		earlier := later
		earlier.LogIndex = "0x1"
		require.NoError(t, json.NewEncoder(w).Encode(map[string]interface{}{"status": "1", "result": []EtherscanTransferEvent{later, earlier}}))
	})
	rows, err := c.GetTransactions(context.Background(), 1, 20)
	require.NoError(t, err)
	require.Len(t, rows, 3, "duplicate call should deduplicate, distinct logs should survive")
	require.EqualValues(t, 1, rows[0].LogIndex)
	require.EqualValues(t, 2, rows[1].LogIndex)
	require.Equal(t, "call", rows[2].Hash)
}

func TestLastUpdatedUsesLatestHistoryAndAllowsUnknown(t *testing.T) {
	q := &testQueries{}
	latest, err := tileLastUpdated(context.Background(), q, 100, nil, nil)
	require.NoError(t, err)
	require.Nil(t, latest)
	old := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	recent := old.Add(48 * time.Hour)
	latest, err = tileLastUpdated(context.Background(), q, 100, []db.DataHistory{{TimeStamp: recent}, {TimeStamp: old}}, []db.WrappingHistory{{TimeStamp: recent.Add(time.Hour)}})
	require.NoError(t, err)
	require.Equal(t, recent.Add(time.Hour), *latest)
}
