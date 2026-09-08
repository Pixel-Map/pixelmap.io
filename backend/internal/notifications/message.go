package notifications

import (
	"fmt"
	"net/url"
	"pixelmap.io/backend/internal/utils"
	"strings"
	"time"
)

type Update struct {
	ID               int64
	TileID           int32
	BlockNumber      int64
	Timestamp        time.Time
	Image            string
	URL              string
	UpdatedBy        string
	Transaction      string
	PreviousImage    string
	ImageUnavailable bool
}

type Embed struct {
	Title       string            `json:"title"`
	URL         string            `json:"url"`
	Description string            `json:"description"`
	Color       int               `json:"color"`
	Timestamp   string            `json:"timestamp"`
	Thumbnail   map[string]string `json:"thumbnail,omitempty"`
	Image       map[string]string `json:"image,omitempty"`
	Footer      map[string]string `json:"footer"`
	Fields      []Field           `json:"fields"`
}

type Field struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type Message struct {
	Nonce           string              `json:"nonce"`
	EnforceNonce    bool                `json:"enforce_nonce"`
	AllowedMentions map[string][]string `json:"allowed_mentions"`
	Embeds          []Embed             `json:"embeds"`
	Attachments     []Attachment        `json:"attachments,omitempty"`
}

type Attachment struct {
	ID          int    `json:"id"`
	Filename    string `json:"filename"`
	Description string `json:"description"`
}

// Keep the old bot's personality. Choose by event ID so retries are identical.
var compliments = []string{
	"Every artist was first an amateur. 🎨",
	"How beautiful! Let them know what you think! 🎉",
	"Literally the most beautiful art ever to be created! 🌈",
	"Not since the repainting of Ecce Homo has something so glorious been created!",
	"The french toast of PixelMap tiles!",
	"Hmm. 🤕",
	"Have no fear of perfection, you’ll never reach it... Well, this tile did. 🤠",
	"This tile makes Bob Ross look like a drill sergeant! 🥸",
	"Pixel art is the stored honey of the human soul. 🍯",
	"A tile only a mother could love! 🤶",
	"When someone says a diamond in the rough, this tile is the rough! 💎",
	"The 8th wonder of the world, is this gorgeous tile! 🚀",
	"If a man devotes himself to art, much evil is avoided that happens otherwise if one is idle. 🎉",
	"Raw 768 character beauty. Truly a work of art! 🎉",
	"🐿️ says — ‘I love this!’",
	"After decades of work, this marvelous tile has been updated to represent the best of PixelMap! 🚀",
	"Every artist dips his brush in his own soul, and paints his own nature into his pictures.",
	"I WILL NEVER LOVE ANYTHING MORE THAN THIS! 🎉 🚀",
	"‘Painting is just another way of keeping a diary.’ — Pablo Picasso",
	"Lovely ❤️ ❤️ ❤️",
	"This must be what inspired the I FKN LOVE JPEGS tiles ❤️",
	"What. In. The. 😅",
}

func imagePath(u Update) string {
	return utils.HistoryImagePath(u.TileID, u.BlockNumber, u.Transaction)
}

func tileURL(u Update) string { return fmt.Sprintf("https://pixelmap.io/tile/%d", u.TileID) }

func safeLink(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return "https://pixelmap.io"
	}
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "https" && u.Scheme != "http") || u.Hostname() == "" || u.User != nil || strings.ContainsAny(raw, "\r\n\t") {
		return "https://pixelmap.io"
	}
	return u.String()
}

func truncate(s string, limit int) string {
	r := []rune(s)
	if len(r) > limit {
		return string(r[:limit-1]) + "…"
	}
	return s
}

func BuildMessage(u Update) Message {
	owner := u.UpdatedBy
	if strings.HasPrefix(owner, "0x") && len(owner) == 42 {
		owner = owner[:6] + "…" + owner[len(owner)-4:]
	}
	owner = truncate(owner, 100)
	fields := []Field{{Name: "Explore", Value: "[View tile](" + tileURL(u) + ")", Inline: true}}
	// Only generate an explorer link for a real hash, never arbitrary event text.
	if len(u.Transaction) == 66 && strings.HasPrefix(u.Transaction, "0x") && strings.Trim(u.Transaction[2:], "0123456789abcdefABCDEF") == "" {
		fields = append(fields, Field{Name: "On chain", Value: "[View transaction](https://etherscan.io/tx/" + u.Transaction + ")", Inline: true})
	}
	index := u.ID % int64(len(compliments))
	if index < 0 {
		index = 0
	}
	message := Message{
		Nonce: fmt.Sprintf("pm-update-%d", u.ID), EnforceNonce: true,
		AllowedMentions: map[string][]string{"parse": {}},
		Embeds: []Embed{{
			Title: fmt.Sprintf("Tile #%d has been updated by %s!", u.TileID, owner),
			URL:   tileURL(u), Description: compliments[index], Color: 0x66ff82,
			Timestamp: u.Timestamp.UTC().Format(time.RFC3339),
			Thumbnail: map[string]string{"url": "https://pixelmap.art" + imagePath(u)},
			Footer:    map[string]string{"text": truncate("…And they've chosen to link it to: "+safeLink(u.URL), 1900)},
			Fields:    fields,
		}},
	}
	if u.ImageUnavailable {
		message.Embeds[0].Thumbnail = nil
		message.Embeds[0].Description = "This tile was updated on chain. Its image preview is unavailable; you can still view the tile and transaction below."
	}
	return message
}
