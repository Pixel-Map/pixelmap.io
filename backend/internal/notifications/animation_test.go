package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"image/color"
	"image/gif"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func animatedUpdate() Update {
	u := exampleUpdate()
	u.PreviousImage = strings.Repeat("f00", 256)
	u.Image = strings.Repeat("00f", 256)
	return u
}

func TestAnimatedTransitionEndpointsTimingAndLoop(t *testing.T) {
	u := animatedUpdate()
	data, err := RenderTransition(u)
	require.NoError(t, err)
	require.Less(t, len(data), 2*1024*1024)
	animation, err := gif.DecodeAll(bytes.NewReader(data))
	require.NoError(t, err)
	require.Equal(t, 0, animation.LoopCount)
	require.Len(t, animation.Image, 32)
	require.Equal(t, 160, animation.Delay[0])
	require.Equal(t, 200, animation.Delay[16])
	for i, delay := range animation.Delay {
		if i != 0 && i != 16 {
			require.Equal(t, 6, delay)
		}
	}
	require.Equal(t, animationWidth, animation.Config.Width)
	require.Equal(t, animationHeight, animation.Config.Height)
	// Sample every source pixel, excluding the transition guide at the edge.
	for i := 0; i < 256; i++ {
		x, y := artX+(i%16)*pixelScale+pixelScale/2, artY+(i/16)*pixelScale+pixelScale/2
		require.Equal(t, color.RGBA{255, 0, 0, 255}, color.RGBAModel.Convert(animation.Image[0].At(x, y)))
		require.Equal(t, color.RGBA{0, 0, 255, 255}, color.RGBAModel.Convert(animation.Image[16].At(x, y)))
		want := color.RGBA{255, 0, 0, 255}
		if i%16 < 8 {
			want = color.RGBA{0, 0, 255, 255}
		}
		require.Equal(t, want, color.RGBAModel.Convert(animation.Image[8].At(x, y)))
	}
	again, err := RenderTransition(u)
	require.NoError(t, err)
	require.Equal(t, data, again, "retries must produce identical GIFs")
}

func TestAnimationFallsBackForMissingInvalidOrUnchangedArt(t *testing.T) {
	for _, before := range []string{"", "0", "not-an-image", strings.Repeat("00f", 256), strings.Repeat("00F", 256)} {
		u := animatedUpdate()
		u.PreviousImage = before
		data, err := RenderTransition(u)
		require.NoError(t, err)
		require.Empty(t, data)
		body, contentType, err := EncodeMessage(u)
		require.NoError(t, err)
		require.Equal(t, "application/json", contentType)
		var m Message
		require.NoError(t, json.Unmarshal(body, &m))
		require.NotEmpty(t, m.Embeds[0].Thumbnail)
		require.Empty(t, m.Attachments)
	}
}

func TestAnimatedMultipartDelivery(t *testing.T) {
	u := animatedUpdate()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.Equal(t, "Bot test-token", r.Header.Get("Authorization"))
		require.NoError(t, r.ParseMultipartForm(4*1024*1024))
		defer r.MultipartForm.RemoveAll()
		var m Message
		require.NoError(t, json.Unmarshal([]byte(r.FormValue("payload_json")), &m))
		require.Equal(t, "pm-update-15477", m.Nonce)
		require.True(t, m.EnforceNonce)
		require.Empty(t, m.AllowedMentions["parse"])
		require.Empty(t, m.Embeds[0].Thumbnail)
		require.Equal(t, "attachment://tile-100-15477.gif", m.Embeds[0].Image["url"])
		require.Len(t, m.Attachments, 1)
		require.NotEmpty(t, m.Attachments[0].Description)
		file, header, err := r.FormFile("files[0]")
		require.NoError(t, err)
		defer file.Close()
		require.Equal(t, "image/gif", header.Header.Get("Content-Type"))
		require.Equal(t, m.Attachments[0].Filename, header.Filename)
		data, err := io.ReadAll(file)
		require.NoError(t, err)
		gifData, err := gif.DecodeAll(bytes.NewReader(data))
		require.NoError(t, err)
		require.Len(t, gifData.Image, 32)
		fmt.Fprint(w, `{"id":"animated-message"}`)
	}))
	defer server.Close()
	client := NewClient("test-token", "123")
	client.APIBase = server.URL
	id, err := client.Send(context.Background(), u)
	require.NoError(t, err)
	require.Equal(t, "animated-message", id)
}
