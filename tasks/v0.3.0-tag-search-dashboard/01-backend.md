# v0.3.0 Tag System + Search + Dashboard — Backend Tasks

## Mục tiêu
Tag CRUD, FTS5 search, dashboard stats API.

## Tasks

### 1.1 Tag CRUD Server Actions
File `src/server/tags.ts`:
- `createTag(name: string, color?: string) => Tag`
- `getTag(id: string) => Tag | null`
- `listTags() => Tag[]` (with note count per tag)
- `deleteTag(id: string) => void`
- `renameTag(id: string, name: string) => Tag`
- `addTagToNote(noteId: string, tagId: string) => void`
- `removeTagFromNote(noteId: string, tagId: string) => void`
- `getNoteTags(noteId: string) => Tag[]`

Schema: tag table + note_tag junction table (already in foundation schema).

### 1.2 FTS5 Full-Text Search
File `src/server/search.ts`:
- `initFTS5()` — create FTS5 virtual table on app start if not exists
- `indexNote(id: string) => void` — insert/update note content into FTS index
- `removeFromIndex(id: string) => void` — delete from FTS index
- `searchFTS(query: string) => SearchResult[]` — MATCH query, return note id + snippet + rank
- Ranking: ORDER BY rank (bm25)
- Sync: on every note create/update, call indexNote

### 1.3 Dashboard Stats API
File `src/server/dashboard.ts`:
- `getDashboardStats() => DashboardStats`
  - totalNotes: number
  - totalTags: number
  - notesCreatedThisWeek: number
  - recentNotes: Note[] (last 5 edited)
  - notesByTag: { tagId, tagName, count }[]

## API Routes
- POST/GET /api/tags — create/list
- PATCH/DELETE /api/tags/:id — rename, delete
- POST /api/tags/:id/notes — addTagToNote
- DELETE /api/tags/:id/notes/:noteId — removeTagFromNote
- GET /api/tags/:id/notes — get notes by tag
- GET /api/search?q= — FTS5 search
- GET /api/dashboard — dashboard stats

## Acceptance Criteria
- Create tag → appears in tag list with count=0
- Add tag to note → count increments
- Search returns relevant notes ranked by relevance
- Dashboard shows all stats correctly
- FTS5 handles special characters safely
