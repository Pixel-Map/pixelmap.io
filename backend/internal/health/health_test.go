package health

import (
	"github.com/stretchr/testify/require"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestFreshnessRequiresEverySuccessfulWorker(t *testing.T) {
	path := filepath.Join(t.TempDir(), "worker")
	require.Error(t, Check(time.Minute, path))
	require.NoError(t, Touch(path))
	require.NoError(t, Check(time.Minute, path))
	require.NoError(t, os.WriteFile(path, []byte(time.Now().Add(-2*time.Minute).Format(time.RFC3339Nano)), 0600))
	require.Error(t, Check(time.Minute, path))
	require.NoError(t, Touch(path))
	require.Error(t, Check(time.Minute, path, path+"-missing"))
}
