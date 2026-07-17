# Plan: graph-query/traversal layer for LLM-driven explanations

## Goal

Support a feature where a user asks a free-text question ("how did this
script kick off that one?", "what feeds the CIO's PDF report?") and an LLM
answers it by walking the node/edge graph rather than being handed the
entire dataset as context. This doc plans the traversal layer the LLM's
tools would sit on top of — not the prompt/tool-loop itself, which is a
separate follow-up once this groundwork exists.

Related, deliberately out of scope here: richer per-subtype node metadata
(cron definitions, script params/entrypoints, connection info). That's a
`docs/DATA.md` schema change and can land independently — this layer works
against whatever fields `GraphNode`/`GraphEdge` have today and gets more
useful as that metadata grows.

## Why a dedicated layer, not "dump the graph in the prompt"

The dataset is small today, but the question shape — "trace how X happened"
— is inherently a bounded-path or bounded-subgraph query, not a
whole-graph one. Handing an LLM tools that walk the graph one hop at a time
scales as the dataset grows, keeps answers grounded in an actual traversal
(citable node/edge ids) instead of the model pattern-matching over a wall
of JSON, and matches how `docs/DATA.md` already describes the graph:
direction- and kind-specific edges (`spawns` = runtime parent/child,
`feeds` = general supply, `produces` = artifact, `hosts` = structural,
`cycles` = deliberate feedback loop) that a traversal needs to respect
rather than flatten.

## Where this lives: backend (Go), not frontend

`src/graph/traversal.ts` already exists and does part of this
(`computeFocusSet`, `computeDegree`) — but it's purpose-built for camera
focus/highlighting in the 3D scene, runs client-side against the
already-loaded full graph, and has no notion of edge-kind filtering or path
reconstruction. Don't extend it for this.

The new layer should be a Go package on the backend
(`backend/internal/graph/`), for two reasons:

1. **Key custody.** Whatever calls the Claude API for this feature has to
   run server-side (an API key can't live in the browser). Once the LLM
   call is server-side, its tool-execution backing should be too — no
   reason to round-trip tool calls back to the browser.
2. **Data locality.** The backend already loads the full node/edge lists
   from Postgres via the existing `ListNodes`/`ListEdges` sqlc queries (see
   `docs/BACKEND.md`). The traversal layer can build an in-memory index
   from those same rows per-request — no new queries needed yet (see
   Non-goals).

`src/graph/traversal.ts` stays as-is; it's a different consumer with
different constraints (single-hop/transitive highlighting, not kind-aware
path-finding) and no reason to unify with the backend package.

## Core primitives

All of these operate on an in-memory index built once per request from the
full node/edge lists (`map[id]Node`, plus adjacency lists split by
direction). Cycle-safety (a visited-set during traversal) is required, not
optional — `cycles` edges are a deliberate feedback loop in the schema, and
an unguarded walk will loop forever on one.

| Function | Signature (sketch) | Purpose |
|---|---|---|
| `FindNode` | `(query string) []Node` | Fuzzy match against `label`/`id`. The LLM knows a script's name, not its id. |
| `GetNode` | `(id string) (Node, error)` | Full node detail, single lookup. |
| `GetEdges` | `(id string, dir Direction, kinds []EdgeKind) []EdgeWithNode` | One-hop neighbors, optionally filtered to specific edge kinds (e.g. only `spawns`). |
| `TraceChain` | `(id string, dir Direction, kinds []EdgeKind, maxDepth int) Subgraph` | Bounded transitive walk (BFS), same direction/kind filtering, cycle-safe, depth-capped. |
| `FindPath` | `(fromID, toID string, kinds []EdgeKind) (Path, error)` | Shortest path between two named nodes — for "how did A lead to B" questions where both ends are known. |

`Direction` is `upstream | downstream | both`, matching the semantics
`src/graph/traversal.ts` already uses (`upstream` = walk edges pointing
*into* the node, `downstream` = walk edges pointing *out*).

`Subgraph`/`Path` results carry both the node list and the edge list (with
`kind`/`volume`), not just ids — the LLM's answer needs to say *how* things
connect (`spawns` vs `feeds` vs `hosts`), not just that they do.

## Tool surface for the LLM

Keep it to 3–4 tools — per `docs/DATA.md`'s own modeling and the general
tool-use guidance, too many tools with overlapping purpose hurts
selection accuracy more than it helps flexibility:

- `find_node(query)` → `FindNode`
- `get_node(id)` → `GetNode`
- `get_edges(id, direction, kinds?)` → `GetEdges`
- `trace_chain(id, direction, kinds?, max_depth?)` → `TraceChain`

`FindPath` is deliberately not exposed as its own tool at first — a chain
of `get_edges`/`trace_chain` calls covers the same ground, and adding it
only pays for itself once real usage shows the model needs an explicit
"connect these two" primitive.

## Non-goals for this pass

- **No new SQL queries / DB-level filtering.** The full node/edge lists
  already come back from `ListNodes`/`ListEdges`; the traversal layer
  indexes them in memory per request. Revisit only if the dataset grows
  large enough that a full-table load per question becomes the bottleneck.
- **No persistence of past questions/answers.** Out of scope until the
  prompt/tool-loop design exists.
- **No changes to `src/graph/traversal.ts`.** Different consumer, stays
  as-is.
- **No metadata schema changes.** Tracked separately (see top of doc).

## Open questions for the follow-up (prompt/tool-loop) design

- Where does the Claude API call live — a new `backend/internal/api`
  handler, given the existing handlers are plain CRUD? Almost certainly
  yes, but the request/response shape (streamed vs. single-shot) isn't
  decided yet.
- Tool-use loop: Tool Runner vs. manual loop — likely manual, since Go's
  tool runner is a beta SDK dependency and the tool count here is small
  enough that owning the loop isn't much code.
- How much conversation state (if any) persists across follow-up
  questions in the same session.
