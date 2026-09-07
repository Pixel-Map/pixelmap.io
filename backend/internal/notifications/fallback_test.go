package notifications

import (
	"context"
	"encoding/json"
	"github.com/stretchr/testify/require"
	"net/http"
	"net/http/httptest"
	"pixelmap.io/backend/internal/utils"
	"testing"
)

func TestInvalidImageDoesNotWaitForPublication(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("invalid image should not make a network request")
	}))
	defer server.Close()
	client := NewClient("test", "123")
	client.ImageBase = server.URL
	u := exampleUpdate()
	u.Image = "0"
	require.ErrorIs(t, client.ImageReady(context.Background(), u), utils.ErrInvalidTileImage)
}

func TestFallbackMessageHasLinksAndNoBrokenImage(t *testing.T) {
	u := exampleUpdate()
	u.ImageUnavailable = true
	u.Image = "0"
	body, contentType, err := EncodeMessage(u)
	require.NoError(t, err)
	require.Equal(t, "application/json", contentType)
	var m Message
	require.NoError(t, json.Unmarshal(body, &m))
	require.Nil(t, m.Embeds[0].Thumbnail)
	require.Nil(t, m.Embeds[0].Image)
	require.Empty(t, m.Attachments)
	require.Contains(t, m.Embeds[0].Description, "unavailable")
	require.Contains(t, m.Embeds[0].Fields[1].Value, u.Transaction)
	require.Equal(t, "pm-update-15477", m.Nonce)
	require.Empty(t, m.AllowedMentions["parse"])
}
