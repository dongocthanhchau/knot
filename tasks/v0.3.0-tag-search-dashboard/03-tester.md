# v0.3.0 Tag System + Search + Dashboard — Test Plan

## Test Cases

### TC-01: Tag CRUD
- Create tag from sidebar → appears in tag list
- Rename tag → updates everywhere
- Delete tag → removed from all notes
- Tag badge shows on note in list and editor

### TC-02: Tag-Note Association
- Add tag to note via picker → badge appears
- Remove tag → badge disappears
- Note shows under tag in sidebar
- Click tag → filtered note list

### TC-03: Global Search
- Cmd+K opens overlay
- Empty state shows when no query
- Typing shows results after debounce
- Snippet highlights match
- Arrow keys + Enter navigates correctly
- Search page URL works directly

### TC-04: Dashboard
- Stats show correct numbers
- Recent notes list clickable
- Notes by tag chart renders
- New user sees welcome state
- Stats refresh on navigation

### TC-05: FTS5 Indexing
- New note appears in search results
- Updated note content reflected in search
- Deleted note removed from search
- Special characters don't break search

## Edge Cases
- Very long tag name (>50 chars)
- Tag with special characters
- Search with no results
- Rapid tag add/remove
- Dashboard with 0 notes
- Search while typing very fast
