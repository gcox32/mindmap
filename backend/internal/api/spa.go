package api

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
)

// SPAHandler serves the built frontend out of distDir, falling back to
// index.html for any path that doesn't match a real file (client-side
// navigation), and returning 404 for missing files still under distDir.
func SPAHandler(distDir string) http.Handler {
	fileServer := http.FileServer(http.Dir(distDir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requested := filepath.Join(distDir, filepath.Clean(r.URL.Path))
		if _, err := os.Stat(requested); errors.Is(err, os.ErrNotExist) {
			http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}
