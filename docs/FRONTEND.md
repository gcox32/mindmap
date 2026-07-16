# Frontend architecture

This app renders a data-lineage mind map: a set of nodes (sources, processes,
outputs) connected by directed edges, laid out in 3D and explorable via mouse
and hotkeys. Everything is client-only — there's no backend; `dummyData.ts`
stands in for a real API response.

At the broadest level there are three layers:

1. **Data** — plain types and the (currently dummy) dataset.
2. **Graph** — pure, framework-agnostic logic: layout, styling, traversal.
   Nothing here imports React or three.js components.
3. **Components** — split into `scene/` (renders inside the WebGL canvas)
   and `ui/` (renders as normal HTML on top of it).

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
  (`d3-force-3d`) over the nodes/edges and returns `PositionedNode[]`. The
  nucleus node is pinned at the origin; everything else settles via
  charge/link/collide forces. Memoized on the input arrays' identity.
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
  ref. Composes `Graph`, `OrbitHalo`, and `CameraReset`. This is the only
  file that touches R3F's `<Canvas>` directly.
- `Graph.tsx` — the layout/highlight orchestrator. Runs `useGraphLayout`,
  works out which node set should be highlighted (search match, or
  `computeFocusSet` around the hovered/selected node), and renders one
  `NodeMesh` per node and one `EdgeLine` per edge with the right
  highlighted/dimmed flags. Also mounts `CameraFocus` for the selected
  node.
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
- `OrbitHalo.tsx` — the decorative ring animation independent of any node. (implement using the following)
```
      {positioned
        .filter((node) => node.type === 'nucleus')
        .map((node) => (
          <OrbitHalo key={`halo-${node.id}`} position={[node.x, node.y, node.z]} radius={getNodeRadius(node)} />
        ))}
```



## UI components (`src/components/ui/`)

Plain HTML/CSS/SVG overlay, positioned on top of the canvas. None of these
know about three.js. Each component owns a colocated `.css` file of the same
name, imported at the top of its `.tsx` — see "Styling" below.

- `TopBar.tsx` — play/pause auto-rotate and reset-view buttons.
- `SearchBar.tsx` — free-text node search; forwards a ref so `App.tsx` can
  focus it via hotkey.
- `SegmentedControl.tsx` — the generic sliding-thumb pill switcher (a
  `layoutId`-animated thumb behind whichever option is active). Takes a
  `groupId` to namespace the shared-layout animation when more than one
  instance is mounted at once. Used by both `ActionPills` (focus mode) and
  `ViewModeSwitch` (Overview/Explore).
- `ActionPills.tsx` — appears once a node is selected; wraps
  `SegmentedControl` to switch `FocusMode` between neighbors/upstream/downstream.
- `ViewModeSwitch.tsx` — top-center `SegmentedControl` toggling `ViewMode`
  between `'explore'` (the interactive graph) and `'overview'` (the bare
  dashboard overlay below). Always visible, in both modes.
- `InfoPanel.tsx` — detail panel for the selected node (description,
  schedule, connected edges grouped by kind). Explore-only.
- `Legend.tsx` — the node-type/edge-kind color key plus the status line.
  Explore-only.
- `LiquidGlassDefs.tsx` — a hidden SVG `<filter>` (feImage displacement map
  + blur) that the glassmorphism panel styling references by `id`; must be
  mounted once at the app root for the CSS `backdrop-filter: url(#liquid-glass)`
  effect to resolve.
- `OverviewOverlay.tsx` — composes the Overview-mode dashboard: `OverviewStats`
  (node/edge/error/warning counts, top-left), `OverviewBreakdown` (node-type
  counts, top-right), `OverviewActivity` (recent activity feed, right),
  `OverviewStatus` (system status line, bottom-left), and `OverviewThroughput`
  (24h throughput bar chart, bottom-center). Data comes from
  `src/data/overviewData.ts`. Deliberately bare — no `.panel` glass-card
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

Owns all cross-cutting state and passes it to `Scene` and the `ui/`
components as props: `selectedId`, `hoveredId`, `autoRotate`, `focusMode`,
`searchQuery` (derived into `searchMatchIds`), `resetSignal`, and `viewMode`.
Also wires the global hotkeys (Esc / Cmd+P / Cmd+R / Cmd+K). Switching
`viewMode` (via `handleSetViewMode`) clears selection, clears search, and
bumps `resetSignal` so Overview always opens from a clean, centered framing.
`viewMode` also flows into `Scene` → `Graph` → `NodeMesh` as an `interactive`
flag: in Overview mode, `OrbitControls` rotate/pan/zoom are disabled and nodes
stop attaching click/hover handlers, so it's purely observational. If you're
adding a new piece of interaction state, it almost certainly belongs here
rather than inside a leaf component.
