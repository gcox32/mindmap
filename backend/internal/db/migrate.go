package db

import (
	"context"
	_ "embed"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema.sql
var schemaSQL string

// Migrate applies schema.sql. Statements use CREATE TABLE IF NOT EXISTS, so
// this is safe to run on every startup rather than needing a migration runner.
func Migrate(ctx context.Context, pool *pgxpool.Pool) error {
	if _, err := pool.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("applying schema: %w", err)
	}
	return nil
}
