package main

import (
	"context"
	"log"
	"net/http"

	"mindmap-backend/internal/api"
	"mindmap-backend/internal/config"
	"mindmap-backend/internal/db"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	queries, pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.Handle("/api/", api.NewRouter(queries))
	mux.Handle("/", http.FileServer(http.Dir(cfg.DistDir)))

	log.Printf("listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatal(err)
	}
}
