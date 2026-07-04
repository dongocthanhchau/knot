# v0.4.0 Hierarchical Navigation — Frontend Tasks

## Mục tiêu
Nested doc tree in sidebar, drag-and-drop reorder, breadcrumb nav, block references UI.

## Tasks

### 2.1 Doc Hierarchy Tree (#16)
Component `src/components/navigation/doc-tree.tsx`:
- Recursive tree view in sidebar
- Expand/collapse per folder
- Icons: folder open/closed, document
- Drag-and-drop to reparent (using @dnd-kit or native HTML5 drag)
- Right-click context menu: New note, New sub-note, Rename, Delete, Move to...
- Auto-scroll on drag near edge
- Animate expand/collapse
- Loading skeleton for large trees

Component `src/components/navigation/tree-node.tsx`:
- Single note in tree
- Drag handle
- Shows title (truncated)
- Active note highlighted
- Indent based on depth (padding-left)

### 2.2 Breadcrumb Navigation
Component `src/components/navigation/breadcrumb.tsx`:
- Show at top of note editor
- Full path: Home > Parent > Current Note
- Click any segment to navigate
- Loading state while path resolves

### 2.3 Block References UI
Components in `src/components/references/`:
- `reference-list.tsx` — list of incoming references for current note
  - Each ref shows: source note title, context snippet, click to navigate
  - Section in note sidebar or bottom panel
- `create-reference.tsx` — select block in current note, link to another note
  - Open target note picker
  - Select target + confirm
- `reference-badge.tsx` — small indicator that a block has outgoing refs
- `reference-panel.tsx` — collapsible panel in note view showing incoming + outgoing refs

### 2.4 Note Tree Page
`src/app/(app)/notes/page.tsx` — root notes view:
- Shows tree of all notes (from root)
- Create new root note button
- Search within tree (filter visible nodes)

## Acceptance Criteria
- Tree shows parent-child hierarchy correctly
- Drag note onto another → becomes child
- Breadcrumb shows correct path
- Click breadcrumb segment → navigates
- Reference panel shows incoming refs
- Create reference from block → links notes
- Expand/collapse animation smooth
- Right-click context menu works
