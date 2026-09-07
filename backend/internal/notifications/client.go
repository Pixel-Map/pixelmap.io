package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
	"time"
)

type RetryError struct {
	Status int
	After  time.Duration
}

func (e *RetryError) Error() string {
	return fmt.Sprintf("Discord HTTP %d; retry after %s", e.Status, e.After)
}

type Client struct {
	Token     string
	Channel   string
	HTTP      *http.Client
	APIBase   string
	ImageBase string
}

func NewClient(token, channel string) *Client {
	return &Client{Token: token, Channel: channel,
		HTTP:    &http.Client{Timeout: 15 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }},
		APIBase: "https://discord.com/api/v10", ImageBase: "https://pixelmap.art"}
}

// Immutable block-specific filenames prevent stale latest.png thumbnails.
// Check the public URL first because rendering and publishing are asynchronous.
func (c *Client) ImageReady(ctx context.Context, u Update) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodHead, c.ImageBase+imagePath(u), nil)
	if err != nil {
		return fmt.Errorf("build image request: %w", err)
	}
	res, err := c.HTTP.Do(req)
	if err != nil {
		return fmt.Errorf("check published tile image: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("tile %d image is not published yet (HTTP %d)", u.TileID, res.StatusCode)
	}
	return nil
}

func (c *Client) Send(ctx context.Context, u Update) (string, error) {
	body, err := json.Marshal(BuildMessage(u))
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.APIBase+"/channels/"+c.Channel+"/messages", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bot "+c.Token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "DiscordBot (https://pixelmap.io, 1.0)")
	res, err := c.HTTP.Do(req)
	if err != nil {
		return "", fmt.Errorf("send Discord notification: %w", err)
	}
	defer res.Body.Close()
	data, err := io.ReadAll(io.LimitReader(res.Body, 64*1024))
	if err != nil {
		return "", fmt.Errorf("read Discord response: %w", err)
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		delay := 30 * time.Second
		if res.StatusCode == http.StatusTooManyRequests {
			var rate struct {
				RetryAfter float64 `json:"retry_after"`
			}
			_ = json.Unmarshal(data, &rate)
			seconds, _ := strconv.ParseFloat(res.Header.Get("Retry-After"), 64)
			seconds = math.Max(seconds, rate.RetryAfter)
			if seconds > 0 && !math.IsInf(seconds, 0) && seconds < float64((24*time.Hour)/time.Second) {
				delay = time.Duration(seconds*float64(time.Second)) + time.Second
			}
		}
		if res.StatusCode == http.StatusUnauthorized || res.StatusCode == http.StatusForbidden || res.StatusCode == http.StatusBadRequest || res.StatusCode == http.StatusNotFound {
			delay = 5 * time.Minute
		}
		// Do not log response bodies, credentials, or user-supplied content.
		return "", &RetryError{Status: res.StatusCode, After: delay}
	}
	var message struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &message); err != nil {
		return "", fmt.Errorf("decode Discord receipt: %w", err)
	}
	if message.ID == "" {
		return "", fmt.Errorf("Discord response has no message ID")
	}
	return message.ID, nil
}
