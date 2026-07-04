# v0.7.0 Versioning + Clone + Export — Test Plan

## Test Cases

### TC-01: Version Snapshots
- Manual snapshot → appears in version list
- Snapshot shows correct timestamp
- Preview loads content correctly
- Auto-snapshot fires after editing (5 min / 30% change)

### TC-02: Restore
- Restore snapshot → note content replaced
- Safety snapshot created before restore
- Can restore to earlier version after restore (history preserved)

### TC-03: Clone
- Clone note → new note with "Copy of" title
- Clone with tags → tags carried over
- Clone with refs → refs carried over
- Deep clone → children cloned recursively
- Clone source tracked correctly

### TC-04: Clone Tree
- Clone shows under "Clones" in source note
- Source link navigates correctly
- Multi-level clone chain displays correctly

### TC-05: Export Single Note
- Markdown export: correct formatting
- JSON export: valid JSON with all fields
- TXT export: plain text without formatting
- Frontmatter includes metadata

### TC-06: Batch Export
- Export all → zip download
- Export selected → zip with only those notes
- Tree structure → nested folders
- Frontmatter options respected

## Edge Cases
- Restore to current version — safety snapshot still created
- Clone a cloned note — chain continues
- Export note with no content — empty file with frontmatter
- Export 100+ notes — progress indicator
- Delete auto-snapshot — should not be allowed
- Very old snapshot — should still load correctly
- Rapid manual snapshots — capped at maxSnapshotsPerNote
