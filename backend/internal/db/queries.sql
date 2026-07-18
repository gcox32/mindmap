-- name: ListNodes :many
SELECT * FROM mindmap.nodes ORDER BY id;

-- name: GetNode :one
SELECT * FROM mindmap.nodes WHERE id = sqlc.arg(id);

-- name: CreateNode :one
INSERT INTO mindmap.nodes (id, type, subtype, label, description, primary_attribute)
VALUES (
    sqlc.arg(id),
    sqlc.arg(type),
    sqlc.narg(subtype),
    sqlc.arg(label),
    sqlc.narg(description),
    sqlc.narg(primary_attribute)
)
RETURNING *;

-- name: UpdateNode :one
UPDATE mindmap.nodes
SET
    type = sqlc.arg(type),
    subtype = sqlc.narg(subtype),
    label = sqlc.arg(label),
    description = sqlc.narg(description),
    primary_attribute = sqlc.narg(primary_attribute)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteNode :exec
DELETE FROM mindmap.nodes WHERE id = sqlc.arg(id);

-- name: ListEdges :many
SELECT * FROM mindmap.edges ORDER BY id;

-- name: GetEdge :one
SELECT * FROM mindmap.edges WHERE id = sqlc.arg(id);

-- name: CreateEdge :one
INSERT INTO mindmap.edges (id, source, target, kind, volume)
VALUES (sqlc.arg(id), sqlc.arg(source), sqlc.arg(target), sqlc.arg(kind), sqlc.arg(volume))
RETURNING *;

-- name: UpdateEdge :one
UPDATE mindmap.edges
SET
    source = sqlc.arg(source),
    target = sqlc.arg(target),
    kind = sqlc.arg(kind),
    volume = sqlc.arg(volume)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DeleteEdge :exec
DELETE FROM mindmap.edges WHERE id = sqlc.arg(id);
