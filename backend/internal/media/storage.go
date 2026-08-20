package media

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// Leave room for multipart framing around the documented 150 MB video limit.
const MaxRequestBytes int64 = 152 << 20

var ErrUnsupported = errors.New("upload a JPEG, PNG, WebP, GIF, MP4, WebM, or MOV file")
var ErrTooLarge = errors.New("images are limited to 15 MB and videos to 150 MB")

type StoredFile struct {
	URL, MIMEType, Kind, OriginalName string
	SizeBytes                         int64
}

type LocalStorage struct{ Dir string }

func NewLocalStorage(dir string) *LocalStorage { return &LocalStorage{Dir: dir} }

func (s *LocalStorage) Save(file io.Reader, originalName string) (StoredFile, error) {
	header := make([]byte, 512)
	read, err := io.ReadFull(file, header)
	if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) {
		return StoredFile{}, errors.New("could not read the uploaded file")
	}
	header = header[:read]
	mimeType := http.DetectContentType(header)
	extensions := map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov"}
	extension, ok := extensions[mimeType]
	if !ok {
		return StoredFile{}, ErrUnsupported
	}
	kind, maximum := "image", int64(15<<20)
	if strings.HasPrefix(mimeType, "video/") {
		kind, maximum = "video", 150<<20
	}

	if err := os.MkdirAll(s.Dir, 0o750); err != nil {
		return StoredFile{}, errors.New("upload storage is unavailable")
	}
	random := make([]byte, 18)
	if _, err := rand.Read(random); err != nil {
		return StoredFile{}, errors.New("could not create a safe file name")
	}
	name := hex.EncodeToString(random) + extension
	temporary, err := os.CreateTemp(s.Dir, ".upload-*")
	if err != nil {
		return StoredFile{}, errors.New("upload storage is unavailable")
	}
	temporaryName := temporary.Name()
	cleanup := func() { _ = temporary.Close(); _ = os.Remove(temporaryName) }

	written, err := io.Copy(temporary, io.LimitReader(io.MultiReader(bytes.NewReader(header), file), maximum+1))
	if err != nil {
		cleanup()
		return StoredFile{}, errors.New("could not store the uploaded file")
	}
	if written > maximum {
		cleanup()
		return StoredFile{}, ErrTooLarge
	}
	if err := temporary.Sync(); err != nil {
		cleanup()
		return StoredFile{}, errors.New("could not store the uploaded file")
	}
	if err := temporary.Close(); err != nil {
		cleanup()
		return StoredFile{}, errors.New("could not store the uploaded file")
	}
	finalPath := filepath.Join(s.Dir, name)
	if err := os.Rename(temporaryName, finalPath); err != nil {
		cleanup()
		return StoredFile{}, errors.New("could not finish the upload")
	}

	return StoredFile{URL: "/uploads/" + name, MIMEType: mimeType, Kind: kind, OriginalName: filepath.Base(originalName), SizeBytes: written}, nil
}

func (s *LocalStorage) DeleteURL(value string) error {
	name := filepath.Base(strings.TrimSpace(value))
	if name == "." || name == "" {
		return nil
	}
	target := filepath.Join(s.Dir, name)
	if filepath.Dir(target) != filepath.Clean(s.Dir) {
		return fmt.Errorf("invalid media path")
	}
	err := os.Remove(target)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	return err
}
