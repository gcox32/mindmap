-- name: ListNodes :many
SELECT * FROM nodes ORDER BY id;

-- name: GetNode :one
SELECT * FROM nodes WHERE id = sqlc.arg(id);

-- name: CreateNode :one
INSERT INTO nodes (id, type, subtype, label, description, schedule)
VALUES (
    sqlc.arg(id),
    sqlc.arg(type),
    sqlc.narg(subtype),
    sqlc.arg(label),
    sqlc.narg(description),
    sqlc.narg(schedule)
)
RETURNING *;

-- name: UpdateNode :one
UPDATE nodes
SET
    type = sqlc.arg(type),
    subtype = sqlc.narg(subtype),
    label = sqlc.arg(label),
    description = sqlc.narg(description),
    schedule = sqlc.narg(schedule)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteNode :exec
DELETE FROM nodes WHERE id = sqlc.arg(id);

-- name: ListEdges :many
SELECT * FROM edges ORDER BY id;

-- name: GetEdge :one
SELECT * FROM edges WHERE id = sqlc.arg(id);

-- name: CreateEdge :one
INSERT INTO edges (id, source, target, kind, volume)
VALUES (sqlc.arg(id), sqlc.arg(source), sqlc.arg(target), sqlc.arg(kind), sqlc.arg(volume))
RETURNING *;

-- name: UpdateEdge :one
UPDATE edges
SET
    source = sqlc.arg(source),
    target = sqlc.arg(target),
    kind = sqlc.arg(kind),
    volume = sqlc.arg(volume)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteEdge :exec
DELETE FROM edges WHERE id = sqlc.arg(id);
