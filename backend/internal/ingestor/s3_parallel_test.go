package ingestor

import (
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

type parallelUploader struct {
	mu               sync.Mutex
	active, peak     int
	keys             []string
	fail             string
	imageDone        int
	metadataTooEarly bool
}

func (u *parallelUploader) PutObject(ctx context.Context, in *s3.PutObjectInput, _ ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	u.mu.Lock()
	u.active++
	if u.active > u.peak {
		u.peak = u.active
	}
	key := *in.Key
	if strings.HasSuffix(key, ".json") && u.imageDone < 8 {
		u.metadataTooEarly = true
	}
	u.keys = append(u.keys, key)
	u.mu.Unlock()
	select {
	case <-ctx.Done():
	case <-time.After(10 * time.Millisecond):
	}
	u.mu.Lock()
	defer u.mu.Unlock()
	u.active--
	if key == u.fail {
		return nil, fmt.Errorf("injected upload failure")
	}
	if strings.HasSuffix(key, ".png") {
		u.imageDone++
	}
	return &s3.PutObjectOutput{}, ctx.Err()
}
func TestParallelPublicationPreservesDependencyOrderAndRetry(t *testing.T) {
	dir := t.TempDir()
	for n := 0; n < 8; n++ {
		require.NoError(t, os.WriteFile(filepath.Join(dir, fmt.Sprintf("%d.png", n)), []byte("image"), 0644))
	}
	for _, name := range []string{"tile.json", "tiledata.json"} {
		require.NoError(t, os.WriteFile(filepath.Join(dir, name), []byte("{}"), 0644))
	}
	u := &parallelUploader{fail: "3.png"}
	s := &S3Syncer{client: u, bucketName: "test", cacheDir: dir, logger: zap.NewNop()}
	require.Error(t, s.SyncWithS3(context.Background()))
	require.Greater(t, u.peak, 1)
	require.LessOrEqual(t, u.peak, 4)
	require.NotContains(t, u.keys, "tile.json")
	require.NotContains(t, u.keys, "tiledata.json")
	u.fail = ""
	u.keys = nil
	restarted := &S3Syncer{client: u, bucketName: "test", cacheDir: dir, logger: zap.NewNop()}
	require.NoError(t, restarted.SyncWithS3(context.Background()))
	require.Equal(t, []string{"3.png", "tile.json", "tiledata.json"}, u.keys)
	require.False(t, u.metadataTooEarly)
	u.keys = nil
	require.NoError(t, restarted.SyncWithS3(context.Background()))
	require.Empty(t, u.keys)
	// A changed same-size file remains discoverable after the manifest is loaded.
	require.NoError(t, os.WriteFile(filepath.Join(dir, "1.png"), []byte("other"), 0644))
	require.NoError(t, restarted.SyncWithS3(context.Background()))
	require.Equal(t, []string{"1.png"}, u.keys)
}
