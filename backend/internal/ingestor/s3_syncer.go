package ingestor

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
)

type S3Syncer struct {
	client     *s3.Client
	bucketName string
	cacheDir   string
	logger     *zap.Logger
	syncMu     sync.Mutex
	fileHashes map[string]string
}

func NewS3Syncer(logger *zap.Logger, cacheDir string) (*S3Syncer, error) {
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg)

	return &S3Syncer{
		client:     client,
		bucketName: "pixelmap.art",
		cacheDir:   cacheDir,
		logger:     logger,
		fileHashes: make(map[string]string),
	}, nil
}

// Modify SyncWithS3 to accept a context
func (s *S3Syncer) SyncWithS3(ctx context.Context) error {
	s.syncMu.Lock()
	defer s.syncMu.Unlock()

	err := filepath.Walk(s.cacheDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(s.cacheDir, path)
		if err != nil {
			return err
		}

		s3Key := strings.ReplaceAll(relPath, string(os.PathSeparator), "/")

		fileHash, err := s.calculateMD5(path)
		if err != nil {
			s.logger.Error("Failed to calculate MD5", zap.Error(err), zap.String("path", path))
			return nil
		}

		if storedHash, ok := s.fileHashes[s3Key]; !ok || storedHash != fileHash {
			if err := s.uploadToS3(ctx, path, s3Key); err != nil {
				s.logger.Error("Failed to upload file to S3", zap.Error(err), zap.String("path", path))
			} else {
				s.fileHashes[s3Key] = fileHash
			}
		}

		return nil
	})

	if err != nil {
		s.logger.Error("Error walking through cache directory", zap.Error(err))
	}

	return err
}

// Update uploadToS3 to accept a context
func (s *S3Syncer) uploadToS3(ctx context.Context, filePath, s3Key string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(s3Key),
		Body:   file,
	})

	if err == nil {
		s.logger.Info("File uploaded to S3", zap.String("key", s3Key))
	}

	return err
}

func (s *S3Syncer) calculateMD5(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}
