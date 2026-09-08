package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func exampleUpdate() Update {
	return Update{ID: 15477, TileID: 100, BlockNumber: 25924135,
		Timestamp: time.Date(2026, 9, 7, 7, 58, 35, 0, time.UTC),
		Image:     strings.Repeat("abc", 256), URL: "example.com", UpdatedBy: "0x" + strings.Repeat("a", 40),
		Transaction: "0x" + strings.Repeat("b", 64)}
}

func TestMessageUsesEventSnapshotAndDisablesMentions(t *testing.T) {
	u := exampleUpdate()
	m := BuildMessage(u)
	require.Equal(t, m, BuildMessage(u), "retry payload must be stable")
	require.Equal(t, "pm-update-15477", m.Nonce)
	require.True(t, m.EnforceNonce)
	require.Empty(t, m.AllowedMentions["parse"])
	require.Equal(t, "https://pixelmap.art/100/25924135-d8200f3407f942daeee8fab0d6e3a334ddd395949fb19d06f8b8b965296ff2b2.png", m.Embeds[0].Thumbnail["url"])
	require.Equal(t, "2026-09-07T07:58:35Z", m.Embeds[0].Timestamp)
	require.Contains(t, m.Embeds[0].Title, "0xaaaa…aaaa")
	require.Contains(t, m.Embeds[0].Footer["text"], "https://example.com")
	require.Contains(t, m.Embeds[0].Fields[1].Value, u.Transaction)
	u.UpdatedBy = strings.Repeat("界", 300)
	u.URL = strings.Repeat("a", 3000)
	u.Transaction = "malformed"
	m = BuildMessage(u)
	require.LessOrEqual(t, len([]rune(m.Embeds[0].Title)), 256)
	require.LessOrEqual(t, len([]rune(m.Embeds[0].Footer["text"])), 2048)
	require.Len(t, m.Embeds[0].Fields, 1)
}

func TestSafeLinks(t *testing.T) {
	for _, raw := range []string{"", "javascript://alert(1)", "ftp://example.com", "https://user:password@example.com", "https://", "https://example.com\n@everyone"} {
		require.Equal(t, "https://pixelmap.io", safeLink(raw), raw)
	}
	require.Equal(t, "https://example.com/a?q=1", safeLink("example.com/a?q=1"))
	require.Equal(t, "http://example.com", safeLink("http://example.com"))
}

func TestHTTPDeliveryAndImageReadiness(t *testing.T) {
	u := exampleUpdate()
	posted := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead {
			require.Equal(t, "/100/25924135-d8200f3407f942daeee8fab0d6e3a334ddd395949fb19d06f8b8b965296ff2b2.png", r.URL.Path)
			require.Empty(t, r.Header.Get("Authorization"), "never send Discord token to image host")
			w.WriteHeader(http.StatusOK)
			return
		}
		posted++
		require.Equal(t, "/channels/123/messages", r.URL.Path)
		require.Equal(t, "Bot test-token", r.Header.Get("Authorization"))
		var message Message
		require.NoError(t, json.NewDecoder(r.Body).Decode(&message))
		require.Equal(t, BuildMessage(u), message)
		fmt.Fprint(w, `{"id":"message-123"}`)
	}))
	defer server.Close()
	client := NewClient("test-token", "123")
	client.APIBase, client.ImageBase = server.URL, server.URL
	require.NoError(t, client.ImageReady(context.Background(), u))
	id, err := client.Send(context.Background(), u)
	require.NoError(t, err)
	require.Equal(t, "message-123", id)
	require.Equal(t, 1, posted)
}

func TestDeliveryFailures(t *testing.T) {
	for _, tc := range []struct {
		name   string
		status int
		body   string
		after  time.Duration
	}{
		{"rate limit", 429, `{"retry_after":2.25}`, 3250 * time.Millisecond},
		{"server error", 503, "down", 30 * time.Second},
		{"bad credentials", 401, "private details", 5 * time.Minute},
		{"missing permissions", 403, "private details", 5 * time.Minute},
		{"bad payload", 400, "private details", 5 * time.Minute},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(tc.status); fmt.Fprint(w, tc.body) }))
			defer server.Close()
			client := NewClient("secret", "123")
			client.APIBase = server.URL
			_, err := client.Send(context.Background(), exampleUpdate())
			var retry *RetryError
			require.ErrorAs(t, err, &retry)
			require.Equal(t, tc.after, retry.After)
			require.NotContains(t, err.Error(), "private details")
			require.NotContains(t, err.Error(), "secret")
		})
	}
}

func TestMissingImageAndReceipt(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead {
			w.WriteHeader(404)
			return
		}
		fmt.Fprint(w, `{}`)
	}))
	defer server.Close()
	client := NewClient("test", "123")
	client.APIBase, client.ImageBase = server.URL, server.URL
	require.ErrorContains(t, client.ImageReady(context.Background(), exampleUpdate()), "HTTP 404")
	_, err := client.Send(context.Background(), exampleUpdate())
	require.ErrorContains(t, err, "no message ID")
}

func TestTokenDoesNotFollowRedirect(t *testing.T) {
	redirected := false
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { redirected = true }))
	defer target.Close()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target.URL, http.StatusTemporaryRedirect)
	}))
	defer server.Close()
	client := NewClient("test", "123")
	client.APIBase = server.URL
	_, err := client.Send(context.Background(), exampleUpdate())
	require.Error(t, err)
	require.False(t, redirected)
}
