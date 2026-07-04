# v0.5.0 Context Graph + Template System — Frontend Tasks

## Mục tiêu
Doc Context Graph visualization (#15), Template management UI (#19).

## Tasks

### 2.1 Context Graph Visualization
Component `src/components/graph/context-graph.tsx`:
- Force-directed graph using D3.js force simulation
- Nodes: notes (rectangles with title), tags (circles with tag name)
- Edges: lines with thickness = connection weight
- Color by type: blue=note, green=tag, orange=ref
- Interactive:
  - Drag nodes (pinned position)
  - Click node → navigate to note
  - Hover → show tooltip (title, connections count)
  - Zoom/pan
- Legend in corner
- Loading state: skeleton placeholder
- Empty state: "Create more connected notes to see your graph"
- Re-render when note changes (refresh button)

### 2.2 Related Notes Panel
Component `src/components/graph/related-notes.tsx`:
- Collapsible panel in note editor showing related notes
- Sorted by connection strength (highest first)
- Each item: note title, connection reason ("Shared tag: AI", "Parent note", "Has reference")
- Click to navigate
- Loading skeleton

### 2.3 Graph Settings Drawer
Component `src/components/graph/graph-settings.tsx`:
- Sliders for weight multipliers
- Toggles: show tags, show refs, show hierarchy
- Depth selector (1-5)
- Reset to defaults button
- Settings persist via API

### 2.4 Template System UI
Components in `src/components/templates/`:
- `template-list.tsx` — grid of templates by category
  - Each: icon + name + category badge
  - "Use template" button
- `template-editor.tsx` — create/edit template
  - Name, category select, icon picker
  - TipTap editor for content (simplified)
  - Variable insertion: {{title}}, {{date}}, {{tags}}
- `template-picker.tsx` — modal to choose template when creating note
  - Trigger: "New from template" button in note list

Pages:
- `src/app/(app)/templates/page.tsx` — full template manager

### 2.5 Graph Page
`src/app/(app)/graph/[id]/page.tsx` — full-page context graph for a note
`src/app/(app)/graph/page.tsx` — global graph view (all notes)

## Acceptance Criteria
- Context graph renders with nodes and weighted edges
- Drag, pan, zoom work
- Click node navigates to note
- Related notes panel shows ranked connections
- Template list shows all templates grouped by category
- Instantiate template creates note filled with template content
- Variable placeholders visible in template content
- Graph settings persist across sessions
