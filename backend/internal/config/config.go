package config

import (
	"fmt"
	"os"
)

type Config struct {
	// Postgres connection string, e.g. postgres://user:pass@host:5432/dbname.
	// Same variable in every environment - local, test, and prod differ only
	// in which credentials/host get passed in.
	DatabaseURL string
	Port        string
	// DistDir is where the built frontend (index.html + assets) lives.
	DistDir string
}

func Load() (Config, error) {
	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Port:        getenv("PORT", "8080"),
		DistDir:     getenv("DIST_DIR", "./dist"),
	}
	if cfg.DatabaseURL == "" {
		return cfg, fmt.Errorf("DATABASE_URL environment variable is required")
	}
	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
