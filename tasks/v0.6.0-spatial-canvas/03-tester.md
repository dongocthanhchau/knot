# v0.6.0 Spatial Canvas + Connection Strength — Test Plan

## Test Cases

### TC-01: Canvas Rendering
- Canvas loads with grid background
- Zoom in/out works (scroll and buttons)
- Pan works (drag empty space)
- Minimap updates as viewport moves

### TC-02: Canvas Nodes
- Add note node → appears on canvas
- Drag node → position persists after reload
- Resize node works
- Delete node (select + Backspace) → removed
- Multi-select with Shift+click works
- Lasso selection works

### TC-03: Canvas Connections
- Connect mode: click A then B → edge created
- Edge has arrow at target
- Delete edge works
- Edge label editable
- Connected nodes move together if grouped

### TC-04: Connection Strength
- Edge thickness varies between pairs
- Hover tooltip shows weight breakdown
- Top connections sidebar ranks by strength
- Strength heatmap renders correctly
- Weight filter slider hides weak connections

### TC-05: Canvas Tools
- All toolbar tools work (select, add, connect, delete)
- Undo/redo works for canvas operations
- Filter toggles show/hide node types
- Auto-arrange positions nodes
- Export image downloads correctly

### TC-06: Canvas Persistence
- Add nodes → refresh → nodes still there
- Move nodes → refresh → positions preserved
- Create connection → refresh → persists
- Canvas page URL loads correct canvas

## Edge Cases
- Very large canvas (100+ nodes) — performance
- Zoom at extremes (0.25x or 4x) — labels should still be readable
- Overlapping nodes — selection priority
- Export canvas with scroll offset — should capture full canvas
- Connection strength for unrelated notes — 0 weight
- Empty canvas state — "Add your first note to the canvas"
- Canvas with same note multiple times
