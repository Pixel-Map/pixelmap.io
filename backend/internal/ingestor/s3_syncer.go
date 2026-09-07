package ingestor

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"go.uber.org/zap"
	"pixelmap.io/backend/internal/utils"
)

type objectUploader interface {
	PutObject(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

type S3Syncer struct {
	client     objectUploader
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

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if endpoint := os.Getenv("S3_ENDPOINT_URL"); endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
			o.UsePathStyle = true
		}
	})
	bucket := os.Getenv("AWS_BUCKET_NAME")
	if bucket == "" {
		bucket = "pixelmap.art"
	}

	return &S3Syncer{
		client:     client,
		bucketName: bucket,
		cacheDir:   cacheDir,
		logger:     logger,
		fileHashes: make(map[string]string),
	}, nil
}

// Modify SyncWithS3 to accept a context
func (s *S3Syncer) SyncWithS3(ctx context.Context) error {
	s.syncMu.Lock()
	defer s.syncMu.Unlock()
	if s.fileHashes == nil {
		s.fileHashes = make(map[string]string)
	}
	// The manifest is bucket-specific and never uploaded. Persisting successful
	// hashes avoids uploading the entire historical cache after every restart.
	manifest := filepath.Join(s.cacheDir, ".s3-manifest-"+s.bucketName+".json")
	if len(s.fileHashes) == 0 {
		if data, err := os.ReadFile(manifest); err == nil {
			if json.Unmarshal(data, &s.fileHashes) != nil || s.fileHashes == nil {
				s.fileHashes = make(map[string]string)
			}
		}
	}

	err := filepath.Walk(s.cacheDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}
		if strings.HasPrefix(info.Name(), ".") {
			return nil
		}
		if err := ctx.Err(); err != nil {
			return err
		}

		relPath, err := filepath.Rel(s.cacheDir, path)
		if err != nil {
			return err
		}

		s3Key := strings.ReplaceAll(relPath, string(os.PathSeparator), "/")

		fileHash, err := s.calculateMD5(path)
		if err != nil {
			s.logger.Error("Failed to calculate MD5", zap.Error(err), zap.String("path", path))
			return fmt.Errorf("hash %s: %w", s3Key, err)
		}

		if storedHash, ok := s.fileHashes[s3Key]; !ok || storedHash != fileHash {
			if err := s.uploadToS3(ctx, path, s3Key); err != nil {
				s.logger.Error("Failed to upload file to S3", zap.Error(err), zap.String("path", path))
				return fmt.Errorf("upload %s: %w", s3Key, err)
			} else {
				s.fileHashes[s3Key] = fileHash
			}
		}

		return nil
	})

	if err != nil {
		s.logger.Error("Error walking through cache directory", zap.Error(err))
	}

	// Save successful progress even if a later object failed. The failing object
	// remains pending, and the caller must not advance its publication cursor.
	manifestErr := utils.AtomicWrite(manifest, func(w io.Writer) error { return json.NewEncoder(w).Encode(s.fileHashes) })
	if err != nil {
		return err
	}
	return manifestErr
}

// Update uploadToS3 to accept a context
func (s *S3Syncer) uploadToS3(ctx context.Context, filePath, s3Key string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:       aws.String(s.bucketName),
		Key:          aws.String(s3Key),
		Body:         file,
		ContentType:  aws.String(mime.TypeByExtension(filepath.Ext(filePath))),
		CacheControl: aws.String("public, max-age=60, must-revalidate"),
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
