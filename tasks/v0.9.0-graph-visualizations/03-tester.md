# v0.9.0 Mind Map + Tree Map + Drill-Down Graph — Test Plan

## Test Cases

### TC-01: Mind Map
- Renders hierarchical tree
- Switch between tree/radial/org layouts
- Collapse branch → children hidden
- Expand branch → children shown
- Click node → navigates to note
- Hover tooltip shows summary

### TC-02: Mind Map Config
- Depth slider changes visible levels
- Show tags toggle affects display
- Show summaries toggle affects display
- Layout switch re-renders correctly

### TC-03: Tree Map
- Rectangles proportional to note weight
- Color coding applied correctly
- Click rectangle → drills into subtree
- Breadcrumb updates on drill
- Back button returns to parent level
- Hover tooltip shows details

### TC-04: Tree Map Config
- Sizing method changes rectangle sizes
- Coloring method changes color scheme
- Min size filter works

### TC-05: Drill-Down Graph
- Graph centered on current note
- Expand button loads more connections
- Levels visually distinct (opacity/size)
- Collapse button goes back a level
- Path mode highlights route between notes
- History tracks recent drill-downs

### TC-06: Tab Navigation
- All 4 graph types accessible via tabs
- Tab persists in URL
- Switching tabs preserves graph data

## Edge Cases
- Mind map with 100+ nodes — performance
- Tree map with 0 notes — empty state
- Drill-down with no connections — single node visible
- Path mode: notes with no connection — "No path found"
- Rapid expand/collapse — smooth transitions
- Very small tree map rectangles — label disappears, show on hover only
- Mind map with single node
