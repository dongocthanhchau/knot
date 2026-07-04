# v0.3.0 Tag System + Search + Dashboard — Frontend Tasks

## Mục tiêu
Tag management UI, global search overlay, dashboard page.

## Tasks

### 2.1 Tag System UI
Components in `src/components/tags/`:
- `tag-badge.tsx` — small colored badge with tag name and X to remove
- `tag-picker.tsx` — dropdown/search to add tags to a note
- `tag-list.tsx` — sidebar section showing all tags with note counts
- `tag-management.tsx` — full tag manager page (rename, delete, view notes)

Pages:
- Expand tag in sidebar → show notes under that tag
- Click tag badge in note editor → filter by tag

### 2.2 Global Search
Component `src/components/search/search-overlay.tsx`:
- Cmd+K / Ctrl+K to open
- Modal overlay with search input
- Results appear as you type (debounce 300ms)
- Each result shows: title, snippet with match highlighted, path
- Arrow keys to navigate results
- Enter to open note
- Escape to close
- Recent searches (last 5, localStorage)
- Empty state: "Search your notes..."

Create `src/app/(app)/search/page.tsx` for full search page.

### 2.3 Dashboard Page
`src/app/(app)/dashboard/page.tsx`:
- Stats cards: Total Notes, Total Tags, Notes This Week
- Recent notes list (last 5 edited, click to open)
- Notes by tag bar chart (simple, CSS-based or recharts)
- Welcome message for new users (0 notes)
- Refresh on page load, auto-refresh every 30s

### 2.4 Integrations
- Note editor: add tag picker to note header/metadata area
- Note list: show tags as small badges under each note title
- Search: index note on every save

## Acceptance Criteria
- Create tag from tag picker → badge appears on note
- Click tag → shows all notes with that tag
- Cmd+K opens search overlay
- Typing shows results with highlighted snippets
- Dashboard shows real stats
- Search page works as standalone page
