# Data schema

The graph is a set of typed nodes connected by typed, directed edges. Both
shapes are defined once, in `src/data/types.ts`, and shared (by convention,
not by codegen — see "Frontend/backend contract" below) with the Go backend.
`src/data/dummyData.ts` is a realistic sample dataset (a fictional
trading-analytics pipeline) that exercises every type/subtype/kind below.

## Nodes (`GraphNode`)

```ts
interface GraphNode {
  id: string
  type: NodeType
  subtype?: NodeSubtype
  label: string
  description?: string
  schedule?: string   // e.g. "0 6 * * *", for cron-tied processes
}
```

### `NodeType`

The five node types roughly form a hierarchy, from structural hub down to
leaf, with `stakeholder` sitting outside that spine as an external consumer:

| type | role | visual weight | layout charge |
|---|---|---|---|
| `nucleus` | The root of a pipeline (a company, or a self-contained regional pipeline). The *first* nucleus in the dataset is pinned to the world origin as the camera's fixed anchor; any further nuclei are secondary/near-self-contained servers, unpinned but given strong repulsion so they hold their own sub-cluster. | brightest, largest | strongest (`-520`) |
| `source` | Where data originates: an API, database, scraper, FTP drop, etc. — see `subtype`. | mid | baseline (`-140`) |
| `process` | A script or job that transforms data — cron-scheduled or spawned as a child of another process. | mid, slightly darker | baseline (`-140`) |
| `output` | A terminal artifact a pipeline produces: a dashboard, table, report, alert. | darkest of the flow types | baseline (`-140`) |
| `stakeholder` | A person/team that consumes an output — external to the data flow itself. | same size as `source`/`process`/`output`, distinct (darkest) color | baseline (`-140`) |

Color and radius are defined once in `src/graph/style.ts` (`NODE_COLOR`,
`BASE_RADIUS_BY_TYPE`); layout charge in `src/graph/useGraphLayout.ts`
(`CHARGE_STRENGTH_BY_TYPE`). Both are `Record<NodeType, …>`, so adding a new
`NodeType` is a compile error at each of these until you fill in the new
entry — TypeScript's exhaustiveness check doubles as a checklist for this and
every other place that switches on node type (see "Adding a node type" below).

### `NodeSubtype`

An optional finer-grained tag on `source`/`process`/`output` nodes — not
type-checked against its parent `type` (any subtype is technically valid on
any node), but used by convention as:

- **source subtypes**: `api`, `database`, `server`, `object-storage`, `scraper`, `ftp`
- **process subtypes**: `script`, `cron-script`, `child-script`
- **output subtypes**: `website`, `email`, `sql-table`, `slack`, `pdf`, `archive`

A couple of subtypes ("shared infrastructure" ones — `server`, `database`,
`object-storage`, `sql-table`) get a size bump via
`RADIUS_BONUS_BY_SUBTYPE` in `style.ts`, standing in for "this naturally has
more connections in a real system" without sizing dynamically off the
current graph's edge count. `server` deliberately gets the largest bump of
the group (`3` vs. `database`'s `2.2`) — a server outranks the database
running on it, even though both are plain `source` nodes distinguished only
by `subtype`. That size difference alone doesn't keep them visually
together, though — see the `hosts` edge kind below for what actually pins a
server next to its database in the layout.

`stakeholder` doesn't currently have its own subtypes — add some the same
way (extend `NodeSubtype`, add entries to `NODE_SUBTYPES` in `NodeManager`)
if you need to distinguish e.g. an internal team from an external customer.

## Edges (`GraphEdge`)

```ts
interface GraphEdge {
  id: string
  source: string   // node id
  target: string   // node id
  kind: EdgeKind
  volume: number   // 1 (rare) – 10 (near-continuous); drives line width
}
```

### `EdgeKind`

Four of the five kinds describe something *moving* through the pipeline —
data, control flow, or a finished artifact. `hosts` is the odd one out: pure
structural containment, no flow at all.

| kind | meaning | example (from `dummyData.ts`) | style |
|---|---|---|---|
| `feeds` | General "A supplies B" — a source feeding a process, an output reaching a stakeholder, or a nucleus tying its domains together structurally. | `bloomberg → ingest-bloomberg`, `pdf-report → cio` | pale blue, solid |
| `spawns` | One process launches another at runtime — parent/child scripts, not a data handoff. | `risk-model → risk-worker-1` | pale blue, solid |
| `produces` | A process generates a terminal output artifact. | `report-builder → pdf-report` | near-white, solid |
| `cycles` | A feedback loop: an output becomes an input to an earlier process, closing the pipeline back on itself. Styled as a deliberate, distinct signal rather than blending in with normal flow. | `sql-positions → risk-model` | red, dashed |
| `hosts` | Structural coupling: a `server`-subtype node hosting the `database`-subtype (or other resource) node that runs on it — not a data flow. Tuned in `useGraphLayout.ts` with a much shorter link distance (`8` vs. `34` for `feeds`) and higher link strength (`0.9` vs. the default `0.5`), so the pair clamps into a visually tight unit regardless of where the rest of the graph settles. | `trading-db-server → internal-db` | gold, solid |

Edge color/dash live in `EDGE_COLOR`/`EDGE_DASHED` (`style.ts`); link
distance/strength live in `LINK_DISTANCE_BY_KIND`/`LINK_STRENGTH_BY_KIND`
(`useGraphLayout.ts`) — same exhaustiveness-as-checklist property as
`NodeType` above.

`volume` is unrelated to `kind` — it's a per-edge frequency/weight
(`widthMultiplierForVolume` in `style.ts`) layered on top, so a rare `feeds`
edge and a near-continuous one still read differently even though they
share a kind.

## Adding a node type or edge kind

This is the heavier change — a new top-level category of node (something
that isn't just a flavor of an existing one; see "Adding a subtype" below
for the lighter path):

1. Add the literal to `NodeType`/`EdgeKind` in `src/data/types.ts`.
2. Run `npx tsc -b` (or `npm run build`) — every `Record<NodeType, …>` /
   `Record<EdgeKind, …>` map (colors, radii, charge, link distance/strength,
   edge labels) fails to compile until you add the new entry, which is the
   fastest way to find every place that needs one.
3. Update the hardcoded UI lists that aren't type-checked against the union:
   `NODE_TYPES`/`EDGE_KINDS` arrays in `NodeManager`/`EdgeManager` (the
   create/edit dropdowns), the `Legend` entries, and `OverviewBreakdown`'s
   `TYPE_ENTRIES` (which node types are worth a count on the dashboard —
   currently everything except `nucleus`, since that's the graph's
   structural root rather than a countable leaf entity).
4. Optionally add an example node/edge to `dummyData.ts` so the new type is
   actually visible in local dev.
5. No backend changes needed — see below.

## Adding a subtype

The lighter path — a new flavor of an existing `NodeType` (this is how
`server` was added: a `source` subtype ranked above `database`, not a new
top-level type):

1. Add the literal to `NodeSubtype` in `src/data/types.ts`.
2. Add it to `NODE_SUBTYPES` in `NodeManager` (the create/edit dropdown) —
   this isn't type-checked against the union, so it's easy to forget.
3. Optionally give it a `RADIUS_BONUS_BY_SUBTYPE` entry in `style.ts` if it
   should read as more/less prominent than its siblings.
4. If the subtype needs to visually cluster with another node regardless of
   the rest of the layout (like `server` does with `database`), reach for a
   dedicated `EdgeKind` with a short `LINK_DISTANCE_BY_KIND` /
   `LINK_STRENGTH_BY_KIND` entry (see `hosts` above) rather than trying to
   force it via subtype/size alone.

## Frontend/backend contract

The Go backend (`backend/internal/db/schema.sql`,
`backend/internal/api/nodes.go`/`edges.go`) stores `type`/`subtype`/`kind`
as plain `TEXT` columns with no enum or `CHECK` constraint — it only
validates presence (non-empty), not membership in `NodeType`/`NodeSubtype`/
`EdgeKind`. That means adding or renaming a type/kind is purely a frontend
change; the backend accepts whatever string it's given. The tradeoff is that
nothing stops bad data (a typo'd type, a since-removed kind) from reaching
the database outside the frontend's own dropdowns — see
`docs/BACKEND.md`'s "Request/response shapes vs. the frontend contract" for
the broader story on how the two sides are kept in sync by hand.
