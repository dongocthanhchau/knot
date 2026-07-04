# v0.5.0 Context Graph + Template System — Test Plan

## Test Cases

### TC-01: Context Graph Rendering
- Graph loads with nodes and edges
- Nodes show correct labels
- Edge thickness varies by weight
- Legend displays correctly
- Loading state shows while data fetches
- Empty state when no connections

### TC-02: Graph Interaction
- Drag node → position updates
- Zoom in/out works
- Pan works
- Click node → navigates to note
- Hover → tooltip appears
- Refresh button re-fetches data

### TC-03: Related Notes
- Panel shows notes with connection reason
- Sorted by strength (strongest first)
- Click opens note
- Empty state when no related notes

### TC-04: Template CRUD
- Create template with content → appears in list
- Edit template name/content → saved
- Delete template → removed
- Templates grouped by category
- Icon selection works

### TC-05: Template Instantiation
- "Use template" creates new note with content
- New note opens in editor
- Template content preserved as starting point
- Variables/placeholders shown as plain text

### TC-06: Graph Settings
- Sliders affect weight display
- Toggles show/hide node types
- Depth selector limits visible connections
- Settings persist after page refresh

## Edge Cases
- Note with no connections — show guidance
- Very large graph (>100 nodes) — performance check
- Template with no content — create empty note
- Rapid template instantiation — no duplicates
- Graph settings reset to defaults
- Circular connections in graph
