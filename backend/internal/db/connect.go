package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect opens a pool against the given Postgres connection string, applies
// schema.sql, and returns generated Queries ready to use.
func Connect(ctx context.Context, databaseURL string) (*Queries, *pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, nil, fmt.Errorf("opening pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, nil, fmt.Errorf("pinging database: %w", err)
	}

	if err := Migrate(ctx, pool); err != nil {
		pool.Close()
		return nil, nil, err
	}

	return New(pool), pool, nil
}
