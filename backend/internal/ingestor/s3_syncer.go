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
	"sort"
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
	fileStats  map[string]artifactStamp
	loaded     bool
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

type artifactStamp struct {
	Size     int64 `json:"size"`
	Modified int64 `json:"modified"`
}

func stamp(info os.FileInfo) artifactStamp {
	return artifactStamp{info.Size(), info.ModTime().UnixNano()}
}

type uploadJob struct {
	path, key, hash string
	version         artifactStamp
}

// Discover pending files by stat; only new/changed artifacts need hashing.
// Successful uploads survive restart. A failed job never enters the manifest.
func (s *S3Syncer) SyncWithS3(ctx context.Context) error {
	s.syncMu.Lock()
	defer s.syncMu.Unlock()
	manifest := filepath.Join(s.cacheDir, ".s3-manifest-"+s.bucketName+".json")
	statsPath := filepath.Join(s.cacheDir, ".s3-stats-"+s.bucketName+".json")
	if !s.loaded {
		if data, err := os.ReadFile(manifest); err == nil {
			_ = json.Unmarshal(data, &s.fileHashes)
		}
		if data, err := os.ReadFile(statsPath); err == nil {
			_ = json.Unmarshal(data, &s.fileStats)
		}
		s.loaded = true
	}
	if s.fileHashes == nil {
		s.fileHashes = map[string]string{}
	}
	if s.fileStats == nil {
		s.fileStats = map[string]artifactStamp{}
	}
	var jobs []uploadJob
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
		if !info.Mode().IsRegular() {
			return fmt.Errorf("non-regular cache artifact: %s", path)
		}
		rel, err := filepath.Rel(s.cacheDir, path)
		if err != nil {
			return err
		}
		key := filepath.ToSlash(rel)
		version := stamp(info)
		if _, ok := s.fileHashes[key]; ok && s.fileStats[key] == version {
			return nil
		}
		hash, err := s.calculateMD5(path)
		if err != nil {
			return err
		}
		if hash == s.fileHashes[key] {
			s.fileStats[key] = version
			return nil
		}
		jobs = append(jobs, uploadJob{path, key, hash, version})
		return nil
	})
	// Publish images first, then per-tile metadata, then the aggregate index.
	// Never expose an aggregate snapshot when one of its referenced artifacts failed.
	priority := func(key string) int {
		if key == "tiledata.json" {
			return 2
		}
		if strings.HasSuffix(key, ".json") {
			return 1
		}
		return 0
	}
	sort.SliceStable(jobs, func(a, b int) bool { return priority(jobs[a].key) < priority(jobs[b].key) })
	if err == nil {
		for phase := 0; phase < 3 && err == nil; phase++ {
			var batch []uploadJob
			for _, job := range jobs {
				if priority(job.key) == phase {
					batch = append(batch, job)
				}
			}
			err = s.uploadBatch(ctx, batch)
		}
	}
	// Save hashes before stats: a crash between these writes causes harmless rechecks.
	hashErr := utils.AtomicWrite(manifest, func(w io.Writer) error { return json.NewEncoder(w).Encode(s.fileHashes) })
	if hashErr != nil {
		return fmt.Errorf("persist publication manifest: %w", hashErr)
	}
	statsErr := utils.AtomicWrite(statsPath, func(w io.Writer) error { return json.NewEncoder(w).Encode(s.fileStats) })
	if err != nil {
		return err
	}
	return statsErr
}

func (s *S3Syncer) uploadBatch(ctx context.Context, jobs []uploadJob) error {
	work := make(chan uploadJob)
	var wg sync.WaitGroup
	var mu sync.Mutex
	var firstErr error
	for n := 0; n < 4; n++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range work {
				err := ctx.Err()
				if err == nil {
					err = s.uploadToS3(ctx, job.path, job.key)
				}
				// Do not acknowledge an artifact replaced while its upload was in flight.
				if err == nil {
					info, statErr := os.Stat(job.path)
					if statErr != nil {
						err = statErr
					} else if stamp(info) != job.version {
						err = fmt.Errorf("artifact changed during upload: %s", job.key)
					}
				}
				mu.Lock()
				if err != nil {
					if firstErr == nil {
						firstErr = err
					}
				} else {
					s.fileHashes[job.key] = job.hash
					s.fileStats[job.key] = job.version
				}
				mu.Unlock()
			}
		}()
	}
	for _, job := range jobs {
		work <- job
	}
	close(work)
	wg.Wait()
	return firstErr
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
