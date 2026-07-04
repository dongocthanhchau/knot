# v0.2.0 Core Note Taking — Backend Tasks

## Mục tiêu
Implement note CRUD APIs, TipTap JSON storage, auto-save mechanism.

## Tasks

### 1.1 Note CRUD Server Actions
Create `src/server/notes.ts`:
- `createNote(title: string, content?: TipTapJSON) => Note`
- `getNote(id: string) => Note | null`
- `updateNote(id: string, data: { title?, content? }) => Note`
- `deleteNote(id: string) => void` (soft delete: set is_deleted=1)
- `listNotes(options: { parentId?, sortBy?, limit?, offset? }) => Note[]`
- `searchNotes(query: string) => Note[]` (basic LIKE search, FTS5 comes later)

### 1.2 TipTap JSON Handling
- Define TipTap JSON types in `src/lib/tiptap-types.ts`
- Storage format: JSON string in SQLite TEXT column
- Validation on save: ensure valid TipTap structure
- Default content: empty paragraph

### 1.3 Auto-Save
- Debounced save (2s after last change)
- `autoSaveNote(id: string, content: TipTapJSON) => void`
- Save indicator: return last_saved_at timestamp
- Conflict detection: check note.updated_at before save

### 1.4 Soft Delete & Trash
- Trash query: `listTrashNotes() => Note[]`
- `restoreNote(id: string) => void`
- `permanentlyDeleteNote(id: string) => void`

## API Routes
- POST /api/notes — create
- GET /api/notes/:id — read
- PATCH /api/notes/:id — update
- DELETE /api/notes/:id — delete
- GET /api/notes — list/search
- GET /api/trash — list trash
- POST /api/notes/:id/restore — restore

## Acceptance Criteria
- Create note returns note with id + timestamps
- Update note persists content correctly
- Soft delete moves to trash
- Restore works
- Search returns matching notes
- Auto-save saves within 2s of last change
