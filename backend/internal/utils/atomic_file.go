package utils

import (
	"io"
	"os"
	"path/filepath"
)

// AtomicWrite prevents readers and uploaders from observing partial artifacts.
func AtomicWrite(path string, write func(io.Writer) error) error {
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(path), ".pixelmap-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	defer f.Close()
	if err := write(f); err != nil {
		return err
	}
	if err := f.Chmod(0644); err != nil {
		return err
	}
	if err := f.Close(); err != nil {
		return err
	}
	return os.Rename(f.Name(), path)
}
