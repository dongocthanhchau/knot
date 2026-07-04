# v0.7.0 Versioning + Clone + Export — Backend Tasks

## Mục tiêu
Note versioning/snapshots (#8), clone notes (#7), export functionality (#20).

## Tasks

### 1.1 Note Versioning
File `src/server/versioning.ts`:
- `createSnapshot(noteId: string) => Snapshot` — save current state as version
- `getSnapshots(noteId: string) => Snapshot[]` — list all snapshots
- `getSnapshot(id: string) => Snapshot | null`
- `restoreSnapshot(noteId: string, snapshotId: string) => Note` — restore content from snapshot (creates new snapshot of current state first = safety save)
- `deleteSnapshot(id: string) => void`
- `autoSnapshot(noteId: string) => void` — called on save if 5+ min since last snapshot OR content changed by >30%
- Snapshot type: { id, noteId, title, content (TipTap JSON), createdAt, size (char count), description? }
- Snapshot storage: separate snapshots table (id, note_id, title, content TEXT, created_at, char_count, description)
- Config: maxSnapshotsPerNote (default: 50), autoSnapshotInterval (default: 5 min)

### 1.2 Clone Notes (#7)
File `src/server/clone.ts`:
- `createClone(noteId: string, options?: { includeRefs, includeTags, deep }) => Note`
  - shallow clone: copy title + content only
  - with refs: clone also copies block references
  - with tags: clone carries tags
  - deep: clone + nested children (recursive)
- `getCloneSource(noteId: string) => Note | null` — if note was cloned, return original
- `getClones(noteId: string) => Note[]` — all clones of this note
- Clone tracking: store clone_source_id in notes table (self-referencing FK)
- Clone tree: source → clone1 → clone1-child, source → clone2, etc.

### 1.3 Export (#20)
File `src/server/export.ts`:
- `exportNote(noteId: string, format: 'markdown' | 'json' | 'txt') => string`
  - markdown: TipTap JSON → markdown via tiptap-to-markdown
  - json: raw note data as JSON
  - txt: plain text extraction
- `exportAll(format: 'markdown' | 'json', options?: { includeTags, includeRefs }) => Blob`
  - Export all notes, optionally as zip
  - With tags: each note frontmatter includes tags
  - With refs: references as markdown links
- `exportToFile(noteId: string, format, filePath) => void` — write to filesystem
- Markdown export: # Title, ## headings preserved, lists, bold/italic, links, images, code blocks
- Frontmatter: --- title, created, updated, tags, id ---

### 1.4 Batch Export
- `exportSelected(noteIds: string[], format, options) => Blob`
- `exportWithStructure(noteIds: string[], format, structure: 'flat' | 'tree') => Blob`
  - tree: nested folders mirror hierarchy

## API Routes
- GET /api/notes/:id/versions — list snapshots
- POST /api/notes/:id/versions — create snapshot
- POST /api/notes/:id/versions/:snapshotId/restore — restore
- DELETE /api/notes/:id/versions/:snapshotId — delete snapshot
- POST /api/notes/:id/clone — clone note (body: { includeRefs, includeTags, deep })
- GET /api/notes/:id/clones — list clones
- GET /api/notes/:id/clone-source — get original
- GET /api/notes/:id/export — export single note (query: format)
- POST /api/export — batch export (body: { noteIds?, format, structure? })

## Acceptance Criteria
- Create snapshot → version appears in list
- Restore snapshot → note content replaced
- Auto-snapshot fires on save after interval
- Clone creates new note with copy of content
- Deep clone includes children
- Export note as markdown has correct formatting
- Export all produces valid output
- Frontmatter includes metadata
