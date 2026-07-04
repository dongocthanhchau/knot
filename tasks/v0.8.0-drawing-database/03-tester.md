# v0.8.0 Drawing Canvas + Multi-View Database — Test Plan

## Test Cases

### TC-01: Drawing Tools
- Pen draws on canvas
- Color change affects new strokes
- Width change affects new strokes
- Highlighter draws semi-transparent
- Eraser removes strokes

### TC-02: Drawing Operations
- Undo removes last stroke
- Redo restores undone stroke
- Clear removes all strokes
- Drawing persists on reload

### TC-03: Table View
- Table renders with all columns
- Add row → appears in table
- Edit cell inline → value saved
- Sort column asc/desc
- Resize column
- Hide/show columns

### TC-04: Kanban View
- View groups by select column
- Drag card between columns → value updates
- Empty groups collapsed
- Add card creates new note

### TC-05: Gallery View
- Grid layout renders correctly
- Click card → opens note
- Sort options work

### TC-06: List View
- Compact list renders
- Multi-select checkboxes work
- Batch action placeholder

### TC-07: View Switching
- Switch between all 4 views
- View state persists per database
- Data consistent across views

## Edge Cases
- Drawing with 1000+ strokes — performance
- Database with 50+ columns — horizontal scroll
- Kanban with 10+ groups — vertical scroll
- Empty database — guidance message
- Delete column with data — confirm dialog
- Very long cell content — truncation
