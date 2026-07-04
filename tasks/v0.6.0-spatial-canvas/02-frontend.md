# v0.6.0 Spatial Canvas + Connection Strength — Frontend Tasks

## Mục tiêu
Canvas UI with drag-drop positioning, connection strength visualization, node map editor.

## Tasks

### 2.1 Spatial Canvas (#4)
Component `src/components/canvas/canvas.tsx`:
- Infinite canvas with pan (drag background) and zoom (scroll)
- Zoom range: 0.25x - 4x
- Zoom controls: +/- buttons, fit-to-view
- Grid background (dots or lines)
- Canvas items:
  - Note nodes: rectangle with title + preview, draggable
  - Tag nodes: colored circle with tag name
  - Text nodes: free text on canvas
  - Shape nodes: rectangle/circle with color fill
- Selection: click to select, Shift+click multi-select
- Selection box: drag on empty space creates lasso
- Delete selected: Backspace/Delete key
- Minimap in bottom-right corner

### 2.2 Node Map Editor (#14)
Component `src/components/canvas/node-editor.tsx`:
- Double-click node inline to edit its data
- Node resize handles (bottom-right corner)
- Color picker for nodes
- Connect mode: click source node, then target → create edge
- Connection lines drawn with arrow at target
- Edge labels editable on double-click

### 2.3 Connection Strength Visualization (#18)
Integrated into both canvas and context graph:
- Edge thickness proportional to connection weight
- Edge opacity proportional to weight (lighter = weaker)
- Hover on edge → tooltip: "Weight: 0.75 (3 shared tags, 1 reference)"
- Color scale for edges: green (strong) → yellow → red (weak)
- Toggle "Show weights only above N" slider
- Top connections sidebar: "Strongest connections" list

Component `src/components/canvas/strength-heatmap.tsx`:
- Grid view: notes as rows AND columns
- Cell color = connection strength (green → red)
- Click cell → show connection details

### 2.4 Canvas Toolbar
Component `src/components/canvas/canvas-toolbar.tsx`:
- Tools: Select | Add Note | Add Text | Add Shape | Connect | Delete
- Undo/redo buttons (local canvas undo stack)
- Zoom controls
- Filter: show notes only / tags only / all
- Layout: auto-arrange (force-directed) / reset positions
- Export canvas as image (html-to-image or similar)

### 2.5 Canvas Page
`src/app/(app)/canvas/[id]/page.tsx` — full-page canvas
`src/app/(app)/notes/[id]/canvas/page.tsx` — canvas for a specific note

## Acceptance Criteria
- Infinite canvas with pan/zoom
- Add note node from canvas toolbar
- Drag node → position persists
- Connection drawn between nodes
- Edge thickness reflects connection weight
- Hover on edge shows weight breakdown
- Minimap shows viewport position
- Export canvas as image
- Canvas state persists on reload
