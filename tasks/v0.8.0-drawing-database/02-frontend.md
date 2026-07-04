# v0.8.0 Drawing Canvas + Multi-View Database — Frontend Tasks

## Mục tiêu
Freehand drawing tool (#9), Multi-View Database UI (#10).

## Tasks

### 2.1 Drawing Canvas
Component `src/components/drawing/drawing-canvas.tsx`:
- HTML5 Canvas-based drawing surface
- Tools:
  - Pen: variable width (1-20px), color picker
  - Highlighter: semi-transparent wide stroke
  - Eraser: stroke erasing
  - Select: move/resize existing strokes
- Color palette: preset colors + custom picker
- Width slider for pen/highlighter
- Undo/redo (local stack)
- Clear all button (with confirmation)
- Pressure sensitivity if stylus available (PointerEvents API)
- Drawing surface size: fixed or resizable

### 2.2 Drawing Integration
- Drawing block in TipTap editor (custom node)
- Drawings can be embedded in notes
- Drawings appear on canvas as nodes
- Drawing thumbnail in note list

### 2.3 Database Views
Component `src/components/database/database-view.tsx` — view switcher container:
- Tab bar: Table | Kanban | Gallery | List
- View state persists per database

### 2.4 Table View
Component `src/components/database/table-view.tsx`:
- Spreadsheet-like table
- Columns with headers (clickable → sort/menu)
- Rows = notes in database
- Cells inline editable (click to edit)
- Column resize (drag handles)
- Column menu: Sort asc/desc, Hide, Delete, Rename
- Row drag to reorder
- Checkbox column
- Select column: dropdown with options
- Tag column: multi-select
- Number column: numeric input
- Date column: date picker

### 2.5 Kanban View
Component `src/components/database/kanban-view.tsx`:
- Columns grouped by select column value
- Cards = note title + preview
- Drag card between columns (changes group value)
- Collapse empty groups
- Add card button at bottom of each column

### 2.6 Gallery View
Component `src/components/database/gallery-view.tsx`:
- Card grid layout
- Cover image if available
- Title + first line of content
- Click to open note
- Sort options

### 2.7 List View
Component `src/components/database/list-view.tsx`:
- Compact list rows
- Title + first 80 chars preview
- Show/hide columns toggle
- Multi-select with checkboxes → batch actions

### 2.8 Drawing Page
`src/app/(app)/drawing/[id]/page.tsx` — full-page drawing canvas

## Acceptance Criteria
- Draw on canvas with pen tool
- Change color/width
- Undo/redo strokes
- Erase strokes
- Clear canvas
- Table view renders with columns and rows
- Edit cell inline
- Kanban view groups by column
- Drag card between kanban columns
- Gallery view shows grid
- List view shows compact rows
- View switches persist
