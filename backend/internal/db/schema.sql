CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    subtype TEXT,
    label TEXT NOT NULL,
    description TEXT,
    schedule TEXT
);

CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES nodes (id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    volume INTEGER NOT NULL
);
