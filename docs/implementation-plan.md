# Implementation Plan — knot

> **Your knowledge, connected.**
>
> A local-first PKM app built with Next.js + SQLite + TipTap, targeting students, researchers, and knowledge workers. V1 ships a "Visual Knowledge Foundation" in 8 weeks with 21 features.

---

## Overview

### Project Summary

Knot is a desktop-oriented PKM (Personal Knowledge Management) web application that turns notes into an interactive knowledge graph. Every note is a node, every link is an edge, and connections carry weight. The app is built as a monolith (Next.js handles both frontend and backend) with SQLite for storage (better-sqlite3 + sqlite-vec for hybrid search), TipTap for rich text editing, and D3.js for graph visualization. AI features (embeddings, semantic search, auto-tagging, chat) are powered by Ollama/OpenRouter/OpenAI.

### Key Principles

1. **Working demo at each phase** — Every phase must produce a shippable increment. Phase 0 produces a scaffold that compiles. Phase 1 produces a searchable note-taker. Never two weeks without a demo.
2. **Data-first design** — Schema changes before UI. Every feature starts with its database migration and service layer, then the API route, then the component.
3. **Test-first for critical paths** — Search, linking, and export pipelines require tests. UI components can be verified manually in early phases.
4. **Progressive disclosure** — Graph complexity is hidden behind toggles and sliders. The default experience is simple; power features are one click away.
5. **AI features are additive, not essential** — Every AI feature degrades gracefully when the LLM is unreachable. The app remains fully usable without AI.
6. **Single dev, strict scope** — 8-week hard cap for V1. Features that don't fit slip cleanly to V1.1 or V2. No scope creep.

---

## Phase 0: Foundation (Week 1)

### Goal
Scaffold the entire project structure, database schema, auth foundation, and CI pipeline. By end of week 1, the app compiles and serves a blank authenticated shell.

### Project Scaffolding

| Task | File / Path | Details |
|------|-------------|---------|
| Initialize Next.js 14 App Router | `knot/` | `bun create next-app` with TypeScript, Tailwind, App Router |
| Configure Tailwind + shadcn/ui | `tailwind.config.ts`, `src/components/ui/` | Add shadcn/ui base components: Button, Input, Modal, Toast, Popover |
| Set up Drizzle ORM | `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `drizzle.config.ts` | Configure better-sqlite3 driver, define all initial tables |
| Create env config | `.env.example`, `.env.local` | `DATABASE_URL`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `NEXT_PUBLIC_APP_URL` |
| Scaffold AppShell layout | `src/app/(main)/layout.tsx`, `src/components/layout/` | AppShell, Sidebar (72px icon-only), MainPanel, StatusBar stubs |
| Create auth foundation | `src/lib/auth/` | Simple API-key or file-based auth (single-user, local-first). No OAuth for V1 |
| Set up import aliases | `tsconfig.json` | `@/` → `src/` |
| Configure ESLint + Prettier | `.eslintrc.json`, `.prettierrc` | Standard Next.js config |

### Core Data Model — SQLite Schema (`src/lib/db/schema.ts`)

All tables defined as Drizzle ORM schemas. First migration generated and applied.

```sql
-- atoms: fundamental unit of knowledge (notes)
CREATE TABLE atoms (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  parent_id   TEXT REFERENCES atoms(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',       -- TipTap JSON
  content_text TEXT NOT NULL DEFAULT '',       -- Plain text extract for FTS
  embedding   BLOB,                           -- F32 vector (sqlite-vec)
  page_layout TEXT,                           -- JSON: { pageSize, margins, orientation }
  template_id TEXT REFERENCES templates(id),
  doc_type    TEXT NOT NULL DEFAULT 'note' CHECK(doc_type IN ('note', 'map', 'drawing')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT                            -- soft delete
);
CREATE INDEX idx_atoms_parent ON atoms(parent_id);
CREATE INDEX idx_atoms_updated ON atoms(updated_at);
CREATE INDEX idx_atoms_deleted ON atoms(deleted_at);

-- tags: hierarchical tag system
CREATE TABLE tags (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name       TEXT NOT NULL UNIQUE,
  parent_id  TEXT REFERENCES tags(id) ON DELETE SET NULL,
  color      TEXT NOT NULL DEFAULT '#6B7280',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tags_parent ON tags(parent_id);

-- atom_tags: many-to-many join
CREATE TABLE atom_tags (
  atom_id TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (atom_id, tag_id)
);

-- links: bidirectional connections between atoms
CREATE TABLE links (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source_atom_id  TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
  target_atom_id  TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'manual' CHECK(type IN ('manual', 'auto')),
  strength        REAL DEFAULT NULL,            -- cached strength (0.0-1.0)
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_atom_id, target_atom_id)
);
CREATE INDEX idx_links_source ON links(source_atom_id);
CREATE INDEX idx_links_target ON links(target_atom_id);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE fts5_atoms USING fts5(
  title, content_text, content='atoms', content_rowid='id'
);

-- sqlite-vec virtual table for vector search
CREATE VIRTUAL TABLE vec_atoms USING vec0(
  embedding FLOAT(384) distance_metric=cosine
);

-- templates: reusable document templates
CREATE TABLE templates (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name              TEXT NOT NULL,
  icon              TEXT NOT NULL DEFAULT '📄',
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT DEFAULT 'custom' CHECK(category IN ('educational','report','note','custom')),
  cover_page        TEXT,                      -- JSON
  sections          TEXT NOT NULL DEFAULT '[]', -- JSON array
  variables         TEXT NOT NULL DEFAULT '{}', -- JSON record
  content           TEXT,                      -- JSON TipTap snapshot
  parent_template_id TEXT REFERENCES templates(id),
  built_in          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- versions: note versioning
CREATE TABLE versions (
  id       TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  atom_id  TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
  content  TEXT NOT NULL,
  title    TEXT NOT NULL,
  hash     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_versions_atom ON versions(atom_id);

-- template_atoms: tracks which docs were derived from which templates
CREATE TABLE template_atoms (
  atom_id     TEXT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  derived_from TEXT,                           -- template version snapshot ID
  PRIMARY KEY (atom_id, template_id)
);
```

### Seed Migration Scripts

- `drizzle/0000_initial.sql` — All tables above
- `drizzle/0001_fts5.sql` — FTS5 virtual table creation
- `drizzle/0002_vec.sql` — sqlite-vec virtual table creation
- `src/lib/db/seed.ts` — Seed script that inserts 10 built-in templates from `docs/templates.md`

### CI/CD Pipeline

| Tool | Purpose | Config File |
|------|---------|-------------|
| GitHub Actions | CI on push/PR | `.github/workflows/ci.yml` — lint + typecheck + test build |
| Drizzle Kit | Migration generation | `drizzle.config.ts` (schema → SQL files) |
| `bun run db:migrate` | Apply migrations | `package.json` script |
| `bun run db:seed` | Seed data | `package.json` script |

### Phase 0 Deliverable

```
✓ Next.js app compiles and runs at localhost:3000
✓ SQLite database with all tables created
✓ Seed data (10 built-in templates) loaded
✓ AppShell renders: Sidebar (icon-only) + MainPanel + StatusBar
✓ Auth foundation (single-user, local file token)
✓ CI pipeline passes (lint + typecheck)
```

---

## Phase 1: Core Reading Experience (Weeks 2-3)

### Goal
A working note editor with tags, full-text search, and basic note CRUD. The app is usable as a personal note-taker.

### Tasks

| # | Task | File / Component | Effort |
|---|------|------------------|--------|
| 1.1 | TipTap editor with basic formatting | `src/components/editor/Editor.tsx`, `EditorShell.tsx`, `RichToolbar.tsx` | L |
| 1.2 | Note CRUD API routes | `src/app/api/notes/route.ts`, `src/app/api/notes/[id]/route.ts` | M |
| 1.3 | Note list page | `src/app/(main)/notes/page.tsx` — grid/list view | M |
| 1.4 | Note detail/create pages | `src/app/(main)/notes/[id]/page.tsx`, `src/app/(main)/notes/new/page.tsx` | M |
| 1.5 | Tag CRUD API + UI | `src/app/api/tags/route.ts`, TagBar, TagTree sidebar | M |
| 1.6 | FTS5 full-text search | `src/lib/search/hybrid.ts`, `src/app/api/search/route.ts` | M |
| 1.7 | Cmd+K search overlay | `src/components/search/SearchOverlay.tsx`, `SearchInput.tsx`, `ResultCard.tsx` | M |
| 1.8 | Dashboard page | `src/app/(main)/dashboard/page.tsx` — recent notes, quick stats | S |
| 1.9 | Focus mode | `src/components/editor/FocusModeToggle.tsx` — full-screen editor | S |

### Key Implementation Notes

- **Editor**: TipTap with extensions: Bold, Italic, Underline, Strike, Code, Heading, BulletList, OrderedList, TaskList, Blockquote, CodeBlock (lowlight syntax highlighting), Link, Image, Table. Markdown shortcuts enabled. ProseMirror `onUpdate` handler extracts plain text into `content_text` for FTS indexing.
- **Hybrid Search**: `src/lib/search/hybrid.ts` implements three modes:
  - **Text (BM25)**: `SELECT rank, atom_id FROM fts5_atoms WHERE fts5_atoms MATCH ? LIMIT 20`
  - **Semantic (vector)**: `SELECT distance, atom_id FROM vec_atoms WHERE embedding MATCH ? LIMIT 20`
  - **Best match (hybrid)**: RRF merge of both: `score = 1/(60 + rank_dense) + 1/(60 + rank_sparse)`
- **Dashboard**: Displays last 10 notes, active tags (today/this week), quick stats (total notes, notes this week, streak), and a placeholder for the Daily Briefing widget.
- **Focus Mode**: `FocusModeToggle` in toolbar. Hides Sidebar + RightPanel. Editor fills viewport. TypewriterScroll plugin keeps cursor centered. DimmedLinesPlugin dims non-active paragraphs.

### Acceptance Criteria

- [ ] User can create, edit, and soft-delete a note via the TipTap editor
- [ ] User can create hierarchical tags and assign them to notes
- [ ] User can search notes by title and content (FTS5) — results appear in <300ms
- [ ] Cmd+K overlay opens with debounced search, keyboard navigation, Esc to dismiss
- [ ] Dashboard shows recent notes and quick stats
- [ ] Focus mode hides all panels and centers the editor
- [ ] Notes persist across page reloads (SQLite)

---

## Phase 2: Navigation & Structure (Weeks 4-5)

### Goal
Rich browsing and organizing capabilities: hierarchy tree, context graph, backlinks, tag pages, full search page with filters. The three-zone layout is fully functional.

### Tasks

| # | Task | File / Component | Effort |
|---|------|------------------|--------|
| 2.1 | Hierarchical tag tree sidebar | `src/components/layout/Sidebar.tsx` — collapsible tree, color-coded | M |
| 2.2 | Tag page | `src/app/(main)/tags/[id]/page.tsx` — notes filtered by tag, "Generate Wiki" button | M |
| 2.3 | Hierarchical nested docs (parent_id) | Sidebar doc tree + drag-drop reorder | L |
| 2.4 | Doc Hierarchy Tree (right panel) | `src/components/layout/RightPanel.tsx` → `DocHierarchyTree` | M |
| 2.5 | Backlinks panel (right panel) | `src/app/api/notes/[id]/backlinks/route.ts` + list component | S |
| 2.6 | Doc Context Graph (right panel) | `DocContextGraph` — mini force graph 1-2 hops | L |
| 2.7 | Full search page | `src/app/(main)/search/page.tsx` — advanced filters, pagination | M |
| 2.8 | Resizable panels | `ResizablePanel` — drag handles for sidebar + right panel | S |
| 2.9 | Right Panel shell | Tabs: Properties, Backlinks, Doc Graph, Doc Tree, Similar Notes, Shadow | M |
| 2.10 | Properties panel | Metadata: created/updated timestamps, word count, version indicator | S |

### Key Implementation Notes

- **Hierarchical Nested Docs**: `parent_id` on `atoms` table drives the tree. Drag-and-drop in sidebar triggers `PATCH /api/notes/:id` with new `parent_id`. Inherit tags option: when enabled, a note's effective tag set = its own tags + parent's tags (recursive up to root).
- **Doc Context Graph**: D3 force-directed mini-graph (300×300px) in Right Panel. Fetches 1-2 hop connections from `/api/notes/:id/context`. Nodes: current note at center, connected notes as satellites. Edges: solid for manual links, dashed for auto-similarity, different colors per connection type. `ContextGraphControls` has filter toggles and depth slider.
- **Doc Hierarchy Tree**: Reads `parent_id` relationships. Shows ancestors (breadcrumb), siblings, and children of the current note. Expandable/collapsible branches. Drag-to-reparent support.
- **Search Page**: Extended filters: tag scope (multi-select), date range (date picker), sort by (relevance/updated/created/title). Paginated results (20/page). Mode tabs same as Cmd+K overlay.

### Acceptance Criteria

- [ ] Tag tree is collapsible, color-coded, and clickable to filter notes
- [ ] Tag page shows all notes under a tag + child tags with "Generate Wiki" button
- [ ] Notes can be nested (parent_id) and re-ordered via drag-drop in sidebar
- [ ] Doc Hierarchy Tree shows current note's position in the tree
- [ ] Backlinks panel lists all notes linking to the current note
- [ ] Doc Context Graph renders 1-2 hop connections with interactive nodes
- [ ] Full search page has filters (tag, date, sort) and pagination
- [ ] Three-zone layout is fully responsive with resizable panels

---

## Phase 3: Spatial Canvas & Graphs (Weeks 6-7)

### Goal
All 5 graph types operational: force-directed graph, mind map, tree map, node editor, drawing canvas. Connection strength encoding across all graph types. Hierarchical drill-down with sub-graph navigation.

### Tasks

| # | Feature (from vision) | File / Component | Effort |
|---|----------------------|------------------|--------|
| 3.1 | #4 Spatial Canvas | `src/components/canvas/GraphCanvas.tsx`, `NoteNode.tsx`, `EdgeLine.tsx` — D3 force-directed SVG | L |
| 3.2 | #14 Node Map Editor | `NodeMapEditor.tsx` — React Flow drag-drop graph editor | L |
| 3.3 | #13 Tree Map | `TreeMapView.tsx` — ELK layered + ORTHOGONAL hierarchy | M |
| 3.4 | #12 Auto Mind Map | `MindMapView.tsx` — ELK radial auto-layout | M |
| 3.5 | #9 Drawing Canvas | `DrawingCanvas.tsx` — Excalidraw embed | M |
| 3.6 | #18 Connection Strength | `ConnectionStrengthEngine.ts`, `StrengthSlider.tsx`, `StrengthLegend.tsx` | L |
| 3.7 | #17 Drill-Down Graph | `DrillGraphContainer.tsx`, `GraphBreadcrumb.tsx`, `GraphHistoryStack.ts` | L |
| 3.8 | #15 Doc Context Graph (enhanced) | Strength-encoded edges, inferred edge toggles | M |
| 3.9 | #10 Multi-View DB | `DatabaseView.tsx` — table/kanban/gallery | M |
| 3.10 | Map embed system | `MapEmbed.tsx` — TipTap `/map` slash command inline render | M |

### Key Implementation Notes

- **Spatial Canvas**: D3 force simulation (`d3-force-3d` for 3D fallback). Nodes positioned via `forceManyBody` + `forceLink` + `forceCenter`. SVG rendering with zoom/pan via `d3-zoom`. Canvas composition:
  - `GraphCanvas` — container, manages D3 simulation lifecycle, zoom behavior, debounced re-layout
  - `NoteNode` — circles/rectangles sized by prominence (0.6×–1.4× base), colored by primary tag
  - `EdgeLine` — SVG paths with thickness 1–8px, opacity 0.1–1.0, dash pattern (dashed/dotted/solid)
  - `CanvasControls` — zoom in/out, fit, reset, tag filter dropdown, strength sensitivity slider
  - `NodePopover` — hover preview: title, first-line content, tags, connection strength score

- **Connection Strength Engine** (`src/lib/graph/strength.ts`):
  ```typescript
  strength(a, b) = clip(
    0.25 × norm(links(a,b)) +
    0.20 × jaccard(tags(a), tags(b)) +
    0.25 × cosine(embed(a), embed(b)) +
    0.10 × reciprocity(a,b) +
    0.10 × recency_boost(a,b) +
    0.10 × jaccard(refs(a), refs(b)),
    0.0, 1.0
  )
  ```
  - Computed in `ConnectionStrengthEngine`, cached per graph, re-computed on edit/tag/link changes (debounced 500ms)
  - Visual mapping: edge thickness (`1 + 7 × strength^0.7`), node scale (`0.6 + 0.4 × prominence`), color saturation
  - Graceful degradation when AI off: skip embedding + recency factors, re-normalize remaining weights

- **ELK Layout Engine** (`src/lib/graph/elk.ts`): Abstraction layer wrapping `elkjs`. Accepts JSON Canvas, returns layouted JSON with xywh positions. Supports algorithms: `layered` (tree), `radial` (mind map), `mrtree` (cluster), `force` (spring). Strength-aware via `elk.edgeWeight` property mapping.

- **Drill-Down Graph**: `DrillGraphContainer` wraps any graph view. Manages `GraphHistoryStack` (push/pop levels). Zoom transitions animate between levels. Breadcrumb bar: "Root › Chapter 1 › Section 1.1". Keyboard: `[` back, `]` forward, `Esc` up one level. Auto-expand on zoom in, auto-collapse on zoom out.

- **Multi-View Database**: `/database` route. Table view (sortable columns, resizable), Kanban view (drag-drop columns), Gallery view (card grid). Uses same data filtered by tag or query. Built with `@tanstack/react-table` for table, custom Kanban component.

- **Map Routes**:
  - `/maps` — grid of saved maps
  - `/maps/new` — create with type selector
  - `/maps/:id` — full-screen interactive viewer
  - `/maps/:id/edit` — React Flow editor with ELK auto-layout

### Acceptance Criteria

- [ ] Force-directed graph renders all notes with zoom/pan/fit controls
- [ ] Node Map Editor supports drag-drop nodes, edge creation, and auto-layout
- [ ] Auto Mind Map generates radial layout from AI prompt or doc structure
- [ ] Tree Map renders vertical hierarchy with orthogonal routing
- [ ] Drawing Canvas embeds Excalidraw with basic tools
- [ ] Connection strength is computed and visually encoded (edge thickness, node size, opacity)
- [ ] Strength slider (0–100%) dynamically adjusts visual differentiation
- [ ] Drill-down: click node with sub-graph → zoom transition → breadcrumb navigation
- [ ] Multi-View DB renders same data as table, kanban, and gallery views
- [ ] `/map` slash command inserts inline map embed in any note

---

## Phase 4: Template System & Export (Week 8)

### Goal
Professional-grade features: template system, export pipeline, and remaining core V1 features.

### Tasks

| # | Feature (from vision) | File / Component | Effort |
|---|----------------------|------------------|--------|
| 4.1 | #19 Template System | `TemplateLibrary.tsx`, `TemplateCreator.tsx`, `TemplateApplier.tsx`, `src/lib/templates/` | L |
| 4.2 | #20 Export & Publishing | `ExportDialog.tsx`, `ExportPDF.ts`, `ExportDOCX.ts`, `ExportPipeline.ts` | L |
| 4.3 | #8 Versioning & History | `src/app/api/notes/[id]/versions/`, `VersionTimeline.tsx`, diff view | M |
| 4.4 | #6 Block References | TipTap extension for `[[Note Title#block-id]]` | M |
| 4.5 | #7 Clone Notes | Clone indicator badge, sync propagation, break clone | M |
| 4.6 | #11 Slides / Presentation | `SlidesRenderer.tsx`, full-screen presentation | M |
| 4.7 | #1 Note Taking (remaining) | Font/size/color pickers, alignment, line spacing, tables, images, footnotes, multi-column, section breaks, fill-in blanks | L |
| 4.8 | #32 Dashboard (enhanced) | Daily briefing widget placeholder, graph snapshot mini | S |

### Key Implementation Notes

- **Template System**:
  - **Architecture**: 3-layer design per `docs/templates.md`:
    1. `lib/templates/registry.ts` — loads built-in (from JSON index) + user (from DB) templates
    2. `lib/templates/schema.ts` — Zod validation: `templateSchema`, `sectionSchema`, `blockSchema`
    3. `lib/templates/renderer.ts` — walks section tree → TipTap JSON nodes, interpolates `{{variable}}`
  - **Flow**: User picks template → variable form (prefilled defaults) → renderer interpolates + builds TipTap JSON → new note created → editor opens with content
  - **Import pipeline**: `lib/templates/importer.ts` — DOCX via mammoth.js, Markdown via unified/remark, clipboard via turndown. Structure detector identifies sections and repeats. Variable extractor suggests `{{var}}` placeholders.
  - **Routes**:
    - `POST /api/templates/import` — Upload DOCX/MD, returns parsed candidate
    - `POST /api/templates/import/preview` — Apply candidate to preview doc
    - `POST /api/templates/validate` — Validate `.knot-template.json` against Zod schema

- **Export Pipeline** (`src/lib/export/`):
  - Composable: `FetchBlocks → TransformPage → ApplyTemplate → RenderFormat → WriteFile`
  - `ExportPDF`: Puppeteer/Playwright renders A4 with headers/footers, page numbers, TOC, cover page
  - `ExportDOCX`: docx.js maps TipTap JSON → OOXML. Preserves fonts, colors, tables, images, alignment
  - `ExportGroupDialog`: batch export → single PDF/DOCX with section breaks between notes
  - External images (tg-bridge): fetch bytes → embed as base64 (never URL)
  - API routes:
    - `POST /api/export/pdf` — Single note as PDF
    - `POST /api/export/docx` — Single note as DOCX
    - `POST /api/export/batch` — Group export

- **Versioning**: Every save creates a `versions` row. Compare old vs new `content` hash — skip if unchanged. Diff view: side-by-side or inline. Revert creates new version (undoable). Auto-purge after 30 days (configurable).

- **Block References**: TipTap extension parsing `[[Note Title#block-id]]` syntax. Auto-complete via search index. Inline preview popover on hover. Backlinks tracked at block granularity.

- **Clone Notes**: A note ID can appear in multiple `parent_id` slots. Sync: all clones share the same atom ID, so edits propagate automatically. Clone indicator badge in the tree and note header. "Break clone" action: duplicate the atom content into a new atom ID.

- **Slides**: `SlidesRenderer` reads note content. H1 = slide title, `---` = slide break, H2 = section header. Full-screen presentation mode with arrow key navigation. Export as PDF slides.

- **Rich Editor Expansion**: Complete the TipTap toolbar:
  - FontSelector (Times New Roman, Arial, Inter, Courier New, etc.)
  - FontSizeDropdown (8–72pt with presets)
  - TextColorPicker + highlight color
  - AlignmentBar (L/C/R/J)
  - LineSpacingSelector (1.0–2.5)
  - TableEditor (insert, merge/split, border style, cell background)
  - ImageEmbed (upload/paste/drag, resize handles, alignment, caption)
  - FillInBlankTool (configurable dot count and color)
  - MultiColumnControl (2/3 columns with gap)
  - SectionBreakControl
  - FootnoteEditor (auto-numbering)

### Acceptance Criteria

- [ ] 10 built-in templates render correctly with variable substitution
- [ ] User can save any note as a template and apply it to a new note
- [ ] Import DOCX/MD creates a valid template candidate
- [ ] Single note exports as PDF with correct page layout (A4, margins, headers/footers)
- [ ] Single note exports as DOCX with preserved formatting
- [ ] Batch export produces a combined PDF/DOCX with section breaks
- [ ] Version history tracks every save with diff view and revert
- [ ] Block references resolve and render inline previews on hover
- [ ] Clone notes show badge, sync edits, support break-clone
- [ ] Slides presentation renders and navigates with arrow keys
- [ ] Rich toolbar has all formatting controls (font, size, color, alignment, spacing, table, image)

---

## Phase 5: AI Features (Week 8+, Post-V1)

### Goal
Embedding pipeline, semantic search, auto-tagging, agentic chat, wiki synthesis, AI second knowledge layers. Intelligent features layered on the stable foundation.

### Tasks

| # | Feature (from product-vision / features.md) | Effort |
|---|----------------------------------------------|--------|
| 5.1 | AI provider config UI (Settings → AI) | S |
| 5.2 | Embedding pipeline (on save → generate embedding) | M |
| 5.3 | #3 Semantic Search (complete with vector) | M |
| 5.4 | #21 Auto-Tagging (3 modes) | M |
| 5.5 | #22 Agentic Chat (RAG with SSE streaming) | L |
| 5.6 | #23 Wiki Synthesis | L |
| 5.7 | #24 Daily Briefing | M |
| 5.8 | #25 Similar Notes panel | M |
| 5.9 | #28 AI Second Knowledge (5 layers) | L |
| 5.10 | #29 AI Insights Panel | L |

These features are detailed in `docs/ai-features-architecture.md` and `docs/platform-decision.md` (§9 AI Second Knowledge). Implementation follows the priority queue architecture (`lib/ai/queue.ts`): P1 (user-facing), P2 (interactive), P3 (background batch).

---

## Breakdown by Feature (V1 Scope — 21 Features from product-vision.md)

Below is every feature in the V1 sprint plan from product-vision.md, with its dependencies, effort estimate, implementation notes, and acceptance criteria.

### Sprint 1-2: Core Engine (Weeks 1-2 per vision, Phases 0-1 here)

#### #1 Note Taking
| Field | Value |
|-------|-------|
| **Dependencies** | Phase 0 scaffold (Next.js + SQLite + AppShell) |
| **Effort** | L |
| **Key files** | `src/components/editor/Editor.tsx`, `EditorShell.tsx`, `RichToolbar.tsx`, `src/lib/db/schema.ts` (atoms table) |
| **Notes** | TipTap with 20+ extensions. Markdown shortcuts enabled. On every change, extract plain text into `content_text` for FTS indexing. Auto-save 3s after last keystroke. |
| **Acceptance** | User can write, format, and save rich text notes with 0 data loss |

#### #2 Tag System
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking, Phase 0 scaffold |
| **Effort** | M |
| **Key files** | `src/app/api/tags/route.ts`, `TagBar.tsx`, `TagTree.tsx`, `src/lib/db/schema.ts` (tags + atom_tags) |
| **Notes** | Hierarchical (`parent_id`), color-coded, auto-assigned color from palette. Tag tree in left sidebar. Click to filter notes. |
| **Acceptance** | User creates hierarchical tags, assigns colors, filters notes by tag |

#### #3 Semantic Search (basic)
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking (for FTS content), Phase 0 scaffold |
| **Effort** | M |
| **Key files** | `src/lib/search/hybrid.ts`, `SearchOverlay.tsx`, `src/app/api/search/route.ts` |
| **Notes** | Basic mode = BM25 via FTS5. Cmd+K overlay. Debounced 300ms. Three tabs: Best match / Text / Semantic (vector mode requires Phase 5 embeddings). |
| **Acceptance** | FTS5 search returns relevant results in <300ms via Cmd+K overlay |

#### #43 Focus Mode
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking (editor exists) |
| **Effort** | S |
| **Key files** | `src/components/editor/FocusModeToggle.tsx`, `TypewriterScroll.ts`, `DimmedLinesPlugin.ts` |
| **Notes** | Full-screen editor, hides all panels. Typewriter scrolling. Dim unused lines. Cmd+Shift+F to toggle. |
| **Acceptance** | Focus mode hides panels, centers cursor, dims non-active lines |

#### #32 Dashboard
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking (data to display) |
| **Effort** | S |
| **Key files** | `src/app/(main)/dashboard/page.tsx`, `BriefingWidget.tsx` |
| **Notes** | Last 10 notes, active tags (today/this week), quick stats. Placeholder for Daily Briefing widget (Phase 5). |
| **Acceptance** | Dashboard shows recent notes, stats, and works as landing page |

### Sprint 3-4: Navigation (Weeks 3-4 per vision, Phase 2 here)

#### #5 Hierarchical Nested Docs
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking, #2 Tag System |
| **Effort** | L |
| **Key files** | `atoms.parent_id` in schema, sidebar doc tree, `PATCH /api/notes/:id` for reparent |
| **Notes** | `parent_id` on atoms table. Drag-drop in sidebar to reparent. Inherit tags option. Breadcrumb navigation. |
| **Acceptance** | Notes form a tree, drag-drop re-parenting works, breadcrumb shows position |

#### #16 Doc Hierarchy Tree
| Field | Value |
|-------|-------|
| **Dependencies** | #5 Hierarchical Nested Docs |
| **Effort** | M |
| **Key files** | `DocHierarchyTree.tsx` (Right Panel), `TreeBranch.tsx`, `TreeNode.tsx` |
| **Notes** | Shows current note's ancestors, siblings, children. Expandable/collapsible. Drag to re-parent. |
| **Acceptance** | Right panel tree shows note's position in hierarchy, supports expand/collapse/drag |

#### #6 Block References
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking, #3 Semantic Search (for autocomplete) |
| **Effort** | M |
| **Key files** | TipTap extension `BlockReference.ts`, `src/app/api/blocks/[id]/route.ts` |
| **Notes** | `[[Note Title#block-id]]` syntax. Auto-complete with title search. Inline preview popover on hover. Block-level backlinks tracked via `links` table with optional `source_block_id`. |
| **Acceptance** | User creates block references, hovers for preview, backlinks panel shows block-level references |

#### #15 Doc Context Graph
| Field | Value |
|-------|-------|
| **Dependencies** | #3 Semantic Search, `links` table |
| **Effort** | L |
| **Key files** | `DocContextGraph.tsx` (Right Panel), `ContextGraphNode.tsx`, `ContextGraphControls.tsx` |
| **Notes** | Mini D3 force graph. Current note at center + 1-2 hops. Edges colored by type (backlink/same-tag/similar). Filter toggles. Strength encoding (Phase 3 enhanced). |
| **Acceptance** | Right panel shows local network graph, nodes are clickable, filter toggles work |

#### #8 Versioning & History
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking |
| **Effort** | M |
| **Key files** | `versions` table, `src/app/api/notes/[id]/versions/route.ts`, `VersionTimeline.tsx` |
| **Notes** | Every save creates version entry (skip if hash unchanged). Diff view (inline/side-by-side). One-click revert. Auto-purge after 30 days. |
| **Acceptance** | Version history shows all saves, diff view works, revert creates new version |

#### #19 Template System
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking |
| **Effort** | L |
| **Key files** | `src/lib/templates/`, `TemplateLibrary.tsx`, `TemplateApplier.tsx` |
| **Notes** | 3-layer arch (registry/schema/renderer). 10 built-in templates. Import from DOCX/MD. `{{variable}}` substitution. Section-based. Template inheritance. |
| **Acceptance** | 10 built-in templates render, user saves/applies templates, import pipeline produces valid templates |

### Sprint 5-6: Canvas (Weeks 5-6 per vision, Phase 3 here)

#### #4 Spatial Canvas
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking (nodes), `links` table (edges) |
| **Effort** | L |
| **Key files** | `GraphCanvas.tsx`, `NoteNode.tsx`, `EdgeLine.tsx`, `CanvasControls.tsx`, `src/lib/graph/` |
| **Notes** | D3 force-directed SVG. Nodes sized by prominence. Edges with thickness/opacity/dash encoding. Zoom/pan/fit. Tag filter. Node hover preview popover. |
| **Acceptance** | Force-directed graph renders all notes, interactive zoom/pan, click opens note, tag filter works |

#### #18 Connection Strength
| Field | Value |
|-------|-------|
| **Dependencies** | #4 Spatial Canvas, links + embeddings exist |
| **Effort** | L |
| **Key files** | `ConnectionStrengthEngine.ts`, `StrengthSlider.tsx`, `StrengthLegend.tsx`, `StrengthAwareLayout.ts` |
| **Notes** | 6-factor weighted computation. Visual mapping to edge/node properties. Sensitivity slider (0-100%). Factor toggles. Graceful degradation when AI off. ELK edge weight integration. |
| **Acceptance** | Strength computed and encoded visually, slider adjusts differentiation, legend shows mapping |

#### #14 Node Map Editor
| Field | Value |
|-------|-------|
| **Dependencies** | #4 Spatial Canvas |
| **Effort** | L |
| **Key files** | `NodeMapEditor.tsx` (React Flow), `MapNode.tsx`, `MapEdge.tsx`, `MapToolbar.tsx`, `ELKLayoutEngine.ts` |
| **Notes** | React Flow (@xyflow/react) based. Drag-drop nodes, connect handles. Doc-link nodes with blockId support. ELK auto-layout (force/radial/layered/mrtree). Per-node/edge styling. Groups/frames. |
| **Acceptance** | User creates custom graph with drag-drop, auto-layout produces clean layout, doc-link nodes resolve live titles |

#### #9 Drawing Canvas
| Field | Value |
|-------|-------|
| **Dependencies** | Map embed system |
| **Effort** | M |
| **Key files** | `DrawingCanvas.tsx` (Excalidraw), standalone `type: 'drawing'` doc |
| **Notes** | Excalidraw embed via `/drawing` slash command. Tools: shapes, arrows, freehand, text, sticky notes. Export PNG/SVG. Standalone drawing doc type. |
| **Acceptance** | User draws shapes/arrows/freehand, exports as PNG, embeds in any note |

#### #10 Multi-View Database
| Field | Value |
|-------|-------|
| **Dependencies** | Custom properties (future) or note metadata |
| **Effort** | M |
| **Key files** | `DatabaseView.tsx`, `/database` route |
| **Notes** | Three views: table (@tanstack/react-table sortable), kanban (drag-drop columns), gallery (card grid). Same data, different lenses. Filters: tag, property, date. |
| **Acceptance** | /database page shows notes in table/kanban/gallery views, switching views preserves filters |

### Sprint 7-8: Ship (Weeks 7-8 per vision, Phase 4 here)

#### #12 Auto Mind Map
| Field | Value |
|-------|-------|
| **Dependencies** | #14 Node Map Editor, ELKLayoutEngine |
| **Effort** | M |
| **Key files** | `MindMapView.tsx`, AI pipeline via `src/lib/ai/` |
| **Notes** | AI prompt → JSON Canvas → ELK radial → React Flow render. User prompt or doc structure as input. Editable after generation. `/map` embeddable. Doc-link nodes with blockId. |
| **Acceptance** | User generates mind map from prompt, edits nodes, embeds inline |

#### #13 Tree Map
| Field | Value |
|-------|-------|
| **Dependencies** | #5 Hierarchical Nested Docs, ELKLayoutEngine |
| **Effort** | M |
| **Key files** | `TreeMapView.tsx` |
| **Notes** | ELK `layered` + ORTHOGONAL routing (PCB-style 90° lines). Collapsible subtrees. Subject→chapters→sections use case. Export PNG/SVG. |
| **Acceptance** | Tree map renders hierarchy with orthogonal routing, subtrees expand/collapse |

#### #17 Drill-Down Graph
| Field | Value |
|-------|-------|
| **Dependencies** | #4 Spatial Canvas, #14 Node Map Editor |
| **Effort** | L |
| **Key files** | `DrillGraphContainer.tsx`, `GraphBreadcrumb.tsx`, `GraphHistoryStack.ts` |
| **Notes** | Cross-cutting layer for all graph types. `subGraphId` on JSON Canvas nodes. Zoom transitions, breadcrumb navigation, history stack (`[`/`]`/Esc). Auto-expand/collapse by zoom level. Presentation mode. |
| **Acceptance** | Click sub-graph node → zoom drill → breadcrumb appears → back/forward navigation works |

#### #11 Slides / Presentation
| Field | Value |
|-------|-------|
| **Dependencies** | #1 Note Taking (content structure) |
| **Effort** | M |
| **Key files** | `SlidesRenderer.tsx`, presentation CSS |
| **Notes** | Markdown-to-slides: H1=slide, `---`=break. Full-screen with arrow keys. Export PDF slides. Light/dark themes. |
| **Acceptance** | Note renders as slide deck, navigation works, export produces PDF |

#### #20 Export & Publishing
| Field | Value |
|-------|-------|
| **Dependencies** | #19 Template System, #1 Note Taking |
| **Effort** | L |
| **Key files** | `src/lib/export/`, `ExportDialog.tsx`, `ExportPDF.ts`, `ExportDOCX.ts` |
| **Notes** | Composable pipeline. PDF via Puppeteer/Playwright (A4, headers/footers, TOC). DOCX via docx.js (OOXML fidelity). Batch export as combined file. Template binding before export. |
| **Acceptance** | Single PDF/DOCX exports with correct formatting, batch export produces combined file |

#### #7 Clone Notes
| Field | Value |
|-------|-------|
| **Dependencies** | #5 Hierarchical Nested Docs |
| **Effort** | M |
| **Key files** | Clone indicator component, sync logic (same atom ID) |
| **Notes** | A note in multiple `parent_id` slots = clone. All instances share the same atom ID. Clone badge. "Break clone" creates independent copy. |
| **Acceptance** | Cloned note appears in multiple tree locations, edits sync, break clone creates independent copy |

---

## Database Migration Plan

Ordered list of migrations, each as a Drizzle Kit migration file in `drizzle/`.

| # | Migration | Tables Added/Changed | Rollback |
|---|-----------|---------------------|----------|
| 0000 | Initial schema | `users`, `sessions`, `notes`, `tags`, `note_tags`, `note_versions`, `templates`, `note_links`, `graph_layouts`, `settings` | `DROP TABLE IF EXISTS ...` for all |
| 0001 | FTS5 virtual table | `fts5_atoms` (FTS5 on atoms.title + atoms.content_text) | `DROP TABLE IF EXISTS fts5_atoms` |
| 0002 | sqlite-vec vector table | `vec_atoms` (vec0 on atoms.embedding) | `DROP TABLE IF EXISTS vec_atoms` |
| 0003 | Shadow docs (AI Layer 1) | `shadow_docs`, `shadow_interactions` | `DROP TABLE IF EXISTS shadow_docs, shadow_interactions` |
| 0004 | Inferred edges (AI Layer 2) | `doc_inferred_edges` | `DROP TABLE IF EXISTS doc_inferred_edges` |
| 0005 | Glossary (AI Layer 3) | `glossary_terms` | `DROP TABLE IF EXISTS glossary_terms` |
| 0006 | Temporal delta (AI Layer 4) | `doc_temporal_delta` | `DROP TABLE IF EXISTS doc_temporal_delta` |
| 0007 | Agent context cache (AI Layer 5) | `agent_context_cache` | `DROP TABLE IF EXISTS agent_context_cache` |
| 0008 | Card-doc links (Kanban integration) | `card_doc_links` | `DROP TABLE IF EXISTS card_doc_links` |

**Strategy**: Each migration is reversible (down function drops added tables). All migrations are incremental — no destructive column changes. Schema changes are additive only until V1 release. After V1, any breaking migration requires a data migration step.

---

## Risk Register

### Risk 1: Graph Features Too Complex for Non-Technical Users
- **Impact**: High — the visual knowledge graph is Knot's key differentiator, but overwhelming UX drives users away
- **Mitigation**: Progressive disclosure at every level:
  - Default Spatial Canvas shows only notes with links (no empty state confusion)
  - Connection strength is off by default ("Uniform" mode)
  - Advanced controls (factor toggles, strength threshold, ELK algorithm selector) hidden behind a "Advanced" expandable section
  - Tooltip on first canvas open: "Your knowledge graph — click any node to open the note"

### Risk 2: SQLite Performance with Large Knowledge Bases
- **Impact**: Medium — slow queries and graph rendering with 10,000+ notes
- **Mitigation**: Index every query path (parent_id, updated_at, atom_tags join). FTS5 is sub-millisecond for 100K rows. Graph rendering uses virtual scrolling (only visible nodes in DOM). 500-node cap with lazy expansion warning: "Showing 500 of 2,340 nodes. Zoom in or filter by tag."

### Risk 3: AI Dependency Creates Support Burden
- **Impact**: Medium — users expect AI features to always work
- **Mitigation**: Every AI feature has graceful degradation:
  - No embeddings → BM25-only search (mode tabs still work)
  - LLM unreachable → auto-tagging skips, chat shows "AI unavailable" with fallback to FTS5
  - Connection strength: detect missing embeddings → skip embedding factor, re-normalize weights, show "Limited mode (AI off)" badge
  - AI features are togglable per-layer in Settings → AI

### Risk 4: 8-Week Timeline Too Aggressive
- **Impact**: High — burnout, incomplete features, quality issues
- **Mitigation**: Hard cut at Week 4: "useful note-taker" is the milestone. Spatial canvas and advanced graph features (Sprint 5-6) slip to V1.1 if behind schedule. Phase 5 (AI features) is explicitly post-V1 — it ships only if core is solid. Weekly triage: if a feature isn't 80% done by its sprint's end, it is cut.

### Risk 5: Single Developer Context Switching
- **Impact**: Medium — jumping between frontend, database, AI integration, and graph rendering
- **Mitigation**: Phases are stacked by domain:
  - Phase 0-1: Full-stack foundation (DB + API + basic UI)
  - Phase 2: Frontend-heavy (panels, trees, graphs)
  - Phase 3: Graph algorithms (D3, ELK, connection strength)
  - Phase 4: Document processing (templates, export)
  - Phase 5: AI integration
  Each phase focuses on one domain depth, minimizing context switching.

---

## Key Milestones

### M1: Searchable Notes (End of Phase 1 / Week 3)
- Working TipTap editor with formatting toolbar
- Tags CRUD with hierarchical tree
- FTS5 full-text search via Cmd+K overlay
- Dashboard with recent notes and stats
- Focus mode for distraction-free writing
- **Demo**: Open app → write note with formatting → add tags → search for it → find it in <300ms

### M2: Navigable Knowledge Base (End of Phase 2 / Week 5)
- Three-zone layout with resizable panels
- Hierarchical doc tree in sidebar with drag-drop re-parenting
- Doc Hierarchy Tree and Doc Context Graph in Right Panel
- Backlinks and properties panels
- Full search page with filters and pagination
- Tag pages with note lists
- **Demo**: Create nested docs → see hierarchy tree → click note → see context graph → navigate via backlinks → find related notes via search

### M3: Connected Graph (End of Phase 3 / Week 7)
- Force-directed spatial canvas with zoom/pan/fit
- All 5 graph types: force, mind map, tree map, node editor, drawing canvas
- Connection strength encoding with sensitivity controls
- Drill-down graph with sub-graph navigation and breadcrumbs
- Multi-view database (table/kanban/gallery)
- Map embed in any note via `/map` slash command
- **Demo**: Open canvas → see notes as connected graph → adjust strength → drill into sub-graph → edit nodes in React Flow → embed map in a note

### M4: Polished & Shippable (End of Phase 4 / Week 8)
- 10 built-in templates with variable substitution
- Template import from DOCX/Markdown
- Single and batch export to PDF/DOCX
- Note versioning with diff and revert
- Block references with inline previews
- Clone notes with sync and break-clone
- Complete rich text toolbar (fonts, colors, tables, images, multi-column, footnotes)
- Slides / presentation mode
- **Demo**: Pick template → fill variables → create note → add block reference → export as PDF → save as template → export group as DOCX

---

## Post-V1 (Deferred to V1.1 / V2)

### AI Features (Phase 5)
- Embedding pipeline and vector search
- Auto-tagging (3 modes)
- Agentic Chat with RAG and SSE streaming
- Wiki Synthesis with inline citations
- Daily Briefing auto-generation
- Similar Notes panel
- AI Second Knowledge (5 layers: shadow docs, relation graph, glossary, temporal delta, agent context cache)
- AI Insights dashboard

### Integration Features (Deferred per product-vision.md)
- #30 RSS Feeds
- #31 MCP Server + HTTP API
- #33 Web Clipping (browser bookmarklet)
- #34 PDF Annotation → Note
- #35 Scripting API

### New Features (Deferred per product-vision.md)
- #37 Task Management (Kanban) — existing backend integration
- #38 Daily Notes & Calendar
- #39 Custom Properties & Frontmatter
- #40 Note Query Language
- #41 Outliner Mode
- #42 Quick Capture
- #44 Readwise Import
- #45 Voice Notes
- #46 Git Backup

### Future Phases
- Plugin System (#55-#64) — V3
- Fediverse / Federation (#65-#68) — V4+
- Export Engine System (#69) — V2
- CRDT Collaboration (#36) — post-V2
