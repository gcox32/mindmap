CREATE SCHEMA IF NOT EXISTS mindmap;

CREATE TABLE IF NOT EXISTS mindmap.nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    label TEXT NOT NULL,
    description TEXT,
    primary_attribute TEXT
);

CREATE TABLE IF NOT EXISTS mindmap.edges (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL REFERENCES mindmap.nodes (id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES mindmap.nodes (id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    volume INTEGER NOT NULL
);
