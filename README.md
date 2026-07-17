# mindmap

A 3D data-lineage explorer: nodes are sources/processes/outputs in a data pipeline, edges show how data flows between them (feeds/spawns/produces/cycles). Built with React Three Fiber, laid out with a 3D force simulation, and skinned with a liquid-glass UI chrome. Nodes/edges are served by a Go + Postgres CRUD backend (`backend/`) and managed live from the app's Manage view; `src/data/dummyData.ts` is no longer wired in but is kept around as a realistic sample dataset.

## Getting started

The frontend needs the backend running to have any data to show. Start Postgres and the backend first (see [Backend](#backend) below for the local Postgres options), then:

```bash
npm install
npm run dev       # start the dev server (proxies /api to the backend on :8080)
npm run build      # typecheck + production build
npm run lint       # oxlint
```

## Codebase tour

The two things worth understanding first, regardless of what you're working on: **`src/data/types.ts`** (what a "node"/"edge" actually is) and **`src/App.tsx`** (how state flows to both the 3D scene and the UI chrome). Everything else hangs off one of those two.

### The data seam (start here for real-data work)

- **`src/data/types.ts`** — the contract everything else is built on: `GraphNode`, `GraphEdge`, `PositionedNode`. Every downstream consumer (layout, traversal, rendering, style) only cares about these shapes, not where they came from. A real data source just needs to produce `GraphNode[]`/`GraphEdge[]` conforming to this — see **[`docs/DATA.md`](docs/DATA.md)** for what each `NodeType`/`NodeSubtype`/`EdgeKind` actually means and how to add a new one.
- **`src/data/dummyData.ts`** — the original sample dataset conforming to this contract; no longer imported by `App.tsx` but kept as reference/fixture data. Real data now comes from `src/data/api.ts` (fetch wrappers) via the `src/data/useGraphData.ts` hook, which owns loading/error state and refetches after any mutation — see the Backend section below for the API itself.
- **`src/graph/useGraphLayout.ts`** — turns nodes/edges into 3D positions via a synchronous, fixed-400-iteration `d3-force-3d` simulation, memoized only on array identity. This is where real-data scale will bite first (bigger graphs = more iterations of an already-synchronous main-thread computation) — read it before pushing in a non-toy dataset.
- **`src/graph/traversal.ts`** — pure functions (`computeFocusSet`, `computeDegree`) for neighbor/upstream/downstream highlighting. No data-source assumptions, cheap to reason about.

### The rendering core (start here for continued UI/3D work)

- **`src/App.tsx`** — the composition root and sole state owner (selection, hover, pause, focus mode, search, camera-reset signal). Read this first regardless of direction; it's the map of how state reaches both the 3D scene and the chrome.
- **`src/components/Scene.tsx` → `Graph.tsx` → `NodeMesh.tsx` / `EdgeLine.tsx`** — the R3F pipeline. `Scene` owns the canvas/camera/postprocessing/`OrbitControls`; `Graph` composes layout + highlight state per frame; `NodeMesh`/`EdgeLine` are the actual per-node/per-edge visuals and `useFrame` logic. This is where pause-state handling and the flow-dot animation live, and where perf work will concentrate as the dataset grows.
- **`src/graph/style.ts`** — single source of truth mapping node/edge semantics (type, subtype, kind, volume) to color/size/dash. Any new subtypes real data introduces get wired in here.
- **`CameraFocus.tsx` / `CameraReset.tsx` / `useCancelOnUserInput.ts`** — camera fly-to behavior and the "user input cancels animation" pattern. Lower priority, but worth knowing exists before touching camera behavior.

### UI chrome

- **`src/index.css`** — global tokens/resets and the handful of primitives shared by more than one component (`--glass-*` custom properties, `.panel`, `.glass-btn`, `.close-btn`, `.type-dot`). Everything component-specific lives in that component's own colocated `.css` file (e.g. `Legend.tsx` + `Legend.css`), imported directly at the top of the `.tsx` file — see `docs/FRONTEND.md`.
- **`TopBar.tsx`, `InfoPanel.tsx`, `Legend.tsx`, `SearchBar.tsx`, `ActionPills.tsx`** — thin, presentational panels driven entirely by props from `App.tsx`.
- **`LiquidGlassDefs.tsx`** + **`src/assets/liquidGlassDisplacement.ts`** — the hidden SVG filter (feImage/feDisplacementMap) that drives the refraction effect on `.panel`/`.glass-btn` surfaces, referenced via `backdrop-filter: url(#liquid-glass)`.

## Backend

A v1 CRUD API in Go, backed by Postgres, living in `backend/`. It serves
`GraphNode`/`GraphEdge` JSON matching `src/data/types.ts`, and in
production also serves the built frontend as static files — see
**[`docs/BACKEND.md`](docs/BACKEND.md)** for the full architecture
(directory layout, the sqlc codegen workflow, the API handler pattern, and
how to extend either).

Quickest local path (Postgres via docker-compose, backend on the host):

```bash
cp .env.example .env      # only needed once; edit credentials if you like
docker compose up db      # starts just the Postgres service

export DATABASE_URL="postgres://mindmap:changeme@localhost:5432/mindmap?sslmode=disable"
cd backend && go run ./cmd/server   # creates the `mindmap` schema/tables on first run
```

`DATABASE_URL` is the only required variable, and it's the same one in
every environment (local/test/prod) — only the credentials/host differ.
`docker-compose.yml` and the root `Dockerfile` build the whole app (backend
+ built frontend) into a single deployable image/container.

## Tooling notes

- Vite + `tsc -b` for build/typecheck, `oxlint` for linting (see `.oxlintrc.json`).
- No CSS framework — plain global CSS in `src/index.css`.
- `framer-motion` is used throughout for layout/enter-exit/tap animations (see `ActionPills.tsx` for the segmented-switcher sliding-thumb pattern).
