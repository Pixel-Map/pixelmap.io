package notifications

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/gif"
	"sort"
	"strings"

	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"
	"pixelmap.io/backend/internal/utils"
)

const (
	animationWidth  = 416
	animationHeight = 496
	artX            = 16
	artY            = 56
	pixelScale      = 24
)

var (
	background = color.RGBA{15, 20, 29, 255}
	mint       = color.RGBA{102, 255, 130, 255}
	muted      = color.RGBA{157, 170, 190, 255}
	white      = color.RGBA{240, 245, 250, 255}
)

// Decode through the same codec as the indexer. Invalid legacy values (such
// as a single "0") are not invented into artwork or allowed to panic the bot.
func tilePixels(code string) ([]color.RGBA, bool) {
	decoded, err := utils.DecompressTileCode(code)
	if err != nil || len(decoded) != 768 {
		return nil, false
	}
	decoded = strings.ToLower(decoded)
	if strings.Trim(decoded, "0123456789abcdef") != "" {
		return nil, false
	}
	pixels := make([]color.RGBA, 256)
	for i := range pixels {
		p := decoded[3*i : 3*i+3]
		rgb, err := hex.DecodeString(string([]byte{p[0], p[0], p[1], p[1], p[2], p[2]}))
		if err != nil {
			return nil, false
		}
		pixels[i] = color.RGBA{rgb[0], rgb[1], rgb[2], 255}
	}
	return pixels, true
}

// RenderTransition returns nil for a first image, invalid historical data, or
// an update that changes only metadata. The caller retains the normal still.
func RenderTransition(u Update) ([]byte, error) {
	before, ok := tilePixels(u.PreviousImage)
	if !ok {
		return nil, nil
	}
	after, ok := tilePixels(u.Image)
	if !ok {
		return nil, nil
	}
	changed := false
	for i := range before {
		if before[i] != after[i] {
			changed = true
			break
		}
	}
	if !changed {
		return nil, nil
	}
	animation := &gif.GIF{LoopCount: 0}
	appendFrame := func(columns int, label string, delay int) {
		frame := transitionFrame(u.TileID, before, after, columns, label)
		animation.Image = append(animation.Image, frame)
		animation.Delay = append(animation.Delay, delay)
		animation.Disposal = append(animation.Disposal, gif.DisposalNone)
	}
	appendFrame(0, "BEFORE", 160)
	for columns := 1; columns < 16; columns++ {
		appendFrame(columns, "BEFORE > AFTER", 6)
	}
	appendFrame(16, "AFTER", 200)
	for columns := 15; columns > 0; columns-- {
		appendFrame(columns, "AFTER > BEFORE", 6)
	}
	var out bytes.Buffer
	if err := gif.EncodeAll(&out, animation); err != nil {
		return nil, fmt.Errorf("encode tile transition: %w", err)
	}
	return out.Bytes(), nil
}

// Build each frame's palette from its 256 original pixels, preserving exact
// colors whenever GIF's 256-color limit allows it. UI colors are reserved;
// only the rare overflow colors are mapped to the closest available color.
func framePalette(pixels []color.RGBA) color.Palette {
	p := color.Palette{background, mint, muted, white}
	counts := make(map[color.RGBA]int)
	for _, c := range pixels {
		counts[c]++
	}
	colors := make([]color.RGBA, 0, len(counts))
	for c := range counts {
		colors = append(colors, c)
	}
	sort.Slice(colors, func(i, j int) bool {
		a, b := colors[i], colors[j]
		if counts[a] != counts[b] {
			return counts[a] > counts[b]
		}
		if a.R != b.R {
			return a.R < b.R
		}
		if a.G != b.G {
			return a.G < b.G
		}
		return a.B < b.B
	})
	for _, c := range colors {
		duplicate := false
		for _, existing := range p {
			if existing == c {
				duplicate = true
				break
			}
		}
		if !duplicate && len(p) < 256 {
			p = append(p, c)
		}
	}
	return p
}

func transitionFrame(tileID int32, before, after []color.RGBA, columns int, label string) *image.Paletted {
	pixels := make([]color.RGBA, 256)
	for i := range pixels {
		pixels[i] = before[i]
		if i%16 < columns {
			pixels[i] = after[i]
		}
	}
	frame := image.NewPaletted(image.Rect(0, 0, animationWidth, animationHeight), framePalette(pixels))
	draw.Draw(frame, frame.Bounds(), image.NewUniform(background), image.Point{}, draw.Src)
	for i, c := range pixels {
		x, y := artX+(i%16)*pixelScale, artY+(i/16)*pixelScale
		draw.Draw(frame, image.Rect(x, y, x+pixelScale, y+pixelScale), image.NewUniform(c), image.Point{}, draw.Src)
	}
	if columns > 0 && columns < 16 {
		x := artX + columns*pixelScale
		draw.Draw(frame, image.Rect(x-1, artY, x+1, artY+384), image.NewUniform(mint), image.Point{}, draw.Src)
	}
	drawLabel(frame, fmt.Sprintf("TILE #%d", tileID), 16, 15, white)
	drawLabel(frame, "PIXELMAP", animationWidth-16-8*14, 15, muted)
	drawLabel(frame, label, (animationWidth-len(label)*14)/2, 452, mint)
	draw.Draw(frame, image.Rect(artX, 486, artX+384, 488), image.NewUniform(muted), image.Point{}, draw.Src)
	draw.Draw(frame, image.Rect(artX, 486, artX+columns*pixelScale, 488), image.NewUniform(mint), image.Point{}, draw.Src)
	return frame
}

// Scale the small bitmap type by exactly 2x to match the crisp pixel artwork.
func drawLabel(dst *image.Paletted, text string, x, y int, ink color.Color) {
	mask := image.NewRGBA(image.Rect(0, 0, len(text)*7, 14))
	d := font.Drawer{Dst: mask, Src: image.NewUniform(ink), Face: basicfont.Face7x13, Dot: fixed.P(0, 12)}
	d.DrawString(text)
	for py := 0; py < 14; py++ {
		for px := 0; px < len(text)*7; px++ {
			if mask.RGBAAt(px, py).A > 0 {
				draw.Draw(dst, image.Rect(x+px*2, y+py*2, x+px*2+2, y+py*2+2), image.NewUniform(ink), image.Point{}, draw.Src)
			}
		}
	}
}
