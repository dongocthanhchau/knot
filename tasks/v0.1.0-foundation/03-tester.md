# v0.1.0 Foundation — Test Plan

## Phạm vi
Foundation layer: scaffold, schema, auth, layout, routing, theme.

## Test Cases

### TC-01: Build
- npm run dev starts
- npm run build succeeds
- No TypeScript errors

### TC-02: Database
- npm run db:generate exits 0
- npm run db:migrate creates knot.db
- All 8 tables exist (notes, tags, note_tags, note_versions, templates, note_links, graph_layouts, settings)
- Schema matches the DDL in 01-backend.md

### TC-03: Auth
- /login renders passphrase form
- Empty passphrase shows error
- Wrong passphrase shows error
- Correct passphrase creates session cookie
- Authenticated routes redirect to /login when no session
- /login redirects to / when already authenticated

### TC-04: Layout
- AppShell renders sidebar + header + main content
- Sidebar toggle collapses to icon-only mode
- Sidebar toggle expands back
- All nav links present (Dashboard, Notes, Tags, Settings)

### TC-05: Theme
- Theme toggle button visible in header
- Click toggles dark/light mode
- Preference persists after page reload

### TC-06: Routing
- / (dashboard) renders placeholder
- /notes/:id renders placeholder
- /tags renders placeholder
- /settings renders placeholder
- Unknown route shows 404 or redirects

### TC-07: Tauri
- `pnpm tauri dev` starts without errors
- Window title is "knot"
- Window size is 1200x800 default

## Edge Cases
- Multiple tabs: session should work across tabs (same browser)
- Rapid sidebar toggle: should not break layout
- Empty DB: app should not crash

## Notes
- All pages are placeholders in v0.1.0 — feature content starts in v0.2.0
- Auth is local-only (passphrase), no OAuth
- Tauri test requires `pnpm tauri dev` which needs Rust installed
