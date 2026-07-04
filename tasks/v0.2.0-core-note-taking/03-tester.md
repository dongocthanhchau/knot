# v0.2.0 Core Note Taking — Test Plan

## Test Cases

### TC-01: Note CRUD
- Create note → appears in list with correct title
- Edit title → saves correctly
- Edit content → saves correctly
- Delete note → moves to trash (not in main list)
- Restore note → back in main list
- Permanently delete → gone from trash

### TC-02: Rich Text Editor
- Bold, italic, underline render correctly
- Headings H1-H3 work
- Lists (bulleted, ordered) work
- Code block with syntax highlighting
- Table insert + edit
- Link insert + clickable
- Image insert (from URL)
- Undo/redo works

### TC-03: Auto-Save
- Content saved within 2s of typing stop
- "Saved" indicator shows after save
- "Unsaved" shows when changes pending
- Refresh page → content persists
- Tab away and back → content still there

### TC-04: Search
- Type query → matching notes returned
- Search in title works
- Search in content works
- Empty query returns recent notes

### TC-05: Focus Mode
- Toggle hides sidebar + header
- Toggle back shows sidebar + header
- Preference persists within session

## Edge Cases
- Empty note (no content) — should save with empty paragraph
- Very long content (10k+ words) — should not lag
- Rapid typing — auto-save should debounce, not save every keystroke
- Network/DB error during save — show error state, don't lose content
- Delete while editing — redirect to note list
- Two tabs editing same note — last save wins (known limitation, no CRDT yet)
