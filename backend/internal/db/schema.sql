CREATE SCHEMA IF NOT EXISTS mindmap;

CREATE TABLE IF NOT EXISTS mindmap.nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    label TEXT NOT NULL,
    description TEXT,
    primary_attribute TEXT
);

-- Upgrade path for databases created before the column was renamed from
-- `schedule` to the more general `primary_attribute`. CREATE TABLE IF NOT
-- EXISTS above is a no-op against an existing table, so the rename has to
-- happen explicitly; it's idempotent since `schedule` won't exist after
-- the first run.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'mindmap' AND table_name = 'nodes' AND column_name = 'schedule'
    ) THEN
        ALTER TABLE mindmap.nodes RENAME COLUMN schedule TO primary_attribute;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS mindmap.edges (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL REFERENCES mindmap.nodes (id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES mindmap.nodes (id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    volume INTEGER NOT NULL
);
