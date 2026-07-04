# v0.4.0 Hierarchical Navigation — Backend Tasks

## Mục tiêu
Nested docs hierarchy, parent-child relationship, block references.

## Tasks

### 1.1 Nested Doc Management
Extend `src/server/notes.ts`:
- Parent-child relationship via `parent_id` field in notes table
- `moveNote(noteId: string, newParentId: string | null) => void` — reparent
- `getNotePath(noteId: string) => Note[]` — ancestry from root to note
- `getNoteTree(parentId?: string) => TreeNode[]` — recursive children
  - TreeNode: { note: Note, children: TreeNode[], depth: number, expanded: boolean }
- `getSiblings(noteId: string) => Note[]` — same-level notes
- Validation: prevent circular parent references (cannot set child as parent)
- Validation: max depth = 10 levels

### 1.2 Block References
File `src/server/block-refs.ts`:
- `createBlockRef(sourceNoteId: string, targetNoteId: string, blockId: string, context?: string) => BlockRef`
- `getBlockRefsForNote(noteId: string) => BlockRef[]` — incoming references
- `getOutgoingRefs(noteId: string) => BlockRef[]` — outgoing references
- `resolveBlockRef(refId: string) => { noteId, blockContent }` — get the actual block content
- `deleteBlockRef(id: string) => void`
- BlockRef type: { id, sourceNoteId, targetNoteId, blockId, context, createdAt }
- Note: blockId references within TipTap JSON. context = surrounding text snippet.

### 1.3 Hierarchy Stats
- `getTreeStats(noteId: string) => { depth, childCount, totalDescendants }`

## API Routes
- PATCH /api/notes/:id/move — move note (body: { parentId })
- GET /api/notes/:id/path — ancestry path
- GET /api/notes/:id/tree — children tree
- GET /api/notes/:id/siblings — siblings
- POST /api/refs — create block ref
- GET /api/notes/:id/refs — incoming refs
- GET /api/notes/:id/refs/outgoing — outgoing refs
- GET /api/refs/:id — resolve ref
- DELETE /api/refs/:id — delete ref

## Acceptance Criteria
- Move note under parent → appears in tree
- Path shows full ancestry
- Circular reference prevented (API returns error)
- Create block ref → appears in ref list
- Delete ref → removed
