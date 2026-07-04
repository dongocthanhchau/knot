# v0.8.0 Drawing Canvas + Multi-View Database — Backend Tasks

## Mục tiêu
Drawing/freehand canvas (#9), Multi-View Database (#10).

## Tasks

### 1.1 Drawing Canvas Data
File `src/server/drawing.ts`:
- `createDrawing(noteId: string, canvasId: string | null, name: string) => Drawing`
- `getDrawing(id: string) => Drawing | null`
- `listDrawings(noteId?: string, canvasId?: string) => Drawing[]`
- `deleteDrawing(id: string) => void`
- Drawing type: { id, noteId, canvasId, name, strokes: Stroke[], width, height, createdAt, updatedAt }
- Stroke type: { id, points: {x,y}[], color, width, opacity, tool: 'pen'|'eraser'|'highlighter', smoothing }
- Store strokes as JSON in TEXT column

### 1.2 Drawing Operations
- `addStroke(drawingId: string, stroke: Stroke) => Stroke` — append stroke
- `updateStroke(drawingId: string, strokeId: string, updates: Partial<Stroke>) => void`
- `removeStroke(drawingId: string, strokeId: string) => void`
- `clearDrawing(drawingId: string) => void` — remove all strokes
- `undoLastStroke(drawingId: string) => Stroke | null` — pop last stroke
- `resizeDrawing(drawingId: string, width: number, height: number) => void`

### 1.3 Multi-View Database Schema
File `src/server/database-view.ts`:
- Database concept: structured collections of notes with custom fields
- `createDatabase(name: string, columns: DatabaseColumn[]) => Database`
  - DatabaseColumn: { id, name, type: 'text'|'number'|'select'|'tag'|'date'|'checkbox', options? }
- `getDatabase(id: string) => Database | null`
- `listDatabases() => Database[]`
- `deleteDatabase(id: string) => void`
- `addItem(databaseId: string, noteId: string, cells: Record<string, any>) => DatabaseItem`
  - cells: { columnId: value }
- `updateItem(databaseId: string, noteId: string, cells: Record<string, any>) => void`
- `removeItem(databaseId: string, noteId: string) => void`
- `getDatabaseItems(databaseId: string, options?: { sortBy, filter, view? }) => DatabaseItem[]`
  - view = 'table' | 'kanban' | 'gallery' | 'list'
- `updateColumn(databaseId: string, columnId: string, updates: Partial<DatabaseColumn>) => void`
- `addColumn(databaseId: string, column: DatabaseColumn) => void`
- `deleteColumn(databaseId: string, columnId: string) => void`
- `reorderColumns(databaseId: string, columnIds: string[]) => void`

### 1.4 View Settings
- `setDatabaseView(dbId: string, view: 'table'|'kanban'|'gallery'|'list', config: ViewConfig) => void`
- ViewConfig per type:
  - table: { groupBy?, sortBy, sortDir, hiddenColumns }
  - kanban: { groupByColumn, collapseEmpty }
  - gallery: { coverField, size }
  - list: { showPreview, maxPreviewChars }

## API Routes
- CRUD /api/drawings — drawing management
- POST /api/drawings/:id/strokes — add stroke
- PATCH /api/drawings/:id/strokes/:strokeId — update stroke
- DELETE /api/drawings/:id/strokes/:strokeId — remove stroke
- POST /api/drawings/:id/undo — undo last stroke
- CRUD /api/databases — database management
- GET /api/databases/:id/items — list with sorting/filtering
- POST /api/databases/:id/items — add note to database
- PATCH /api/databases/:id/items/:noteId — update cells
- DELETE /api/databases/:id/items/:noteId — remove
- POST /api/databases/:id/columns — add column
- PATCH /api/databases/:id/columns/:columnId — update column
- PUT /api/databases/:id/columns/reorder — reorder columns

## Acceptance Criteria
- Drawing CRUD works
- Stroke add/undo/remove works
- Database CRUD with custom columns
- Add note to database with cell values
- Switch views produces different arrangements
