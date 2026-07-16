# Frontend architecture

This app renders a data-lineage mind map: a set of nodes (sources, processes,
outputs) connected by directed edges, laid out in 3D and explorable via mouse
and hotkeys. Everything is client-only — there's no backend; `dummyData.ts`
stands in for a real API response.

At the broadest level there are three layers:

1. **Data** — plain types and the (currently dummy) dataset.
2. **Graph** — pure, framework-agnostic logic: layout, styling, traversal.
   Nothing here imports React or three.js components.
3. **Components** — `scene/` renders inside the WebGL canvas; everything
   else is plain HTML overlaid on top of it, split by which mode it belongs
   to: `ui/` (generic primitives shared across modes), `explore/`
   (Explore-mode chrome), and `overview/` (Overview-mode dashboard).

`App.tsx` owns all interaction state (selection, hover, search, focus mode,
camera-reset signal) and hands it down to both the canvas and the HTML
overlay. Neither side talks to the other directly — they're siblings
coordinated by `App`.

## Data (`src/data/`)

- `types.ts` — `GraphNode`, `GraphEdge`, and `PositionedNode` (a node plus
  the `x/y/z` it was assigned by layout). Also the closed sets of
  `NodeType`/`NodeSubtype`/`EdgeKind` that everything else switches on.
- `dummyData.ts` — the sample dataset (a fictional trading-analytics
  pipeline). Swap this for a real data source without touching anything
  else, as long as it conforms to `types.ts`.

## Graph logic (`src/graph/`)

Framework-agnostic helpers shared by both the 3D scene and the HTML panels:

- `useGraphLayout.ts` — runs a one-shot 3D force simulation
  (`d3-force-3d`) over the nodes/edges and returns `PositionedNode[]`. Only
  the *first* `nucleus`-type node (by data order) is pinned at the origin —
  it's the camera's fixed anchor. Further nucleus nodes (secondary,
  near-self-contained servers) are left unpinned but given much stronger
  charge than everything else, so they hold their own presence and pull
  their satellites into a visible sub-cluster while still drifting with
  layout changes. Everything else settles via charge/link/collide forces.
  Memoized on the input arrays' identity.
- `traversal.ts` — `computeFocusSet` (nodes to highlight around a focused
  node: one-hop neighbors, or the full upstream/downstream transitive
  chain) and `computeDegree` (edge count per node, for hub badges).
- `style.ts` — the single source of truth for color/size/width: node color
  by type, radius by type + subtype bonus, edge color/dash by kind, and a
  volume→line-width multiplier. Change the palette or sizing rules here,
  not in components.
- `textures.ts` — a shared, lazily-created radial-gradient sprite texture
  used for node/particle glow, so it's allocated once instead of per-node.
- `useCancelOnUserInput.ts` — a hook that aborts an in-flight camera
  animation as soon as `OrbitControls` sees manual input, so a fly-to
  animation never fights the user's drag/zoom.

## Scene components (`src/components/scene/`)

Everything here renders inside `@react-three/fiber`'s `<Canvas>` and deals
in 3D primitives, not DOM.

- `Scene.tsx` — the `<Canvas>` root: background/fog/lights, `Stars`,
  post-processing (`Bloom`, `Vignette`), and the shared `OrbitControls`
  ref. Composes `Graph` and `CameraReset`. This is the only file that
  touches R3F's `<Canvas>` directly.
- `Graph.tsx` — the layout/highlight orchestrator. Runs `useGraphLayout`,
  works out which node set should be highlighted (search match, or
  `computeFocusSet` around the hovered/selected node), and renders one
  `NodeMesh` per node and one `EdgeLine` per edge with the right
  highlighted/dimmed flags, plus one `OrbitHalo` per nucleus-type node
  (skipped entirely when `settings.showOrbitHalos` is off). Also mounts
  `CameraFocus` for the selected node.
- `NodeMesh.tsx` — a single node's sprite + label, driven by `style.ts` for
  color/radius and `textures.ts` for the glow.
- `EdgeLine.tsx` — a single connector line between two positioned nodes,
  styled by `EdgeKind` (color, dash, width-by-volume) via `style.ts`.
- `CameraFocus.tsx` — animates the camera to frame the selected node when
  `focusKey`/`targetPosition` change; cancels cleanly via
  `useCancelOnUserInput`.
- `CameraReset.tsx` — animates the camera back to its default framing
  whenever `resetSignal` increments (bumped by the reset-view hotkey/button
  in `App.tsx`).
- `OrbitHalo.tsx` — decorative orbital rings around a nucleus, sized off
  its `radius` prop (scaled relative to a reference nucleus radius) and
  positioned via its `position` prop — one instance per nucleus node, so
  secondary servers get the same halo treatment as the primary.

## UI components (`src/components/ui/`, `src/components/explore/`, `src/components/overview/`)

Plain HTML/CSS/SVG overlay, positioned on top of the canvas. None of these
know about three.js. Each component owns a colocated `.css` file of the same
name, imported at the top of its `.tsx` — see "Styling" below.

`ui/` holds generic primitives with no mode-specific meaning:

- `SegmentedControl/` — the generic sliding-thumb pill switcher (a
  `layoutId`-animated thumb behind whichever option is active). Takes a
  `groupId` to namespace the shared-layout animation when more than one
  instance is mounted at once. Used by both `ActionPills` (focus mode) and
  `ViewModeSwitch` (Overview/Explore).
- `ViewModeSwitch/` — top-center `SegmentedControl` toggling `ViewMode`
  between `'explore'` (the interactive graph) and `'overview'` (the bare
  dashboard overlay below). Always visible, in both modes.
- `LiquidGlassDefs.tsx` — a hidden SVG `<filter>` (feImage displacement map
  + blur) that the glassmorphism panel styling references by `id`; must be
  mounted once at the app root for the CSS `backdrop-filter: url(#liquid-glass)`
  effect to resolve.

`explore/` holds Explore-mode-only chrome:

- `TopBar/` — play/pause auto-rotate, reset-view, and the `SettingsPopover`
  trigger.
- `SettingsPopover/` — gear-icon button + popover panel for toggling
  scene-level display settings (currently just `showOrbitHalos`). Owns and
  exports the `SceneSettings` type and `DEFAULT_SCENE_SETTINGS`, following
  the same colocated-type pattern as `ViewModeSwitch`'s `ViewMode`. State
  lives in `App.tsx`; this component is presentation + the open/closed
  popover state only.
- `SearchBar/` — free-text node search; forwards a ref so `App.tsx` can
  focus it via hotkey.
- `ActionPills/` — appears once a node is selected; wraps
  `SegmentedControl` to switch `FocusMode` between neighbors/upstream/downstream.
- `InfoPanel/` — detail panel for the selected node (description,
  schedule, connected edges grouped by kind).
- `Legend/` — the node-type/edge-kind color key plus the status line.

`overview/` holds the Overview-mode dashboard, composed by `OverviewOverlay/`:
`OverviewStats` (node/edge/error/warning counts, top-left), `OverviewBreakdown`
(node-type counts, top-right), `OverviewActivity` (recent activity feed,
right), `OverviewStatus` (system status line, bottom-left), and
`OverviewThroughput` (24h throughput bar chart, bottom-center). Data comes
from `src/data/overviewData.ts`. Deliberately bare — no `.panel` glass-card
chrome — per the reference dashboard mockup it's modeled on: large numbers,
lists, and the chart float directly over the scene, legible via text-shadow
and the scene's own vignette rather than a card background.

## Styling

No CSS framework. Each component's styles live in a colocated `.css` file of
the same name (`Legend.tsx` → `Legend.css`), imported directly by that
component — plain global class names, no CSS Modules. `src/index.css` holds
only what's genuinely shared: the `--glass-*` design tokens, resets, and the
handful of primitives used by more than one component (`.panel`, `.glass-btn`,
`.close-btn`, `.type-dot`). Before adding a new rule, check whether it's
specific to the component you're touching (goes in that component's `.css`)
or a true cross-cutting primitive (goes in `index.css`) — resist growing
`index.css` back into a catch-all.

## Orchestration (`src/App.tsx`)

Owns all cross-cutting state and passes it to `Scene` and the overlay
components as props: `selectedId`, `hoveredId`, `autoRotate`, `focusMode`,
`searchQuery` (derived into `searchMatchIds`), `resetSignal`, `viewMode`, and
`settings` (a `SceneSettings`, e.g. `showOrbitHalos` — flows into `Scene` →
`Graph` to gate scene-level decoration, and into `TopBar` → `SettingsPopover`
for the toggle UI). Also wires the global hotkeys (Esc / Cmd+P / Cmd+R / Cmd+K). Switching
`viewMode` (via `handleSetViewMode`) clears selection, clears search, and
bumps `resetSignal` so Overview always opens from a clean, centered framing.
`viewMode` also flows into `Scene` → `Graph` → `NodeMesh` as an `interactive`
flag: in Overview mode, `OrbitControls` rotate/pan/zoom are disabled and nodes
stop attaching click/hover handlers, so it's purely observational. If you're
adding a new piece of interaction state, it almost certainly belongs here
rather than inside a leaf component.
