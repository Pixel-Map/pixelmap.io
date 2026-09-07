package ingestor

import (
	"context"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// MockS3Client implements the S3 client interface for testing
type MockS3Client struct {
	mock.Mock
}

func (m *MockS3Client) PutObject(ctx context.Context, params *s3.PutObjectInput, optFns ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*s3.PutObjectOutput), args.Error(1)
}

func TestCalculateMD5(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	// Create a temporary directory
	tempDir, err := ioutil.TempDir("", "s3syncer-test")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	syncer := &S3Syncer{
		cacheDir:   tempDir,
		logger:     logger,
		fileHashes: make(map[string]string),
	}

	// Create a test file
	testFilePath := filepath.Join(tempDir, "test.txt")
	err = ioutil.WriteFile(testFilePath, []byte("test content"), 0644)
	require.NoError(t, err)

	// Calculate MD5
	hash, err := syncer.calculateMD5(testFilePath)
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)

	// Calculate MD5 for a non-existent file
	_, err = syncer.calculateMD5(filepath.Join(tempDir, "nonexistent.txt"))
	assert.Error(t, err)
}

func TestSyncWithS3(t *testing.T) {

	logger, _ := zap.NewDevelopment()
	mockClient := new(MockS3Client)

	// Create a temporary directory
	tempDir, err := ioutil.TempDir("", "s3syncer-test")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a test file
	testFilePath := filepath.Join(tempDir, "test.txt")
	err = ioutil.WriteFile(testFilePath, []byte("test content"), 0644)
	require.NoError(t, err)

	// Create a subdirectory and file
	subDir := filepath.Join(tempDir, "subdir")
	err = os.MkdirAll(subDir, 0755)
	require.NoError(t, err)

	subFilePath := filepath.Join(subDir, "subfile.txt")
	err = ioutil.WriteFile(subFilePath, []byte("subdir test content"), 0644)
	require.NoError(t, err)

	syncer := &S3Syncer{
		client:     mockClient,
		bucketName: "test-bucket",
		cacheDir:   tempDir,
		logger:     logger,
		fileHashes: make(map[string]string),
	}

	// Mock PutObject calls
	mockClient.On("PutObject", mock.Anything, mock.MatchedBy(func(params *s3.PutObjectInput) bool {
		return params.Bucket != nil && *params.Bucket == "test-bucket" && params.Key != nil
	})).Return(&s3.PutObjectOutput{}, nil).Times(2)

	// Run sync
	ctx := context.Background()
	err = syncer.SyncWithS3(ctx)
	assert.NoError(t, err)

	// Verify that both files were uploaded
	mockClient.AssertNumberOfCalls(t, "PutObject", 2)

	// Test with a file that's already been synced
	// The hash should be cached, so no upload should occur
	err = syncer.SyncWithS3(ctx)
	assert.NoError(t, err)

	// The number of calls should still be 2
	mockClient.AssertNumberOfCalls(t, "PutObject", 2)

	// Modify a file and sync again
	err = ioutil.WriteFile(testFilePath, []byte("modified content"), 0644)
	require.NoError(t, err)

	// Mock one more PutObject call
	mockClient.On("PutObject", mock.Anything, mock.MatchedBy(func(params *s3.PutObjectInput) bool {
		return params.Key != nil && *params.Key == "test.txt"
	})).Return(&s3.PutObjectOutput{}, nil).Once()

	err = syncer.SyncWithS3(ctx)
	assert.NoError(t, err)

	// Now there should be 3 calls
	mockClient.AssertNumberOfCalls(t, "PutObject", 3)

}

func TestUploadToS3(t *testing.T) {

	logger, _ := zap.NewDevelopment()
	mockClient := new(MockS3Client)

	// Create a temporary directory
	tempDir, err := ioutil.TempDir("", "s3syncer-test")
	require.NoError(t, err)
	defer os.RemoveAll(tempDir)

	// Create a test file
	testFilePath := filepath.Join(tempDir, "test.txt")
	err = ioutil.WriteFile(testFilePath, []byte("test content"), 0644)
	require.NoError(t, err)

	syncer := &S3Syncer{
		client:     mockClient,
		bucketName: "test-bucket",
		cacheDir:   tempDir,
		logger:     logger,
		fileHashes: make(map[string]string),
	}

	// Mock successful upload
	mockClient.On("PutObject", mock.Anything, mock.MatchedBy(func(params *s3.PutObjectInput) bool {
		return params.Bucket != nil && *params.Bucket == "test-bucket" && params.Key != nil && *params.Key == "test-key"
	})).Return(&s3.PutObjectOutput{}, nil).Once()

	// Test successful upload
	ctx := context.Background()
	err = syncer.uploadToS3(ctx, testFilePath, "test-key")
	assert.NoError(t, err)

	// Mock upload error
	mockClient.On("PutObject", mock.Anything, mock.MatchedBy(func(params *s3.PutObjectInput) bool {
		return params.Key != nil && *params.Key == "error-key"
	})).Return(&s3.PutObjectOutput{}, errors.New("upload error")).Once()

	// Test upload error
	err = syncer.uploadToS3(ctx, testFilePath, "error-key")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "upload error")

	// Test with non-existent file
	err = syncer.uploadToS3(ctx, filepath.Join(tempDir, "nonexistent.txt"), "nonexistent-key")
	assert.Error(t, err)

	mockClient.AssertExpectations(t)

}
func TestFailedUploadRetriesAfterRestart(t *testing.T) {
	dir := t.TempDir()
	require.NoError(t, os.WriteFile(filepath.Join(dir, "tile.png"), []byte("png"), 0644))
	client := new(MockS3Client)
	client.On("PutObject", mock.Anything, mock.Anything).Return(&s3.PutObjectOutput{}, errors.New("S3 down")).Once()
	syncer := &S3Syncer{client: client, bucketName: "test", cacheDir: dir, logger: zap.NewNop(), fileHashes: map[string]string{}}
	require.Error(t, syncer.SyncWithS3(context.Background()))
	client.On("PutObject", mock.Anything, mock.Anything).Return(&s3.PutObjectOutput{}, nil).Once()
	// New process, same durable cache: failed objects still upload.
	restarted := &S3Syncer{client: client, bucketName: "test", cacheDir: dir, logger: zap.NewNop()}
	require.NoError(t, restarted.SyncWithS3(context.Background()))
	again := &S3Syncer{client: client, bucketName: "test", cacheDir: dir, logger: zap.NewNop()}
	require.NoError(t, again.SyncWithS3(context.Background()))
	client.AssertNumberOfCalls(t, "PutObject", 2)
}
