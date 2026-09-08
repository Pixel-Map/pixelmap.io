package ingestor

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"pixelmap.io/backend/internal/db"
	"pixelmap.io/backend/internal/utils"
	"strconv"
	"strings"
)

func (i *Ingestor) markTile(id int32) {
	if i.dirtyTiles != nil {
		i.dirtyTiles[id] = true
	}
}

// Markers are committed with the state changes and cleared only after S3 success.
// The publication mutex serializes ingestion and publication in this single indexer.
func (i *Ingestor) pendingTiles(ctx context.Context) (map[int32]bool, error) {
	result := make(map[int32]bool)
	if i.sqlDB == nil {
		return result, nil
	}
	rows, err := i.sqlDB.QueryContext(ctx, `SELECT state FROM current_state WHERE state LIKE 'PUBLICATION_TILE_%'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		n, err := strconv.ParseInt(strings.TrimPrefix(key, "PUBLICATION_TILE_"), 10, 32)
		if err != nil || n < 0 || n >= 3970 {
			return nil, fmt.Errorf("invalid publication tile marker")
		}
		result[int32(n)] = true
	}
	return result, rows.Err()
}

// RenderHistoryImage also supports the maintenance command for legacy backfills.
func RenderHistoryImage(row db.DataHistory) error {
	path := filepath.Join("cache", utils.HistoryImagePath(row.TileID, row.BlockNumber, row.Tx))
	if _, err := os.Stat(path); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}
	err := utils.RenderImage(row.Image, imageSize, imageSize, path)
	if errors.Is(err, utils.ErrInvalidTileImage) {
		return utils.RenderBlankImage(imageSize, imageSize, path)
	}
	return err
}

// Preserve old URLs until their unique historical artifact has been materialized.
func publishedHistoryPath(tileID int32, block int64, tx string) string {
	path := utils.HistoryImagePath(tileID, block, tx)
	if _, err := os.Stat(filepath.Join("cache", path)); err == nil {
		return path
	}
	return fmt.Sprintf("/%d/%d.png", tileID, block)
}

// MaterializeHistory preserves legacy block/latest aliases while giving each
// transaction its own artifact. Input is newest-first in canonical chain order.
func MaterializeHistory(ctx context.Context, history []db.DataHistory) error {
	seenBlocks := make(map[int64]bool)
	for index, row := range history {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := RenderHistoryImage(row); err != nil {
			return err
		}
		source := filepath.Join("cache", utils.HistoryImagePath(row.TileID, row.BlockNumber, row.Tx))
		if !seenBlocks[row.BlockNumber] {
			target := filepath.Join("cache", fmt.Sprintf("/%d/%d.png", row.TileID, row.BlockNumber))
			if err := copyArtifact(source, target); err != nil {
				return err
			}
			seenBlocks[row.BlockNumber] = true
		}
		if index == 0 {
			if err := copyArtifact(source, filepath.Join("cache", fmt.Sprintf("/%d/latest.png", row.TileID))); err != nil {
				return err
			}
		}
	}
	return nil
}

func copyArtifact(source, target string) error {
	if source == target {
		return nil
	}
	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	return utils.AtomicWrite(target, func(w io.Writer) error { _, err := io.Copy(w, input); return err })
}
