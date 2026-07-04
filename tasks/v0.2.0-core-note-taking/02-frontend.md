# v0.2.0 Core Note Taking — Frontend Tasks

## Mục tiêu
TipTap rich text editor, note list, auto-save UI, focus mode.

## Tasks

### 2.1 TipTap Editor
Install: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-underline, @tiptap/extension-text-align, @tiptap/extension-image, @tiptap/extension-table, @tiptap/extension-link, @tiptap/extension-placeholder, @tiptap/extension-code-block-lowlight, lowlight

Create `src/components/editor/editor.tsx`:
- Rich text toolbar: Bold, Italic, Underline, Strike, Code, Heading (H1-H3), Bullet list, Ordered list, Blockquote, Code block, Divider, Table, Link, Image
- Placeholder: "Start writing..."
- Slash menu (basic): type / to show command menu
- Markdown shortcuts: # → H1, ## → H2, **bold**, *italic*, etc.
- Read-only mode support

### 2.2 Note List / Browser
`src/components/notes/note-list.tsx`:
- List of notes with title, preview (first 100 chars), updated_at
- Create note button
- Click to open in editor
- Delete (soft) with confirmation

### 2.3 Note Editor Page
`src/app/(app)/notes/[id]/page.tsx`:
- Load note content on mount
- TipTap editor with toolbar
- Auto-save indicator ("Saving..." / "Saved" / "Unsaved changes")
- Back to notes list button
- Delete note button (with confirmation dialog)

### 2.4 Auto-Save UI
- Status bar at bottom of editor
- States: "Saving..." (debounce), "Saved" (confirmation), "Unsaved" (changes pending)
- Show last saved timestamp

### 2.5 Focus Mode (#43)
`src/components/editor/focus-mode.tsx`:
- Toggle in editor toolbar
- Hides sidebar
- Hides header
- Full-screen editor with minimal chrome
- Remember preference per session

## Acceptance Criteria
- Create a note, see it in the list
- Click note opens in editor
- Rich text toolbar formats text correctly
- Images/links/tables insert and render
- Auto-save fires and shows "Saved" indicator
- Delete moves to trash (not permanently gone)
- Focus mode hides chrome
