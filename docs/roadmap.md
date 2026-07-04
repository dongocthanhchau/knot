# Roadmap

7 phases → 12 phases (7 numbered + 5 continuation phases), 14 weeks.

## Phase 1 — Core Notes (Weeks 1-2)

Foundation: the note-taking engine and basic UI shell.

- [ ] Scaffold Next.js + Tailwind + shadcn/ui project structure
- [ ] SQLite schema design + Drizzle ORM migrations
- [ ] Atom CRUD (create, read, update, soft-delete)
- [ ] TipTap markdown editor with basic formatting toolbar
- [ ] Tag system (CRUD, hierarchical parent-child, color assignment)
- [ ] Full-text search via FTS5
- [ ] Basic UI: AppShell layout, Sidebar (icon-only), MainPanel, StatusBar
- [ ] Cmd+K search overlay with basic text search
- [ ] Note list page with sort/filter by date, title, tag

**Deliverable**: Working note editor with tags and search. Looks rough but functional.

---

## Phase 2 — Navigation (Weeks 3-4)

Information architecture: browsing, organizing, and navigating notes.

- [ ] Hierarchical tag tree in left sidebar (collapsible, color-coded)
- [ ] Tag page — shows all notes under a tag + child tags. "Generate Wiki" button placeholder
- [ ] Note detail page with full metadata display
- [ ] Right Panel with: properties panel (timestamps, word count), backlinks list
- [ ] Doc Context Graph (Local Node Map) — mini force graph in right panel showing 1-2 hop connections around the current note
- [ ] Doc Hierarchy Tree — interactive tree view showing current note's position (parent/siblings/children) in right panel
- [ ] Full search page with extended filters (tag scope, date range, sort)
- [ ] Resizable panels (left sidebar + right panel drag handles)
- [ ] Keyboard shortcut cheat sheet (Cmd+/ to show)

**Deliverable**: Polished navigation with local graph and hierarchy tree. Three-zone layout fully functional. Search is powerful.

---

## Phase 3 — Canvas (Weeks 5-6)

Spatial visualization: graphs, maps, and interactive diagrams.

- [ ] D3 force-directed graph rendering (SVG)
- [ ] NoteNode component (circles/rectangles with title, tag color)
- [ ] EdgeLine component (solid = manual, dashed = auto-similarity)
- [ ] Zoom, pan, and fit-to-screen controls
- [ ] Node hover preview (title + first line + tags)
- [ ] Click node → open note in main panel
- [ ] Canvas toolbar: tag filter dropdown, layout reset, toggle auto-edges
- [ ] Graph snapshot component (static mini-graph for dashboard/briefing)

- [ ] Auto Mind Map — AI prompt → JSON Canvas → ELK radial layout → React Flow render
- [ ] Tree Map view — ELK layered + ORTHOGONAL hierarchy (PCB-style no-overlap routing)
- [ ] Node Map Editor — React Flow interactive graph editor with drag-drop nodes/edges
- [ ] Hierarchical drill-down graph: sub-graph node support (subGraphId), click-to-drill zoom transitions, breadcrumb navigation, graph history stack
- [ ] Connection strength encoding: multi-factor strength engine (links, tags, embedding, reciprocity), visual mapping (edge thickness/opacity/dash, node scale/border/saturation), sensitivity slider, legend, weighted/uniform toggle
- [ ] Auto-expand / auto-collapse: viewport-based branching, compact/expanded toggle, ELK per-level re-layout
- [ ] Presentation mode: full-screen graph walkthrough, auto-advance, slide-like level transitions
- [ ] Map embed system — \`/map\` slash command in TipTap, inline render (view/interactive/full-screen)
- [ ] Drawing Canvas — Excalidraw inline whiteboard embed
- [ ] ELK layout engine — abstraction for multiple layout algorithms (radial, layered, mrtree, force)
- [ ] Map styling — per-node color/font/border, per-edge arrow/label/width, groups/frames
- [ ] Map export — JSON Canvas (.canvas), PNG, SVG
- [ ] Database view — table + kanban + gallery views for note metadata

**Deliverable**: Interactive graph workspace: all 5 graph types with hierarchical drill-down, auto-expand/collapse, presentation mode, and connection strength encoding (weighted edges/nodes)

---

## Phase 4 — AI Features (Weeks 7-8)

Intelligence: embeddings, semantic search, auto-tagging, chat, wiki, similar notes.

- [ ] AI provider configuration UI (Settings → AI: provider, model, API key)
- [ ] Embedding pipeline — on note create/update, generate embedding via LLM provider
- [ ] Hybrid search (FTS5 + vector cosine similarity + RRF merge)
- [ ] Semantic search mode tabs in Cmd+K overlay (Best match / Text / Semantic)
- [ ] Similar notes panel in Right Panel (top-5 nearest neighbors)
- [ ] One-click "Link" button to create bidirectional links
- [ ] Auto-tagging on save with 3 modes (Suggest / Auto-apply / Manual)
- [ ] Agentic Chat panel with SSE streaming, scope selector, citation cards
- [ ] Wiki Synthesis generation with inline citations and TOC
- [ ] Chat session history management

- [ ] AI Shadow Doc — auto-generate compact summaries for every doc via LLM; SSE events for subscribers; MCP `get_doc_context` integration
- [ ] Second Knowledge layers — doc relation graph (auto-inferred edges: prerequisite/continues/similar/references/contradicts/example_of), workspace glossary (auto-extracted domain terms), temporal delta (semantic changelog), agent context cache (pre-computed per consumer type)
- [ ] AI Insights Panel — `/ai/insights` dashboard with Recent Activity timeline, Inferred Edges management (confirm/reject), Glossary viewer, Temporal changelog, Token Economy chart
- [ ] AI Visibility UI — Shadow tab in Right Panel with status badge, summary, key points, entities, tags, thumbs up/down feedback; graph toggles for inferred edges (dashed colored lines) and ghost nodes (dashed outline)
- [ ] AI Settings — enable/disable each second knowledge layer, cron interval, token budget per layer

**Deliverable**: All AI features functional. App becomes a knowledge assistant, not just a note-taker.

---

## Phase 5 — Polish (Weeks 9-10)

Integration, reliability, and cross-device readiness.

- [ ] Daily Briefing — auto-generated on first open of the day
- [ ] RSS feeds — add sources, fetch entries, background polling
- [ ] MCP Server + HTTP API — settings page with config, tools, resources, log viewer. REST API on :8767 with OpenAPI docs. All features accessible programmatically.
- [ ] Settings page — general preferences, AI providers, integrations
- [ ] PWA / offline support — service worker, IndexedDB cache, manifest
- [ ] Dark mode — system-aware theming with manual override
- [ ] Responsive layout — mobile drawers for side panels, touch interactions
- [ ] Keyboard shortcut reference (Cmd+/ cheat sheet modal)
- [ ] Loading states, error boundaries, empty states for every page
- [ ] Performance audit — DB query profiling, bundle analysis, render optimization
- [ ] Rich editor expansion — font/size/color pickers, alignment (L/C/R/J), line spacing, multi-level lists
- [ ] Page layout system — A4/page dimensions, margins, section breaks, per-section headers/footers, multi-column
- [ ] Table editor — insert/edit tables with merge/split cells, borders, cell styling
- [ ] Image embed — upload, resize handles, alignment, captions
- [ ] Fill-in blanks — placeholder dot-leader blanks for worksheets/templates
- [ ] Footnotes — inline reference + bottom-of-page with auto-numbering
- [ ] Rich toolbar refactor — multi-row floating toolbar, context-sensitive controls
- [ ] Template System — save doc as template, template library browser, apply with {{variable}} substitution, section-based templates
- [ ] Export pipeline — single PDF (WeasyPrint/Playwright), single DOCX (python-docx), batch group export as combined file
- [ ] Export settings dialog — page size (A4/Letter), margins, orientation, font mapping, template binding

**Deliverable**: Production-ready knowledge management app with professional editing, templates, and export. Ship it.

---

## Phase 6 — Extended Features (Weeks 11-12)

Advanced knowledge management: versioning, cross-referencing, and media.

- [ ] Hierarchical Nested Docs — parent-child tree in sidebar, drag-drop reorder
- [ ] Block References — paragraph-level cross-references with inline preview
- [ ] Clone Notes — one note in multiple tree locations, synced updates
- [ ] Note Versioning & History — every save versioned, diff view, revert
- [ ] Spaced Repetition Flashcards — FSRS scheduler, cloze deletion, review queue
- [ ] Web Clipping — browser bookmarklet, readability extraction, auto-tag
- [ ] PDF Annotation → Note — upload PDF, highlight, extract annotations as notes
- [ ] Scheduled Reports — recurring AI-generated summaries (daily/weekly/monthly)

**Deliverable**: Fully-featured knowledge management with version history, cross-references, and external content ingestion.

---

## Phase 7 — Platform & Collaboration (Weeks 13-14)

Platform features: automation, collaboration, and presentation.

- [ ] Slides / Presentation Mode — markdown-to-slides with full-screen presentation
- [ ] Scripting API — JavaScript sandbox, knot.* objects, event hooks, script management
- [ ] CRDT Real-Time Collaboration — Yjs-based, optional WebSocket sync server
- [ ] Multi-device sync — Turso/libsql for optional remote database sync
- [ ] Community script marketplace (infrastructure) — script sharing format, import/export
- [ ] Performance optimization — DB query profiling, bundle analysis, render optimization

**Deliverable**: Platform-ready with collaboration, automation, and presentation capabilities.


---

## Phase 4+: AI Feature Gaps (External Research Q2 2026)

Research từ 15+ PKM projects (Atomic, Reor, SwarmVault, Obsidian/Logseq AI ecosystem) — các tính năng Knot chưa có, ranked theo effort/value:

### P2 — High value, low effort (1-2 days each)

- [ ] **AI Flashcards** — LLM generate Q&A flashcards từ notes. Reuse Wiki Synthesis + embedding pipeline. Display in spaced repetition view. ~2 days.
- [ ] **Missing Citation Detection** — On-save LLM check: "claim này có source không?" Nếu không → suggest link/chỗ cần bổ sung. ~1 day.
- [ ] **Voice Note → Auto-Note** — Ollama Whisper → STT → LLM tóm tắt + tag + classify folder. ~2 days.
- [ ] **Ghost Text Autocomplete** — Inline AI suggestions khi gõ (giống Cursor/Copilot). Lightweight, single LLM call. ~1 day.
- [ ] **AI Template Filler** — Chọn template → LLM điền nội dung từ context notes. ~1 day.
- [ ] **Natural Language → Query** — "Tìm notes về MCP server" → auto-generate semantic search query. ~1 day.
- [ ] **Smart Context Packs** — LLM bundle relevant notes cho agent handoff / task switch. Reuse AI Second Knowledge Layer 5. ~2 days.

### P3 — Medium effort, differentiated

- [ ] **Knowledge Gap Analysis** — Batch job cluster embedding vectors → detect topics chưa có notes. ~2 days.
- [ ] **Contradiction Scanner** — SPO triple extraction + cross-note comparison → "Conflicting claim detected" with diff. ~3 days.
- [ ] **Anti-Drift Linting** — Định kỳ scan: stale sources, contradictory claims, orphaned notes. ~2 days.

### Project Comparison Matrix

| Feature | Knot | Atomic | Reor | SwarmVault | Obsidian AI |
|---------|------|--------|------|------------|-------------|
| Semantic Search | ✅ | ✅ | ✅ | ✅ | Plugin |
| Auto-Tagging | ✅ | ✅ | ❌ | ❌ | Plugin |
| Agentic Chat (RAG) | ✅ | ✅ | ✅ | ✅ | Plugin |
| Wiki Synthesis | ✅ | ✅ | ❌ | ❌ | ❌ |
| Daily Briefing | ✅ | ✅ | ❌ | ❌ | ❌ |
| MCP Server | ✅ | ✅ | ❌ | ✅ | ❌ |
| Flashcards | ❌ | ❌ | ✅ | ❌ | Plugin |
| Ghost Autocomplete | ❌ | ❌ | ❌ | ❌ | Plugin |
| Contradiction Detection | ❌ | ✅ | ❌ | ✅ | ❌ |
| Knowledge Gap Analysis | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voice Transcription | ❌ | ❌ | ❌ | ✅ | ❌ |
| Source Management | (RSS) | (RSS) | ❌ | ✅ | ❌ |
| Anti-Drift Lint | ❌ | ❌ | ❌ | ✅ | ❌ |
| NL → Query | ❌ | ❌ | ❌ | ❌ | Plugin |
| Provenance Graph | ❌ | ❌ | ❌ | ✅ | ❌ |



---

## Phase 5+: Cross-Cutting Features (Q3 2026+)

### Notification System (P1 — gating feature cho web)
Hệ thống notification nội bộ cho mọi AI feature. Cần thiết trước khi xây web client.

- [ ] NotificationService — push, markRead, list, cleanup
- [ ] Notification Center UI — bell icon, dropdown, unread badge
- [ ] Preferences — per-type toggle, mute per feature
- [ ] Desktop integration — Tauri notification API
- [ ] Future: SSE + Web Push cho web client
- **Dependency**: Cần trước mọi AI feature khác để có channel thông báo

### Location-Based Suggestion (P2)
Geolocation-aware note suggestions khi đi du lịch / làm việc.

- [ ] LocationService — Geolocation API wrapper + Nominatim reverse geocode
- [ ] LocationCache — 24h cache, rate-limit guard (1 req/sec)
- [ ] Note location tagging — frontmatter `location:` field
- [ ] Match engine — city/district name match + coordinate proximity
- [ ] Suggestion UI — notification + location card
- [ ] Privacy controls — opt-in, GPS_ONLY mode, DENIED mode
- **Privacy**: Off by default. No telemetry. All local.

### Task/Work Reminders (P2)
Time-based reminders attached to notes, custom text, or URLs. Delivered in-app + desktop notification.

- [ ] Reminder CRUD — create (absolute/relative/recurring), list, complete, cancel
- [ ] Reminder Evaluation Engine — poll every 60s, fire due reminders, compute next recurrence
- [ ] Slash command `/remind` — inline reminder creation in editor
- [ ] Reminder List view — `/reminders` sidebar panel, grouped by Pending/Today/Overdue/Completed
- [ ] Snooze — 5m/15m/1h options, recurring snooze only affects current instance
- [ ] Desktop notification — Electron `Notification` API, click opens linked note
- [ ] Status bar badge — tray icon with overdue count
- [ ] Recurrence support — RRULE / cron expression
- **SQLite**: `reminders` table with FK to notes, indexed by trigger_at + status
- **Dependency**: Notification System (for delivery channel)


---

## Phase 6+: Plugin Infrastructure (Q3-Q4 2026)

Plugin system foundation + ecosystem. Mở rộng Knot thành nền tảng.

### P1 — Core Infrastructure (Plugin Foundation)

- [ ] **Plugin Manifest & Loader** — scan `~/.knot/plugins/`, validate manifest, lifecycle management, dependency resolution
- [ ] **Extension Points (Hook System)** — lifecycle hooks, data hooks, AI hooks, UI hooks, event bus pub/sub, priority pipeline
- [ ] **Plugin Manager UI** — list, enable/disable, uninstall, detail page, auto-generated config UI, error log
- [ ] **MCP Integration** — plugin tools tự động exposed qua MCP catalog với prefix `plugin.<id>.<tool>`

### P2 — Plugin APIs

- [ ] **Source Plugin API** — `fetch()` / `transform()` / `sync()` interface, scheduling, conflict resolution
  - Built-in targets: Notion, Google Keep, Apple Notes, GitHub Issues, Confluence
- [ ] **AI Provider Plugin** — `chat()` / `embed()` / `classify()` interface, model routing, fallback chain, cost tracking
  - Built-in targets: OpenAI, Anthropic, Gemini, Groq, vLLM
- [ ] **Export Plugin API** — `export()` interface, progress reporting
  - Built-in targets: Notion push, Obsidian vault, Anki, static site, CSV
- [ ] **Plugin Sandbox** — QuickJS runtime, permission enforcement, resource limits (64MB, 500ms/call, 10 req/s), audit log

### P3 — Ecosystem

- [ ] **UI Plugin API** — custom note types (structured editor), custom panels (sandboxed iframe), custom editors (diagram, mindmap), theme plugins
- [ ] **Plugin Store / Marketplace** — GitHub community repo, browse/search/install UI, auto-update, one-click install, ratings
- [ ] **Plugin SDK** — `knot-sdk` npm package + `knot-sdk` Python package, TypeScript types, example plugins, documentation
- [ ] **Hot Reload** — file watcher on plugin directory, auto re-load on change without restart
- [ ] **Plugin Debugger** — per-plugin console, breakpoint support, hook call trace

**Deliverable**: Knot becomes a platform. Third-party developers can extend every aspect of the app without modifying core code.

**Dependency**: Plugin Sandbox cần trước khi cho phép third-party plugins. Core infrastructure (Loader + Hooks) là gating item cho mọi thứ khác.


---

## Phase 7+: Fediverse / Federation (Q4 2026+)

Khả năng chạy Knot dưới dạng mạng lưới server cha↔con, cho phép tổ chức tri thức theo mô hình phân tán. Mỗi Space (môn học/chủ đề) là đơn vị đồng bộ — central server lưu tất cả, child server sync subset được phân quyền.

### P1 — Core Sync Engine

- [ ] **Space-Based Architecture (#65)** — spaces, space_members, change_log (entity-based tracking), sync_cursors, conflicts tables. Central server stores all Spaces. ~3 days.
- [ ] **Change Log & Sync Protocol (#65)** — Pull (cursor-based) / Push protocol. Request signing with Ed25519. Central respond with changes/conflicts. ~2 days.
- [ ] **Server Registration (#66)** — Ed25519 key pair generation, POST /register handshake, server_id + API key issuance, admin grant flow via central UI. ~1 day.
- [ ] **Selective Sync & Permissions (#67)** — Per-space API keys / signed JWTs. Roles: owner/editor/viewer. Permission validation on every pull/push. Revocation via WebSocket. ~3 days.

### P2 — Conflict Handling & Security

- [ ] **Conflict Resolution (#68)** — Auto-merge (non-overlapping fields), LWW (same field, later timestamp wins), conflict log with diff view, admin resolution UI. ~2 days.
- [ ] **Server Identity & Transport Security** — Ed25519 signature verification on every request. TLS 1.3 mandatory. SQLCipher for node at-rest data. ~1 day.
- [ ] **Offline Support** — Local change_log with status tracking (pending/synced/conflicted). Exponential backoff retry. Periodic sync on reconnect. ~2 days.
- [ ] **E2E Encryption** — Per-space XChaCha20-Poly1305, Argon2id key derivation, multi-editor asymmetric key wrapping. Metadata visibility options (full/relaxed/none). ~3 days.

### P3 — Advanced Federation

- [ ] **Full Metadata E2E** — Titles, tags, timestamps encrypted. Central relay-only (cannot read content). ~2 days.
- [ ] **Migration Tooling** — Export space as SQLite, child import, register, initial full sync → incremental deltas. ~2 days.
- [ ] **WebSocket Real-Time Push** — space_updated, conflict_detected, permission_revoked events. ~1 day.
- [ ] **Peer-to-Peer Sync** — Child-to-child direct sync (Bluesky-style). Bypass central for Spaces that don't need relay. ~4 days.

### Future

- [ ] CRDT real-time collaboration (Yjs/Automerge) — v2 after LWW baseline stable
- [ ] Federation gateway — Knot ↔ Anytype / Trilium import via Export Plugin API
- [ ] Public read-only Spaces (blog-style publishing)

**Deliverable**: Knot runs as a federated knowledge network. Central server as hub, child servers on personal machines auto-sync authorized subsets.

**Dependency**: HTTP API (#55) needed for sync endpoints. Database schema must be stable before building change_log engine.


## Phase 8: Export Engine System

### P1 — Core Export (priority: high, ~5 days)
- [ ] **Export Engine Core** — Render pipeline: Markdown → AST → format-specific renderer. Job queue for background processing. ~2 days.
- [ ] **PPTX Exporter** — Native python-pptx engine. Template-based (upload PPTX as base, content fills placeholders). Headings→slides mapping. ~1 day.
- [ ] **DOCX Exporter** — python-docx with {{placeholder}} replacement. Brand theme support (fonts, colors, logo). ~1 day.
- [ ] **PDF Exporter** — WeasyPrint HTML+CSS rendering. Layout presets (A4/letter, portrait/landscape, margin). ~1 day.
- [ ] **Image Exporter** — Playwright/PNG|JPEG|WebP. Styled note cards. Options: width, background, card style. ~1 day.
- [ ] **SVG Exporter** — Note → structured SVG vector output. For whiteboard embedding. ~0.5 day.
- [ ] **Template Manager** — Upload, list, delete templates. AI placeholder extraction from uploaded files. ~1 day.

### P2 — API & Integration (priority: medium, ~3 days)
- [ ] **MCP Export Tools** — export.render, export.list_templates, export.upload_template, export.batch, export.formats. ~1 day.
- [ ] **HTTP Export API** — REST endpoints mirroring MCP tools. OpenAPI docs. ~1 day.
- [ ] **Batch Export** — Multi-note → single PPTX/DOCX or ZIP bundle. Job status polling + SSE progress. ~1 day.
- [ ] **Export Plugin API (#63) expansion** — Plugin đăng ký format mới qua interface `export(note, options)` → bytes. Plugin format auto-registers in MCP + HTTP catalog. ~1 day.
- [ ] **Presenton integration** — Optional PPTX backend: gọi Presenton API thay vì native engine. Configurable via knot.yaml. ~0.5 day.

### P3 — Advanced (priority: low, ~4 days)
- [ ] **Auto-Export Rules** — User-defined rules: tag→format→template mapping. Scheduled (cron). ~2 days.
- [ ] **Template Marketplace** — Community-shared templates, installable via Plugin Store. ~1 day.
- [ ] **AI Template Suggestion** — LLM tự động chọn template/match template dựa trên note content. ~1 day.
- [ ] **Google Slides / Keynote export** — Via Export Provider Plugin. ~1 day.

**Deliverable**: Export any note as image/Word/PDF/PPTX from UI or API. External tools (Claude Code, Cursor, scripts) integrate via MCP/HTTP.

**Dependency**: Plugin System (#56-#64) core for Export Plugin API. MCP Server (#55) for API layer. Template system depends on file storage layer.

