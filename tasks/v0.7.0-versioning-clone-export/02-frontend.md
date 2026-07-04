# v0.7.0 Versioning + Clone + Export — Frontend Tasks

## Mục tiêu
Version history UI, clone dialog, export dialog.

## Tasks

### 2.1 Version History Panel
Component `src/components/versions/version-history.tsx`:
- Slide-out panel in note editor (click clock icon in toolbar)
- List of snapshots with: timestamp, char count, "Auto-saved" or manual label
- Visual diff indicator: which snapshots differ significantly
- Click snapshot → preview in read-only mode (modal or side-by-side)
- "Restore" button with confirmation: "This will create a safety snapshot first"
- "Delete" button for manual snapshots (auto-snapshots cannot be deleted individually)
- Pagination or infinite scroll for many versions
- Loading skeleton
- Empty state: "No versions yet. Versions are created automatically as you edit."

### 2.2 Clone Dialog
Component `src/components/clone/clone-dialog.tsx`:
- Trigger: "Clone note" in note menu or context menu
- Dialog with options:
  - Note title (editable, defaults to "Copy of {original}")
  - Checkbox: "Include tags"
  - Checkbox: "Include references"
  - Checkbox: "Include child notes" (deep clone)
- Preview: "This will create {N} notes"
- Confirm button → creates clone, navigates to new note
- Toast on success

Component `src/components/clone/clone-tree.tsx`:
- Show clone hierarchy in sidebar or note info panel
- "Source" link → navigate to original
- "Clones" list → navigate to each clone
- Tree visualization: source → clones → sub-clones

### 2.3 Export Dialog
Component `src/components/export/export-dialog.tsx`:
- Trigger: "Export" in note menu
- Dialog:
  - Format selector: Markdown | JSON | Plain Text
  - Scope: "Current note" | "Selected notes" | "All notes"
  - Structure: "Flat" | "Keep hierarchy"
  - Options: "Include tags in frontmatter", "Include references"
- Preview: "Will export {N} note(s) as {format}"
- Export button:
  - Single note: download file directly
  - Multiple/all: download zip
- Progress indicator for large exports

### 2.4 Export Page
`src/app/(app)/settings/export/page.tsx` — full settings page with export options:
- Same options as dialog but in page form
- Export history (last 5 exports)
- Note count, size estimate

## Acceptance Criteria
- Version panel shows timestamped snapshots
- Click snapshot → read-only preview
- Restore works with safety snapshot
- Clone dialog options work
- Clone tree shows hierarchy
- Export downloads correct format
- Zip export for multiple notes
- Frontmatter in markdown export
