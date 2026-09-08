// Package health exposes last-success freshness checks to container health probes.
package health

import (
	"fmt"
	"os"
	"time"
)

func Touch(path string) error {
	return os.WriteFile(path, []byte(time.Now().UTC().Format(time.RFC3339Nano)), 0600)
}

func Check(maxAge time.Duration, paths ...string) error {
	for _, path := range paths {
		b, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("no successful cycle for %s", path)
		}
		last, err := time.Parse(time.RFC3339Nano, string(b))
		if err != nil || time.Since(last) > maxAge || last.After(time.Now().Add(time.Minute)) {
			return fmt.Errorf("stale successful cycle for %s", path)
		}
	}
	return nil
}
