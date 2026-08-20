package media

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLocalStorageSavesAndDeletesDetectedImage(t *testing.T) {
	directory := t.TempDir()
	storage := NewLocalStorage(directory)
	png := append([]byte("\x89PNG\r\n\x1a\n"), bytes.Repeat([]byte{0}, 32)...)

	stored, err := storage.Save(bytes.NewReader(png), `..\salon-cover.png`)
	if err != nil {
		t.Fatalf("save image: %v", err)
	}
	if stored.Kind != "image" || stored.MIMEType != "image/png" || !strings.HasSuffix(stored.URL, ".png") {
		t.Fatalf("unexpected stored file metadata: %#v", stored)
	}
	if stored.OriginalName != "salon-cover.png" {
		t.Fatalf("original file name was not sanitized: %q", stored.OriginalName)
	}
	path := filepath.Join(directory, filepath.Base(stored.URL))
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("stored file missing: %v", err)
	}
	if err := storage.DeleteURL(stored.URL); err != nil {
		t.Fatalf("delete image: %v", err)
	}
	if _, err := os.Stat(path); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("expected deleted file, got: %v", err)
	}
}

func TestLocalStorageRejectsContentThatOnlyHasAnImageExtension(t *testing.T) {
	storage := NewLocalStorage(t.TempDir())
	_, err := storage.Save(strings.NewReader("this is not an image"), "fake.png")
	if !errors.Is(err, ErrUnsupported) {
		t.Fatalf("expected ErrUnsupported, got %v", err)
	}
}
