# Features

69 features organized into 9 groups: **Core** (foundation), **AI** (intelligence), **Integration** (connectivity), **Platform** (collaboration), **New Features**, **AI Auto-Organization**, **Plugin System**, **Fediverse/Federation**, and **Export Engine**.

---

## Core

### 1. Note Taking (Atoms)

Each note is an **atom** — the fundamental unit of knowledge in Knot.

- **Rich text formatting**: Bold, italic, underline, strikethrough, inline code, subscript, superscript. Keyboard shortcuts for all.
- **Font controls**: Font family selector (Times New Roman, Arial, etc.), font size dropdown (8-72pt), text color picker, highlight/marker color.
- **Text alignment**: LEFT, CENTER, RIGHT, JUSTIFY. Paragraph indentation. First-line indent.
- **Line & paragraph spacing**: Line spacing presets (1.0, 1.15, 1.5, 2.0) and custom. Paragraph spacing before/after.
- **Multi-level lists**: Numbered with hierarchical (1., a., i.), bulleted nested, hybrid, task/checklist.
- **Tables**: Insert/edit with add/delete rows/columns, merge/split cells, resize, header row toggle, borders/shading, cell alignment, vertical merge for grouped params.
- **Images**: Inline with alignment, resizable, captioned. Paste from clipboard or file picker.
- **Page layout settings**: Paper size (A4/Letter/Legal), margins (cm), orientation (portrait/landscape). Stored as metadata, applied on export.
- **Headers & footers**: Per-section text, page numbers (1,2,3 / i,ii,iii), different first page, link to previous.
- **Fill-in blanks**: `.......................` for worksheets. Keyboard shortcut. Preserved in export.
- **Multi-column layout**: 1/2/3 columns per section. Column gap.
- **Section breaks**: Change layout, headers, or columns mid-document.
- **Footnotes & endnotes**: Numbered. Auto-renumber on add/remove.
- **Code blocks**: Fenced with syntax highlighting, language selector, copy button, line numbers.
- **Blockquotes**: Left border with optional citation.
- **Embeds**: Inline maps (/map), drawings (/drawing), database views, external image URLs.
- **External image embedding**: Paste an image URL (tg-bridge or any public image URL) → renders inline `<img>` with resize handles, alignment, caption. Loading spinner while image loads; broken-link fallback if URL unreachable. Export fetches image bytes and embeds inline (not URL).
- **Metadata**: Title, content, tags, embedding vector, created/updated timestamps, soft-delete flag.
- **Storage**: SQLite with full-text search index on title + content.
- **Soft delete**: Notes go to trash, restorable for 30 days, then permanently purged.

### 2. Tag System

Hierarchical tags for organizing notes.

- **Hierarchy**: Tags can have parent-child relationships (e.g., `#dev/frontend/react`).
- **Color-coded**: Each tag gets a color (auto-assigned or user-set) for visual grouping.
- **Tag tree**: Left sidebar shows the full tag hierarchy in a collapsible tree.
- **Filtering**: Click a tag to filter the note list to that tag and its children.
- **Tag page**: Dedicated page per tag showing all notes, stats, and a "Generate Wiki" button.

### 3. Semantic Search

Hybrid search combining keyword precision with semantic understanding.

- **Hybrid retrieval**: BM25 full-text search (FTS5) + dense vector cosine similarity, merged via Reciprocal Rank Fusion (RRF).
- **See also**: #40 Note Query Language for structured queries against custom properties (beyond free-text search).
- **Cmd+K overlay**: Quick-search overlay (~600px wide, centered, backdrop dim). Three mode tabs: **Best match** (hybrid default), **Text** (BM25 only), **Semantic** (vector only).
- **@tag scoping**: Type `@tagname` to filter results to that tag.
- **Result cards**: Title, highlighted snippet, similarity bar (green/yellow/grey), tag pills.
- **Keyboard navigation**: Arrow keys to navigate, Enter to open, Esc to dismiss. Debounced 300ms.
- **Full search page**: Extended search with pagination, advanced filters, sort options.

### 4. Spatial Canvas

A force-directed graph visualization of your knowledge base.

- **Force layout**: D3.js force simulation positions nodes (notes) and edges (links) with auto-layout.
- **Interaction**: Click a node to open the note. Hover for preview. Zoom/pan freely.
- **Edge types**: Solid lines = manual links (user-created), dashed lines = auto-similarity (AI-detected).
- **Filters**: Filter visible nodes by tag. Toggle auto-similarity edges on/off.
- **Controls**: Fit-to-screen, zoom in/out, reset layout, tag filter dropdown.

### 5. Hierarchical Nested Docs

Documents can have parent-child relationships forming a tree in the sidebar (like a file explorer).

- **Tree sidebar**: Expandable/collapsible tree view in the left sidebar. Drag-and-drop to reorder and reparent.
- **Inline embedding**: A parent doc can render child docs inline as embedded sections.
- **Inherit tags**: Option to inherit tags from parent doc.
- **Breadcrumb**: Shows current position in the doc tree.

### 6. Block References

Reference a specific paragraph, heading, or block in another note.

- **Syntax**: `[[Note Title#block-id]]` or `[[Note Title]]` with auto-complete + block picker.
- **Inline preview**: Hover over a block reference shows the referenced content in a popover.
- **Block-level backlinks**: Backlinks panel shows references at block granularity (not just doc level).
- **Source indicator**: The source doc shows a "Referenced by N docs" count.
- **Heading as anchor target**: Any heading (H1-H6) in a doc can serve as a block reference target. Mind map nodes, doc hierarchy tree, and context graph can all link to headings. The heading's block ID is stable across edits (TipTap assigns persistent IDs to each block).

### 7. Clone Notes

A single note can appear in multiple locations in the tree hierarchy.

- **Sync**: Updates to any clone propagate to all instances.
- **Badge**: Clone indicator badge displayed on the note card.
- **Break clone**: User can break the clone relationship to make an independent copy.
- **Use case**: A note about "REST API Design" can live under both #backend and #architecture.

### 8. Note Versioning & History

Every edit creates a version entry in the database.

- **Version timeline**: Slider or list in the right panel showing all versions with timestamps.
- **Diff view**: Side-by-side or inline diff between any two versions.
- **Revert**: One-click revert to any previous version. Creates a new version entry (undoable).
- **Auto-purge**: Old versions auto-purged after configurable retention (default 30 days).
- **See also**: #46 Git Backup for file-level versioning with auto-commit and remote sync — complementary to DB-level versioning.

### 9. Drawing Canvas (Excalidraw)

Embed an Excalidraw whiteboard inside any note or as a standalone drawing doc.

- **Inline embed**: `/drawing` slash command inserts an Excalidraw canvas block.
- **Tools**: Shapes, arrows, freehand drawing, text, sticky notes. Hand-drawn style.
- **Standalone mode**: Drawing can be its own document type (`type: 'drawing'`).
- **Export**: Export as PNG or SVG.

### 10. Multi-View Database

Display note metadata or custom fields in multiple visual formats.

- **Table view**: Spreadsheet-like grid with sortable columns.
- **Kanban view**: Drag-and-drop columns (e.g., status-based workflow).
- **Gallery view**: Card grid with cover image + title.
- **Same data, different views**: All views share the same underlying data store.

### 11. Slides / Presentation Mode

Turn any structured note into a slide deck.

- **Markdown to slides**: H1 = slide title, ## H2 = section, `---` = page break.
- **Presentation**: Full-screen slideshow with arrow key navigation.
- **Export**: Export as PDF slides.
- **Theme**: Light and dark presentation themes.

### 12. Auto Mind Map

AI generates a radial mind map from a user prompt, then renders it inline.

- **AI pipeline**: User prompt → LLM outputs JSON Canvas → ELK radial auto-layout → React Flow render.
- **Radial layout**: Central root node with branching children. ELK `radial` algorithm.
- **Linked nodes**: Each mind-map node can link to an existing doc or create a new one on click. Supports section-level deep linking — node can point to a specific heading (H1/H2/H3) within a doc via `docId#blockId`. Clicking navigates to the doc and scrolls to that heading. Label and description auto-sync from linked doc on map load and via SSE when doc is renamed.
- **Editable**: User can add/remove/edit nodes and connections after generation.
- **Embeddable**: `/map` slash command inserts the mind map inline in any doc.

### 13. Tree Map / Hierarchical View

Vertical hierarchy visualization with PCB-style orthogonal routing.

- **Auto-layout**: ELK `layered` algorithm with `ORTHOGONAL` edge routing (90° lines, no overlap).
- **Collapsible**: Click to expand/collapse subtrees.
- **Use cases**: Subject → chapters → sections, org chart, folder structure.
- **Export**: Export as PNG/SVG.
- **Embeddable**: Insert in any doc via `/map` with `view: 'tree'`.

### 14. Node Map Editor / Graph Editor

Interactive node-and-edge editor for creating custom graphs.

- **React Flow foundation**: Drag-drop nodes, connect with handles, pan/zoom canvas.
- **Node types**: Text, doc link, group/frame, image.
- **Auto-layout**: Multiple algorithms (force, radial, layered, mrtree) via ELK.
- **Styling**: Per-node color, font size, border style. Per-edge arrow style, stroke width, label.
- **Doc-link with section anchor**: The doc-link node variant stores optional `blockId` + `blockType` fields. When linking to a doc, user can pick a specific heading. Node displays heading title + doc title. Click navigates to `/notes/:docId#blockId`. Label, heading title, and description auto-sync from linked doc on map load and in real-time via SSE.
- **Groups**: Frame nodes to group related nodes into a bounded region.
- **Embeddable**: Insert via `/map` with `view: 'node'`, interactive inline.

### 15. Doc Context Graph (Local Node Map)

When viewing a note, a mini interactive graph in the right panel shows the current note's local network of connected notes.

- **Local graph**: Current note at center. Links to/from the current note shown as edges. 1-2 hops of connection depth.
- **Connection types**: Backlinks (notes linking to this one), forward links (notes this one links to), same-tag neighbors, similar notes (embedding similarity).
- **Interactive nodes**: Click any node to navigate to that doc. Hover for preview card.
- **Filter controls**: Toggle connection types on/off (backlinks, forward, same-tag, similar). Slider for connection depth (1 hop / 2 hops).
- **Visual**: Force-directed mini-layout within the panel. Nodes colored by tag. Edge thickness by relevance. Strongest connections (strength &gt; 0.7) rendered with highlight glow animation; weakest (strength &lt; 0.2) rendered faded.
- **Relation to Similar Notes**: Similar Notes is a flat list; Doc Context Graph is a visual network showing the same data plus structural connections (backlinks, hierarchy).
- **Snap to full canvas**: "Open in Canvas" button expands the local graph into the full Spatial Canvas (/canvas) centered on this note.
- **Section-level connections**: When a doc reference points to a specific heading in another doc, the context graph can show the edge at section granularity — the mini graph highlights the target section as a sub-node of the target doc.
- **Live labels**: Graph node labels auto-sync from doc titles. When a connected doc is renamed, SSE pushes the update and the graph node label updates without page reload.

### 16. Doc Hierarchy Tree

When viewing a note, a tree view in the right panel shows its position in the document hierarchy.

- **Current position**: Shows the note's ancestors (parent doc, grandparent), siblings (other children of parent), and children (direct child docs).
- **Interactive tree**: Click any node to navigate. Expand/collapse branches. Icons indicate doc type (note/map/drawing).
- **Breadcrumb alternative**: More visual than a text breadcrumb — shows the full tree structure around the current position.
- **Drag support**: Drag nodes to re-parent in the hierarchy.
- **Empty state**: If docs are flat (no hierarchy), shows a prompt to organize into folders.
- **Page/Graph dual mode**: Every doc has a toggle in the top toolbar to switch between Page view (standard linear reading) and Graph view (auto-generated directed graph from the doc's hierarchy). Root = current doc, level-1 nodes = its immediate child docs, expand any node → shows its children recursively. Edges are directed parent→child with arrow markings.
- **Dynamic hierarchy graph**: Graph mode walks the doc's child hierarchy dynamically using parent_id relationships. Each child doc becomes a node with title, icon (by doc type), and metadata. Expand/collapse any node that has children — the depth is unlimited, following the actual hierarchy structure. Leaf nodes (no children) show no expand toggle.

### 17. Zoomable / Drill-Down Graph (Hierarchical Graph)

All graph types support hierarchical zoom — click a node to drill into its sub-graph, auto-expand/collapse branches for presentation, and navigate back via breadcrumb.

- **Nested sub-graphs**: Every graph node can contain a `subGraphId` pointing to another graph (map document) or a sub-section of the same graph. Creates a tree of graphs — parent → child → grandchild.
- **Click-to-drill**: Click any node with a sub-graph → smooth zoom transition into that sub-graph. Viewport animates: zoom out slightly → slide to center → zoom in on sub-graph content.
- **Breadcrumb navigation**: Persistent bar at top of graph view: "Root Graph › Chapter 1 › Section 1.1". Each segment clickable to jump back to that level.
- **Back navigation**: "← Back" button (top-left) or Escape key to go up one level. Keyboard: `[` and `]` for backward/forward through history stack.
- **Auto-expand**: When zooming in, child nodes auto-expand to fill available viewport space — no empty gaps, no scroll required. ELK re-layouts the sub-graph to fit the viewport.
- **Auto-collapse**: When zooming out beyond a threshold, branches collapse into aggregate nodes showing summary stats (child count, tags). Prevents visual clutter at high zoom-out levels.
- **Compact / Expanded toggle**: Switch between compact view (nodes show title only, thin edges) and expanded view (full content, thick edges, images). Auto-toggles based on zoom level; user can override via toggle button.
- **Sub-graph preview**: Hover over a node with sub-graph → mini preview popover showing first-level children. Shows node count + top-3 child labels.
- **Presentation mode**: Full-screen view with auto-advance controls. Click to drill deeper; breadcrumb shows depth. Slide-like transitions between levels. Presenter notes overlay.
- **Zoom-to-fit animated**: Each level transition animates — the target sub-graph is centered and scaled to fill 85% of the viewport.
- **Per-level caching**: Sub-graph data loaded lazily on first drill, cached in memory. Subsequent navigation instant. Cache invalidated on map edit.
- **Cross-graph hierarchy**: Sub-graph can be a different graph document in the workspace — drill transitions across map documents seamlessly.
- **URL navigation**: `/maps/:id?focus=subGraphNodeId` opens the map at the sub-graph level. `/maps/:id?path=root,chapter1,section1_1` for deep-linking multiple levels deep.
- **Sub-graph strength context**: When drilling into a sub-graph, connection strength is re-computed independently for the sub-graph's local context. Parent graph strengths do not leak into child graphs — each level has its own independent strength matrix.
- **Auto-collapse prominence**: When branches auto-collapse into aggregate nodes, the aggregate node's prominence = weighted sum of its children's prominences. Ensures a collapsed cluster of highly-connected nodes appears more prominent than an isolated collapsed leaf.
- **Auto-suggest sub-graphs**: The connection strength engine detects natural clusters — sets of nodes with high internal strength (&gt; 0.6) and low external strength (&lt; 0.2). A "Suggested cluster" badge appears in the toolbar. User can accept (creates sub-graph), adjust radius, or dismiss.
- **Create sub-graph from selection**: Select N nodes in any graph type → right-click → "Create sub-graph" → these nodes become children of a new sub-graph map. The parent node is auto-created with `subGraphId` pointing to the new map.
- **Promote / Demote sub-graph**: Right-click a sub-graph node → "Promote to parent" (moves children up one level) or "Demote to child" (wraps selection into deeper sub-graph). Flattens or deepens hierarchy without manual restructuring.
- **Doc→graph rendering**: Regular docs in Graph mode use the drill-down mechanism internally. The hierarchy is mapped to a virtual subGraphId chain matching the doc tree (root → children → grandchildren). Each level gets its own ELK layout, enabling drill-down zoom, breadcrumb navigation, and history stack (`[` / `]`) identical to persistent graph maps.
- **Use cases**:
  - **Giáo trình**: Bài 1 node → drill → 5 section nodes → drill → specific step with data table
  - **City map**: Việt Nam node → drill → TP.HCM → drill → Quận 1 → drill → landmark pins
  - **Source tree**: Module node → drill → file list → drill → function dependency graph
  - **Mind map**: Central topic → drill → branch topics → drill → detailed sub-mind maps
  - **Presentation**: Auto-advance through graph hierarchy levels, each level as a slide

### 18. Connection Strength Encoding (Weighted Graph)

All graph types automatically compute connection strength between linked nodes and encode it visually — strong connections get thick, bold edges and large, prominent nodes; weak connections get thin, faded edges and small, dim nodes.

- **Multi-factor strength computation**: Strength between two nodes calculated from: link count (bidirectional), tag overlap (Jaccard similarity), embedding cosine similarity (0.0-1.0), backlink reciprocity (both link to each other), recency (recent edits boost weight), common references (both link to same third node), and optional manual weight override.
- **Formula**: `strength = w1 × links + w2 × tags + w3 × embedding + w4 × reciprocity + w5 × recency + w6 × common_refs + w7 × manual`. Weights configurable via settings.
- **Edge thickness**: 1px (weakest, strength ≈ 0.0) → 8px (strongest, strength ≈ 1.0). Exponential scale for subtle differentiation at mid-range.
- **Edge opacity**: 0.1 (weakest) → 1.0 (strongest). Weak edges nearly invisible at high zoom-out.
- **Edge dash pattern**: Dashed (strength < 0.3) → dotted (0.3-0.6) → solid (> 0.6).
- **Node prominence scaling**: Each node gets a prominence score based on aggregate connection strength (sum of all incident edges). Node size = base_size × (0.6 + 0.4 × prominence_normalized). Hubs rendered at 1.4×, isolates at 0.6×.
- **Node border**: 1px (weak) → 4px (strong) based on degree and connection quality.
- **Node opacity & saturation**: 0.5 opacity + grayscale for isolated nodes → 1.0 opacity + full color for well-connected hubs.
- **Strength sensitivity slider**: Global control (0-100%). At 0%: uniform rendering (all edges equal, all nodes equal size). At 100%: maximum visual differentiation. Default 70%.
- **Factor toggles**: Enable/disable individual strength factors (links, tags, embedding, etc.) in graph toolbar or Settings → Graphs.
- **Strength legend**: Small overlay in graph corner showing visual mapping: thin→thick edges, small→large nodes, with example labels.
- **"Weighted" toggle**: Quick toggle to turn weight encoding on/off. Off = traditional uniform rendering for when user wants clean layout.
- **Re-computation triggers**: Strength matrix re-computed on: doc edit, link add/remove, tag change, manual weight override. Cached per graph, re-compute is debounced (500ms).
- **SSE integration**: `graph:weights_updated` event pushes new strength values to open viewers.
- **Use cases**:
  - **Knowledge graph**: Hub documents (highly linked) visually stand out — easy to spot important concepts
  - **Similar notes panel**: Strong-similarity edges thicker, weak ones nearly invisible (declutter)
  - **Auto mind map**: Core topics become large central nodes, peripheral details smaller
  - **Doc context graph**: Most relevant connections visually prominent, noise filtered by opacity
  - **Presentation mode**: Strength encoding auto-adjusts — weighted view for overview, uniform for detail
- **Strength threshold filtering**: Dual-range slider (min 0-100%, max 0-100%) in graph toolbar. Edges below min threshold are hidden entirely. Edges above max threshold are highlighted. Default: min=0%, max=100% (all visible). Helps declutter large graphs.
- **Min node prominence filter**: Slider to hide nodes whose prominence score is below a minimum. Isolated leaf nodes disappear; hub nodes remain. Complements edge thresholding.
- **"Hide weak connections" toggle**: One-click toggle to hide edges with strength &lt; 0.3. Quick way to focus on strong relationships only. Visual indicator in Strength Legend when active.
- **Strength-aware ELK layout**: Connection strength is passed as edge weight to ELK layout engine. Strongly connected nodes (strength &gt; 0.7) are positioned closer together; weakly connected nodes (strength &lt; 0.3) pushed apart. Mapping: `elk.edgeWeight = ceil(strength × 100)`.
- **Edge strength tooltip**: Hover over any edge → tooltip shows: overall strength (0.00-1.00) with color-coded progress bar, per-factor breakdown (links: 0.30, tags: 0.20, embedding: 0.25...), top contributing factor highlighted. Click to pin tooltip persistent. Works on all graph types.
- **Graceful degradation when AI disabled**: If AI features are off (no embeddings, no recency), the engine auto-detects and excludes embedding (0.25) and recency (0.10) factors. Remaining factors re-normalized: links 0.40, tags 0.30, reciprocity 0.15, common refs 0.15. A "Limited mode (AI off)" indicator appears in the Strength Legend.
- **Search & listing integration**: Similar Notes panel ordered by connection strength. Search results show strength badge referencing the current document. Doc Context Graph uses strength to highlight most/least relevant connections.
- **Use cases**:
  - **Declutter**: Threshold filtering hides noise edges, user sees only meaningful connections
  - **Knowledge discovery**: Auto-suggest creates sub-graphs from natural clusters
  - **Debug/understand**: Edge tooltip explains WHY two docs are connected (which factors contribute)
  - **No-AI fallback**: Works without embeddings — links and tags still produce meaningful weights

### 19. Template System

Save and apply structured document templates for consistent formatting.

- **Create template**: Save any document as a reusable template. Captures structure (sections, headings, tables), formatting (fonts, colors, alignment, spacing), and variable placeholders.
- **Template library**: Browse/search templates. 10 built-in templates (see [docs/templates.md](./templates.md)) and user-created. Categorizable.
- **Apply template**: New doc → choose template → pre-populated structure. Or apply to existing doc (replaces content, preserves metadata).
- **Template variables**: `{{variable}}` placeholders. On apply, dialog to fill: `{{subject}}`, `{{date}}`, `{{author}}`, `{{institution}}`. Auto-fill date/author.
- **Structured sections**: Pre-defined repeating sub-blocks (cover page, heading+body, data table, fill-in-blank, image placeholder). Users add/remove after apply.
- **Cover page wizard**: Title, subtitle, authors, logo placeholder, institution, date. Custom alignment/colors/fonts per element.
- **Section headers/footers**: Per-section header/footer text and page number style defined in template.
- **Fill-in fields**: Pre-defined blank fields (.......................). Tab jumps between fields.
- **Import from DOCX/MD**: Upload `.docx` or `.md` files → auto-detect structure (sections, headings, tables, repeating patterns) → suggest `{{variable}}` placeholders → save as template. Supports Obsidian, Notion exports, paste from clipboard.
- **Template inheritance**: Templates extend base templates (e.g., "Giáo trình" → "Academic Document"). Base changes propagate to derived.
- **Storage**: Stored as `type: 'template'` documents in SQLite. Includes structure metadata + formatted body.

### 20. Export & Publishing

Export single or grouped documents as formatted PDF/DOCX files.

- **Single export**: Current doc as PDF or DOCX with full formatting fidelity (fonts, colors, alignment, tables, images, headers/footers, page layout). External images → fetched from source and embedded as base64 inline (not URL).
- **Group export**: Select multiple notes → arrange → add cover page → single PDF/DOCX. Section breaks between notes.
- **PDF generation**: Server-side Puppeteer/Playwright. Page layout settings respected. Headers/footers. Page numbers. Auto TOC. Cover page.
- **DOCX generation**: Server-side via docx.js. Full MS Word compatibility. Named styles, table borders/shading, embedded images, headers/footers.
- **Export settings dialog**: Paper size, margins, orientation, TOC toggle, header/footer text, page numbering style.
- **Batch export**: N docs as separate files in ZIP archive.
- **Template + export pipeline**: Apply template to notes then export as group (e.g., 5 bài học → "Giáo trình" template → single PDF with cover + TOC).
- **Extended**: #69 Export Engine System adds PPTX, SVG, batch job queue, template marketplace, and MCP/HTTP API access.
- **Clipboard copy**: Copy as formatted rich text (RTF/HTML) for pasting into Word/Google Docs.

---

## AI

### 21. Auto-Tagging

On save, the LLM suggests relevant tags from your existing vocabulary.

- **Trigger**: On note save (Cmd+S, navigate away, auto-save on background).
- **Three modes**:
  - **Suggest** (default): Tags appear with a sparkle icon. User must accept or dismiss. Not indexed until accepted.
  - **Auto-apply**: Tags added silently. Small undo toast: "Added 2 tags [Undo]".
  - **Manual only**: No auto-tagging. User triggers via "✨ Suggest" button in the tag bar.
- **Confidence threshold**: Tags below 50% confidence not shown.
- **Edge cases**: Blank/short notes skipped. Existing tags not duplicated. Offline queue.
- **LLM input**: Title + content (~2000 chars max) + existing tag vocabulary. Returns 1-5 suggestions with confidence scores.

### 22. Agentic Chat

RAG chat panel for querying your knowledge base conversationally.

- **Entry**: Cmd+Shift+C, floating button (bottom-right), sidebar icon, `/ask` slash command.
- **Resizable panel**: Docked (default ~400px right panel), floating (draggable window), full-page (expand icon).
- **Tag-scoped retrieval**: Dropdown to scope to specific tags. Inline `@tagname` support.
- **Streaming SSE**: Typewriter effect with pulsing cursor. Stop button to interrupt.
- **Citation cards**: Inline `[N]` references with expandable cards showing title, snippet, tags, relevance bar (0-100%), pin icon, and "Open" button.
- **Follow-up suggestions**: Clickable pills below each response for natural conversation flow.
- **Session history**: Auto-saved, auto-titled. Rename, delete, share. Search across sessions.
- **How it works**: Query + scope → hybrid search over notes → chunks + history → LLM streaming → citations rendered in real-time.

### 23. Wiki Synthesis

Generate structured wiki articles from all notes under a tag.

- **Trigger**: Button on tag page or tag context menu ("✨ Generate Wiki Article").
- **Layout**: Special "Synthetic" page with gradient left border. Table of contents sidebar.
- **Citation system**: Inline `[N]` markers. Hover = popover with source note title + preview. Click = open source note in split view. Footer has numbered reference list.
- **Editable**: Click to edit any paragraph. Delete sections (with undo). Reorder via drag handle. Add manual content between AI sections. Badges indicate AI-generated vs. user-modified.
- **Regeneration**: Manual only. Tracks "notes added since last generation". Previous version preserved in history (revertable). Optional scope: select specific notes to re-synthesize from.
- **How it works**: Collect notes under tag (up to ~200) → chunk → LLM synthesizes → markdown with `[N]` citations → interactive rendering. Delta synthesis on regeneration.

### 24. Daily Briefing

Auto-generated daily summary of your knowledge activity.

- **Trigger**: Generated on first app open of the day. Stored as a system note.
- **Six sections**:
  1. **AI Brief** — Narrative summary of today's notes, patterns, and connection discoveries (2-3 paragraphs).
  2. **New Notes** — Chronological list of notes created today.
  3. **Graph Snapshot** — Mini force-directed graph of today's activity.
  4. **Suggested Review** — Stale notes (unmodified >7 days) related to today's activity.
  5. **Connection Suggestions** — Specific "you should link these" recommendations.
  6. **Stats** — Streak, total notes, notes this week.
- **Compact widget**: Dashboard variant shows condensed version with key highlights.
- **Customization**: Toggle sections on/off in Settings → Daily Briefing.
- **AI Brief LLM**: Analyzes today's notes + random sample of 10 older notes + current tag structure.

### 25. Similar Notes

When viewing a note, the top-5 most similar notes by embedding cosine similarity, with optional sorting by connection strength.

- **Right panel**: Shows when viewing a note. Each card has title, similarity bar, first-line preview, tags, "Open" button, and "Link" button.
- **Bottom of editor**: Persistent section below the content with same cards + drag target for manual linking.
- **One-click link**: "Link" button creates a bidirectional link. Success animation + "Linked!" toast. Card moves to Backlinks.
- **Manual linking**: Drag a note from sidebar/search onto the "Related Notes" section. Or type `[[Note Title]]` in editor for auto-complete linking.
- **Graph integration**: Solid edges = manual links. Dashed edges = auto-similarity. User can convert auto to manual.
- **How it works**: Embedding vector → cosine similarity against all notes → top-K (default 5) → cached, re-computed on note modify. Threshold: below 40% not shown.
- **Sort by connection strength**: Order similar notes by multi-factor strength (links + tags + embedding + reciprocity) instead of raw embedding similarity. Strongest-connected notes appear first. Toggle in Similar Notes toolbar.

### 26. Spaced Repetition Flashcards

Convert note content into flashcards with the FSRS scheduling algorithm.

- **Flashcard creation**: Select text → "Create flashcard". Supports cloze deletion ({{c1::term}}) and Q&A pairs.
- **FSRS scheduler**: Free Spaced Repetition Scheduler (v5) for optimal review timing.
- **Review queue**: Daily review session with swipe-based or button-based rating (Again/Hard/Good/Easy).
- **Stats dashboard**: Due today, total cards, retention rate, review streak, predicted mastery.
- **Integration**: Create flashcards directly from any note via inline context menu.

### 27. Scheduled Reports

Recurring AI-generated summaries delivered on a schedule.

- **Schedule options**: Daily, weekly, monthly, or custom cron expression.
- **Content templates**: "Notes created this week", "Tag summary for #tag", "Connection discovery across all notes", "Stale note review".
- **Delivery**: In-app notification center initially. Email delivery (future).
- **Generation**: Same LLM pipeline as Daily Briefing, but on user-defined schedule.

### 28. AI Second Knowledge

Multi-layer AI-generated knowledge layer for token-efficient agent context and insight discovery.

**Layer 1 — Structured Shadow**: Per-document compact summary at section-level granularity, not blob. JSON structure with `summary`, `key_points[]` (per-heading), `entities[]` with types, `llm_tags[]`.

- **Auto-generation**: After a note is created or edited, the LLM generates section-level summaries.
- **Storage**: `shadow_docs` table in SQLite, linked 1:1 to each doc. Updates when doc content changes.
- **Triggers**: On save, periodic cron for dirty docs, on-demand when agent requests context, bulk regenerate.
- **SSE events**: `shadow:updated` and `shadow:failed` broadcast to subscribers.
- **Token budget**: ~300-500 tokens per shadow doc (10x reduction vs. full doc).

**Layer 2 — Doc Relation Graph**: Auto-inferred edges between documents.

- **Edge types**: `prerequisite`, `continues`, `similar`, `references`, `contradicts`, `example_of`.
- **Storage**: `doc_inferred_edges` table with confidence score, evidence text, `auto_generated` flag, `reviewed` flag.
- **Confidence scoring**: 0.0–1.0 based on content overlap, citation patterns, heading structure similarity.
- **User review**: Graph shows inferred edges as dashed lines. User can confirm ✅ or reject ❌.

**Layer 3 — Workspace Glossary**: Auto-extracted domain terms across all documents.

- **Extraction**: LLM scans heading structures, first paragraphs, repeated terms across docs.
- **Storage**: `glossary_terms` table with term, definition, aliases, source docs array, context sentences.
- **Consumers**: Wiki synthesis uses glossary for cross-doc term resolution. Chat auto-links terms.

**Layer 4 — Temporal Delta**: Semantic changelog for AI agents.

- **Storage**: `doc_temporal_delta` table with `change_type` (created|modified|restructured|deleted), summary, impact, token_delta.
- **Purpose**: Agents can answer "what changed since yesterday" without re-reading the full doc.
- **Rollup**: Daily cron rolls up per-doc deltas into a workspace changelog.

**Layer 5 — Agent Context Cache**: Pre-computed context windows per document per consumer type.

- **Variants**: `chat_context` (200 tokens, focused on entities), `mcp_context` (300 tokens, full summary), `briefing_context` (150 tokens, headline), `wiki_context` (500 tokens, full structured).
- **Cache invalidation**: On shadow update or temporal delta creation.
- **Purpose**: Zero-latency context for agent operations — no real-time LLM calls.

**Consumers**: Agentic Chat uses layer 5 context cache. Wiki synthesis uses layers 1 + 3. Briefing uses layer 4 rollup. MCP `get_doc_context` returns layer 1 + relevant glossary terms.

---

### 29. AI Insights Panel

Workspace-level visibility UI into all AI second knowledge activity.

- **Right Panel "Shadow" tab**: Per-doc AI shadow viewer with status badge (pending/generating/ready/failed), collapsible summary, key points list, extracted entities, LLM-suggested tags (click to add). Thumbs up/down for feedback.
- **`/ai/insights` page**: Workspace-wide AI activity timeline (shadow generations, edge discoveries, glossary additions). Inferred Graph viewer with confirm/reject per edge. Glossary viewer with search, edit, jump-to-doc. Temporal timeline filterable by 24h/7d/30d. Token Economy stats (tokens saved vs spent by cache).
- **Graph toggles**: Show/hide inferred edges (dashed), stale sync nodes (highlight if content changed since last shadow), ghost nodes (inferred nodes without docs).
- **Settings**: Bật/tắt từng layer independently. Exclude specific docs. Frequency: on save / hourly / daily / manual.
- **Feedback loop**: `shadow_interactions` table records thumbs up/down, edge confirm/reject, summary edits — improves future LLM prompts.

---

## Integration

### 30. RSS Feeds

Import content from RSS sources as notes.

- **Add feeds**: Enter RSS/Atom URL. Auto-discovers feed metadata (title, icon).
- **Import**: Fetch entries, each becomes a note with title, content, source attribution, published date.
- **Polling**: Background fetch when app is open (configurable interval).
- **Management**: List of feeds with last-fetched timestamps, entry counts. Remove or refresh individual feeds.

### 31. MCP Server
→ Superseded by **#55 MCP Server + HTTP API**. See [that section](#55-mcp-server--http-api-for-external-ai-agents) for the full programmatic interface.

### 32. Dashboard

The landing page when you open Knot.

- **Recent notes**: Last 10 notes with title, preview, tags, timestamp.
- **Active tags**: Tag cloud or list of tags used today/this week.
- **Quick stats**: Total notes, notes this week, tags used, streak.
- **Daily briefing widget**: Compact brief card with key highlights and "View full briefing" link.

### 33. Web Clipping

Capture web content directly into Knot.

- **Bookmarklet**: Drag "Clip to Knot" to browser bookmarks bar. Click on any page to clip.
- **Content extraction**: Readability algorithm extracts main content (strips ads, nav, sidebar).
- **Auto-tagging**: AI suggests tags based on page content.
- **Source attribution**: Saved with source URL, domain, and clip timestamp.
- **Target tag**: Option to clip directly into a specific tag.

### 34. PDF Annotation → Note

Upload PDFs and extract annotations as searchable notes.

- **Upload**: Drag PDF onto a note or use file picker. PDF stored as blob.
- **Inline PDF viewer**: Read PDF within the app. Highlight text, add margin notes.
- **Extract annotations**: "Convert annotations to notes" — each highlight becomes a blockquote note, each margin note becomes a bulleted note.
- **Backlink**: Extracted notes link back to PDF + page number.

### 35. Scripting API

JavaScript API for automating Knot.

- **Sandbox**: Isolated JS execution environment (QuickJS/isolated-vm).
- **Core objects**: `knot.notes`, `knot.tags`, `knot.search`, `knot.graph`.
- **Event hooks**: `onNoteCreated`, `onTagAdded`, `onSave`, `onSchedule`.
- **Script management**: Create/edit/disable scripts from Settings → Scripts.
- **Community store**: (future) Marketplace for sharing scripts.

---

## Platform (1 feature)

### 36. CRDT Real-Time Collaboration

Real-time collaborative editing powered by Conflict-free Replicated Data Types.

- **Yjs-based**: CRDT backend for conflict-free concurrent edits.
- **Real-time sync**: WebSocket server for live collaboration. Multiple cursors visible.
- **Offline support**: Edits while offline sync automatically when reconnected.
- **Optional**: Disabled by default (single-user). Enable in Settings → Collaboration.
- **Sync server**: Standalone Node.js server (separate process) or integrated mode.

---

## New Features (37-46)

### 37. Task Management (Kanban)

Kanban-based task management powered by the existing kanban backend on Pi. Shared workspace for humans and AI agents with real-time sync.

- **Kanban core**: Boards, columns, cards — full CRUD via REST API. Drag-and-drop cards between columns. Archive/restore. Reorder columns.
- **Sub-tasks**: Parent/child card hierarchy via `set_card_parent` API. Expand/collapse in card detail. AI agent splits a task into sub-tasks automatically.
- **Dependencies**: Blocks/blocked_by between cards. Visual dependency arrows in kanban view. Cycle detection prevents circular deps.
- **AI agent integration**: Agents interact via MCP tools (list_boards, create_card, move_card, update_card, set_card_parent, get_card_children, etc.). Agents can take tasks from backlog, split into sub-tasks, assign to themselves or other agents, suggest task breakdown via LLM.
- **LLM features**:
  - **Smart suggest**: Board analysis engine combines deterministic rules (overdue, backlog, missing trip cards) + LLM context. Dual strategy ensures suggestions even when LLM is offline.
  - **Auto-categorize**: Analyzes all cards and suggests optimal column placement with reasoning. Supports partial categorization (selected cards only).
  - **Auto-tag**: LLM generates 2-5 relevant tags from title + description. Falls back to keyword-based matching (server/deploy→devops, bug→fix, idea→idea, etc.) when LLM unavailable.
  - **Generate plan**: Breaks a goal card into 3-7 sub-tasks with priority (urgent/high/medium/low) and time estimates (minutes). Creates sub-task cards via API.
  - **Web search**: For trip boards, fetches DuckDuckGo Instant Answer results (travel guides, attractions) as LLM context for richer suggestions.
  - **Knowledge base integration**: Queries personal knowledge base for relevant context before generating suggestions (via Atomic KB API).
  - **Trip chat**: Context-aware chat that understands existing board cards + web search → suggests new places/activities with metadata (coordinates, category, rating, estimated time, price).
  - **Stub fallback**: When LLM endpoint is unreachable, returns deterministic stub responses instead of errors — system never crashes from LLM timeout.
- **Collaboration**: Comments on cards. Activity log (who did what when). Real-time SSE push — AI agent actions appear instantly on UI, human edits notify agents.
- **Tags**: Create/manage tags. Filter board by tag. Auto-tag via LLM.
- **Views**: Kanban board, list view, map view (geo-tagged cards), mind map view, split view (kanban + map). Per-board default view setting.
- **Dashboard**: Board list grid showing all boards, card counts, last activity, member count.
- **Search**: Full-text search across all cards with filters (board, column, tag, assignee, date range).
- **Doc linking**: Link cards to docs. Card context shown in doc sidebar. Docs with linked cards get a task indicator in graph view.
- **Markdown sync**: GFM checkboxes in docs can optionally sync to kanban cards bidirectionally (toggle per doc).
- **Backend**: Existing Go kanban backend (Pi port 3004). SQLite (kanban.db, WAL mode). MCP server at /mcp for AI agent integration.
- **OSS reference**: [Kanban Go Backend](https://github.com/your-org/kanban-backend) — custom Go backend with chi router, MCP, LLM integration. Source at `/home/chad/kanban/` on Pi.

### 38. Daily Notes & Calendar

Journaling workflow with daily auto-creation and calendar navigation.

- **Daily note**: Auto-created on first open each day. Template-driven (configurable).
- **Calendar widget**: Sidebar calendar showing days with note indicators (dot = has note, ring = has tasks due)
- **Periodic notes**: Weekly, monthly, quarterly, yearly templates — auto-created on schedule
- **Quick journal**: Single command (`Cmd+Shift+N`) opens today's daily note
- **Future navigation**: Click any date in calendar to open/create note for that date
- **Integration with tasks**: Daily note shows tasks due today + overdue tasks
- **Integration with #42 Quick Capture**: Captures go to daily note by default
- **OSS reference**: [Obsidian Calendar (MIT)](https://github.com/obsidian-community/calendar) — calendar UI, date-based note navigation

### 39. Custom Properties & Frontmatter

User-defined metadata on any doc, powering queries (#40) and structured data.

- **Property panel**: Sidebar panel showing all properties of current doc. Add/edit/remove inline.
- **Property types**: Text, Number, Date (with calendar picker), Select (single), Multi-Select, Checkbox, URL, Email, Doc Link
- **Frontmatter sync**: Properties stored as YAML frontmatter in the markdown. Visual editor mirrors raw YAML.
- **Inheritance**: Properties defined on a parent doc are inherited by children (can override)
- **Templates**: Templates (#19) can define default properties for new docs
- **Validation**: Required fields, type constraints, regex patterns
- **Batch edit**: Select multiple docs → edit properties in bulk
- **OSS reference**: [Anytype (Apache 2.0)](https://github.com/anyproto/anytype-ts), [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) — property system, type system, relation model

### 40. Note Query Language

SQL-inspired query language for finding, filtering, and aggregating docs by properties, tags, hierarchy, and content.

- **Query syntax**: `FROM docs WHERE tags CONTAINS "math" AND created > date("2025-01-01") SORT BY updated DESC`
- **Query sources**: `FROM docs` (all docs), `FROM "folder"` (doc and children), `FROM #tag`, `FROM @property`
- **Output formats**: Table, List, Kanban, Calendar — rendered inline or in sidebar
- **Inline queries**: Embed live query block in any doc — renders as a table/list. Auto-refresh on data change.
- **Query editor**: Syntax-highlighted editor with autocomplete (property names, tags, operators)
- **Aggregation**: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY` for statistics
- **Task queries**: `FROM docs WHERE tasks.due < date("today") AND tasks.status != "done"` — powering task views (#37)
- **Export**: Query results exportable as CSV/JSON
- **OSS reference**: [Obsidian Dataview (MIT)](https://github.com/blacksmithgu/obsidian-dataview) — query language, execution engine, inline rendering

### 41. Outliner Mode

Block-level editing mode for structured thinking, inspired by Roam Research and Logseq.

- **Mode toggle**: Switch between paragraph (default) and outliner mode per doc or globally
- **Block indentation**: `Tab` indent, `Shift+Tab` outdent. Enter creates new block at same level.
- **Collapse/Expand**: Click bullet or `Cmd+.` to collapse sub-blocks. Shows child count badge.
- **Drag reorder**: Drag handle (appears on hover) to reorder blocks. Drop zone indicators.
- **Block reference**: `((block-id))` references any block with content preview on hover
- **Block embed**: `!((block-id))` embeds block content inline (live sync with source)
- **Compatibility**: Outliner blocks convert to regular paragraphs when switching modes (flat hierarchy preserved)
- **OSS reference**: [Obsidian Outliner (MIT)](https://github.com/vslinko/obsidian-outliner) — keyboard handler, indent/outdent, drag logic

### 42. Quick Capture

Universal input method for quickly saving ideas, links, files, and voice memos without disrupting workflow.

- **Global hotkey**: Configurable shortcut (default `Cmd+Shift+J`) opens mini capture dialog from anywhere
- **Capture types**: Plain text, URL (auto-fetches title), file attachment, voice memo (via #45)
- **Destination**: Configurable: Inbox note, Daily note (today), or selected doc
- **Auto-tagging**: AI suggests tags based on capture content (#21 Auto-Tagging)
- **Template support**: Apply template to captured content (#19)
- **Clipboard detection**: If text is selected when hotkey pressed, pre-fills capture dialog
- **Shell integration**: Optional CLI command `knot capture "your note"` for terminal/automation
- **OSS reference**: [Obsidian QuickAdd (MIT)](https://github.com/chhoumann/quickadd) — capture dialog, macro system

### 43. Focus / Typewriter Mode

Distraction-free writing environment for deep work.

- **Focus mode**: Full-screen editor, hides all panels and sidebars. Access via `Cmd+Shift+F` or toolbar.
- **Typewriter scrolling**: Active line stays centered. Configurable: top/center/bottom.
- **Dim unused lines**: Current paragraph highlighted, rest dimmed (configurable opacity).
- **Minimal UI**: Clean toolbar only (or auto-hide). Zen mode = no UI except text.
- **Custom styles**: Separate font, line height, width, background color in focus mode.
- **Progress indicator**: Word count, estimated reading time, writing goal.
- **Exit**: `Esc` or `Cmd+Shift+F` returns to full UI.

### 44. Readwise / Import Integration

Auto-import highlights and annotations from external reading services.

- **Readwise Reader**: OAuth connect → sync highlights, notes, articles automatically
- **Import sources**: Kindle highlights, Twitter bookmarks, web articles, PDF annotations, newsletters
- **Landing templates**: Configurable template for imported content (e.g., book highlight → note with source + tags)
- **Batch import**: Select which books/articles to import. Each becomes a doc with highlights as blockquotes.
- **Auto-backlink**: Each highlight blockquotes links back to original source + page/location
- **Scheduled sync**: Auto-sync every N hours (configurable). Manual sync button.
- **API**: Readwise Reader API (official) for fetching highlights
- **OSS reference**: Readwise Reader API docs, Hypothesis (MIT) — open annotation standard

### 45. Voice Notes

Record and transcribe audio notes directly within the app.

- **Inline recording**: Microphone button in editor toolbar. Click to record, click to stop.
- **Audio storage**: Stored as blob attachment (WebM/MP3). Embed in doc like any file.
- **Auto-transcription**: On stop recording, send to Whisper (local or API) for transcription.
- **Transcript as text**: Transcription appended below audio player as editable text.
- **Playback**: Inline audio player in doc. Speed control (0.5x-2x).
- **Background recording**: Continue recording when switching docs or minimizing.
- **Language detection**: Auto-detect spoken language for transcription.
- **OSS reference**: [OpenAI Whisper (MIT)](https://github.com/openai/whisper) — transcription model, local or API inference

### 46. Git Backup

Versioned backup to Git with auto-commit and optional remote sync.

- **Auto-commit**: Save trigger (on edit, on close, hourly, daily) commits all changes to local Git repo
- **Commit messages**: Template: `docs: auto-sync {n} files [{date}]`. Configurable format.
- **Branching**: Default branch per device. Option to push to remote (GitHub/GitLab).
- **Status indicator**: Sidebar dot: green (synced), yellow (pending commit), red (conflict/uncommitted)
- **Ignore patterns**: Configurable `.gitignore` for attachments, exports, cache
- **Conflict resolution**: On conflict, Knot's version wins with backup file saved.
- **Initial setup**: Auto-init Git repo on first launch if none exists
- **OSS reference**: [Obsidian Git (MIT)](https://github.com/denolehov/obsidian-git) — auto-commit, push, diff strategy


---

## C. AI Auto-Organization Features

### 47. Auto-Classify to Folder
LLM phân tích note content → gán vào folder phù hợp. Chạy on-save hoặc batch.

- **Trigger**: On save (real-time) hoặc batch run từ P3 scheduler
- **Process**: LLM nhận title + content → output folder path
- **Prompt pattern**:
  ```
  System: "You are a classification engine. Given a note title and content,
  respond with exactly the folder path (e.g. '/dev/infra') or 'NONE' if uncertain.
  Available folders: {list}"
  User: "{title}\n\n{content[:2000]}"
  ```
- **Confidence threshold**: >70% → auto-classify; 50-70% → suggest; <50% → skip
- **Preview**: Batch run shows pending moves, confirm all/skip
- **Feedback loop**: Nếu user move note manual → LLM học preference (lưu vào local history, top-10 recent moves)

### 48. Auto-Folder Suggest
Khi user tạo note mới, AI suggest folder ngay trong new-note dialog.

- **Trigger**: New note dialog opens
- **UX**: Folder dropdown hiện badge "✨" bên cạnh suggest. Click để chọn.
- **Speed requirement**: <500ms (P1 priority queue). Cache folder embeddings để tránh LLM call.
- **Fallback**: Nếu Ollama queue busy → hiện "AI suggest unavailable" + folder dropdown trống
- **Cache**: Embedding của folder names cached, similarity search local (không cần LLM)

### 49. Auto-Link Discovery
Quét notes hiện có → phát hiện mentions tiềm năng → suggest bidirectional links.

- **Trigger**: Manual run + on-save suggest
- **Process**: LLM + BM25 hybrid: BM25 tìm candidate notes, LLM xác nhận relevance
- **Hybrid pipeline**:
  ```
  Note → BM25 search (top-10 candidates) → LLM rerank (top-3) → Insert links
  ```
- **Cost saving**: BM25 trước, LLM chỉ confirm. Giảm 70% LLM calls so với pure LLM.
- **Batch mode**: P3 job quét định kỳ, phát hiện link mới
- **Review panel**: "5 new links discovered" → review/accept/reject

### 50. Auto-Template Matching
Khi paste content hoặc tạo note mới, AI detect loại content → suggest template.

- **Trigger**: Paste event / create note
- **Pattern match examples**:
  - `"met with John re Q3 budget"` → **Meeting template**
  - `"bug: login fails on Safari"` → **Bug report template**
  - `"## API: GET /users"` → **API doc template**
- **Override**: User có thể disable per-pattern
- **Custom templates**: User-defined patterns trong template frontmatter

### 51. Auto-Merge Duplicates
Detect notes trùng lặp nội dung (similarity >85%) → suggest merge.

- **Trigger**: Manual run + optional auto-detect on new note
- **Detection**: Cosine similarity trên embedding + title fuzzy match
- **Thresholds**:
  - >95%: auto-merge (với undo)
  - 85-95%: suggest merge, show diff
  - <85%: skip
- **Merge strategy**: Content union (A ∪ B), frontmatter merge (B fields bổ sung overwrite A template fields, A wins cho conflicting values), backlinks union
- **Undo**: Merge tạo snapshot trước khi merge



### 52. Notification System
Hệ thống notification nội bộ cho AI features. Thiết kế cho cả desktop lẫn web future.

- **Notification Center**: Icon bell ở sidebar. Dropdown list: unread/read/all.
- **Notification types**:
  - `ai_suggestion` — "5 new links discovered" → review
  - `batch_complete` — "Background tagging done: 12 notes tagged"
  - `daily_briefing_ready` — "Your daily briefing is ready"
  - `location_alert` — "You're in Hanoi — 3 travel notes available"
  - `system` — "Sync conflict resolved", "Backup complete"
- **Preferences**: Per-type toggle (on/off). Per-feature mute.
- **Storage**: Local SQLite table `notifications(id, type, title, body, action_url, read_at, created_at)`
- **Grouping**: Similar notifications gộp lại: "3 new links discovered" + "2 link suggestions" → "5 new suggestions"
- **Persistence**: Giữ notification 30 ngày, auto-cleanup sau đó
- **Future web**: SSE/WebSocket push từ server. Web Push API cho browser notifications.
- **UX**:
  - Unread badge count trên bell icon
  - Click notification → navigate (e.g. click "5 new links" → mở Link Review panel)
  - "Mark all read" button
  - Dismiss swipe (future mobile)

### 53. Location-Based Suggestions
Khi user ở một địa điểm, Knot detect location → suggest notes liên quan.

- **Trigger**: App start + periodic (every 30 min) + manual refresh
- **Detection**: Browser Geolocation API → reverse geocode qua Nominatim (OpenStreetMap, free, 1 req/sec)
- **Location tagging**: Note frontmatter `location: "Hanoi, Vietnam"` hoặc tọa độ `location: "21.0285,105.8542"`
- **Matching logic**:
  1. Reverse geocode tọa độ → city/district name
  2. Match substring với `location` field trong notes
  3. Nếu match → suggest note card
- **Privacy**: 100% local. Không gửi location data ra ngoài (trừ Nominatim reverse geocode, có thể disable).
- **Fallback**: Nếu user disable location → chỉ suggest dựa trên `location` field nếu note có tag coordinate
- **Use cases**:
  - Du lịch: "You're in Hội An — 5 travel notes from your last trip"
  - Công việc: "You're at WeWork D1 — 3 work notes tagged here"
  - Ăn uống: "Gần đây có Phở Thìn — bạn có note về quán này"
- **Manual override**: User có thể add location tag vào note mà không cần GPS
- **Privacy controls**:
  - Off by default. Opt-in dialog first run.
  - Granular: "Ask each time" / "Always allow" / "Never"
  - Disable Nominatim: chỉ match coordinates tags

### 54. Task / Work Reminders
Hệ thống nhắc nhở công việc gắn với notes và tasks.

- **Reminder types**:
  - **Time-based**: Set thời gian cụ thể (2026-07-05 14:00)
  - **Relative**: "Remind in 1 hour", "Tomorrow 9am", "Next Monday"
  - **Recurring**: Daily, weekly, monthly, custom interval (every 3 days), cron expression
- **Targets**: Gắn reminder vào một note cụ thể hoặc inline task trong note (block reference)
- **Delivery**:
  - In-app notification (Notification Center #52)
  - Desktop notification (Tauri native notification)
  - Future: mobile push, email reminder
- **Snooze**: "Remind in 15 min / 1 hour / Tomorrow" — giống Google Calendar snooze pattern
- **Overdue handling**: Overdue reminders hiển thị màu đỏ, auto-re-schedule nếu recurring
- **Reminder list**: Dedicated page/panel: **Upcoming**, **Overdue**, **Completed** tabs
- **Quick-create**: `/remind` slash command trong editor — "remind me about this next Tuesday"
- **Calendar integration** (future): iCal export, CalDAV sync
- **Storage**: SQLite table `reminders(id, note_id, title, remind_at, recurring_cron, status, snooze_until, completed_at, created_at)`
- **UX**:
  - Reminder badge trên note card ("🔔 Jul 5")
  - Checkbox inline trong editor để mark complete
  - Batch complete / reschedule từ reminder list
  - Drag reminder list items để reschedule (timeline view)

### 55. MCP Server + HTTP API for External AI Agents
Programmatic interface cho phép external AI agents (Claude Code, Cursor, custom agents) truy cập và điều khiển toàn bộ tính năng của Knot.

#### MCP Server
- **Transport**: stdio (local agents) + SSE (remote agents, port :8767)
- **Tools exposed** (tất cả features của Knot):
  - **Notes**: `create_note`, `read_note`, `update_note`, `delete_note`, `search_notes`, `list_notes_by_tag`
  - **Semantic**: `semantic_search`, `get_similar_notes`, `get_related_notes`
  - **Tags**: `create_tag`, `list_tags`, `tag_note`, `untag_note`
  - **AI Features**: `get_wiki`, `chat_with_context`, `auto_tag_note`, `get_daily_briefing`, `get_shadow_doc`
  - **Canvas**: `get_graph`, `get_graph_for_note`, `get_node_map`
  - **Organization**: `classify_to_folder`, `suggest_folder`, `find_links`, `detect_duplicates`
  - **Reminders**: `create_reminder`, `list_reminders`, `complete_reminder`, `snooze_reminder`
  - **System**: `list_providers`, `get_stats`, `export_note`
- **Security**: Local-only mode (default). API key auth cho remote access.
- **Config**: MCP settings trong `~/.config/opencode/mcp.json` hoặc Knot settings UI
- **Discovery**: MCP server list tools dynamically dựa trên registered services

#### HTTP API (REST)
- **Base URL**: `http://localhost:8767/api/v1`
- **Note**: MCP Server và HTTP API share cùng port `:8767`. Knot chạy một HTTP server duy nhất handling cả MCP SSE + REST requests, phân biệt bằng `Content-Type: application/json+ mcp` header cho MCP requests.
- **Auth**: Bearer token (`X-API-Key` header hoặc query param)
- **Endpoints**: RESTful mapping of all MCP tools (notes, tags, search, AI, canvas, organization, reminders)
- **Docs**: OpenAPI 3.0 spec tại `GET /api/v1/openapi.json`
- **Rate limiting**: 100 req/min per API key (configurable)
- **CORS**: Cho phép web clients và external services
- **SDK** (future): Python SDK (`pip install knot-sdk`), TypeScript SDK (`npm install knot-sdk`)

#### Architecture
```
External AI Agent (Claude Code, Cursor, custom)
    │
    ├── MCP (stdio) ─── Knot MCP Server (:8767)
    │                      │
    ├── MCP (SSE)  ───────┤
    │                      ├── Service Layer (shared)
    ├── HTTP API ─── Knot HTTP Server (:8767) (same server, same port)
    │                      │
    └── WebSocket ── (future)
                           └── Database + Ollama
```

- **Service Layer**: Cả MCP và HTTP API đều dùng chung service layer — một feature chỉ implement một lần, exposed qua cả 2 giao thức
- **Use cases**:
  - Claude Code: `knot create_note "Meeting notes" --tag work`
  - Cursor agent: Gọi Knot API để tra cứu notes khi coding
  - Custom agent: Python script gọi Knot HTTP API để auto-classify inbox
  - Automation: GitHub action tạo daily briefing qua HTTP API
---

## Plugin System

### 56. Plugin Manifest & Loader
Cơ sở hạ tầng cho toàn bộ plugin system. Scan, validate, load, lifecycle management.

- **Plugin directory**: `~/.knot/plugins/*/knot-plugin.json`
- **Manifest format**:
  ```json
  {
    "id": "knot-source-notion",
    "name": "Notion Importer",
    "version": "1.0.0",
    "min_knot_version": "0.5.0",
    "entry": "main.js",
    "permissions": ["notes:read", "notes:write", "network", "settings:read"],
    "hooks": ["after_note_save", "on_chat"],
    "dependencies": { "knot-utils": "^1.0.0" }
  }
  ```
- **Loader behavior**: Scan → validate → resolve dependencies → load entry → call `on_activate()`
- **Lifecycle**: `installed` → `enabled` → `active` (hooks registered) → `disabled` → `uninstalled`
- **Error handling**: Fail → disable plugin, log error, notify user
- **Hot reload**: Auto-detect changes in plugin directory, re-load on file change

### 57. Extension Points (Hook System)
Event-driven hook system cho phép plugins can thiệp vào mọi khía cạnh của Knot.

- **Lifecycle hooks**: `on_activate(config)`, `on_deactivate()`, `on_config_change(key)`
- **Data hooks**: `before_note_save(note)`, `after_note_save(note)`, `before_note_delete(id)`, `after_note_import(note)`
- **AI hooks**: `on_classify(note)`, `on_summarize(note)`, `on_embed(text)`, `on_chat(messages, context)`
- **UI hooks**: `register_command(name, handler)` → slash commands, `register_panel(id, component)` → sidebar panels, `register_editor_action(name, callback)` → editor buttons, `register_note_type(type, renderer)` → custom note types
- **Event Bus**: `plugin.publish('note:created', { id })`, `plugin.subscribe('tag:deleted', handler)`
- **Hook pipeline**: Hooks execute in registration order. Plugin can `skip()` (cancel), `modify()` (transform data), hoặc `delegate()` (pass to next plugin).

### 58. Plugin Manager UI
Giao diện quản lý plugin trong Knot.

- **Plugin list**: Table with name, version, status (enabled/disabled/error), author
- **Actions**: Enable/disable, uninstall, check for updates, view details
- **Plugin detail page**: Manifest info, permissions, hooks registered, config UI (auto-generated từ manifest config schema)
- **Install**: From local file (drag-drop `.knot-plugin`), from URL, from store
- **Error log**: Per-plugin log viewer
- **Dependency view**: Graph showing plugin dependencies

### 59. Plugin Sandbox
Isolation layer cho third-party plugins.

- **Runtime**: QuickJS hoặc Boa (JavaScript engine trong Rust/Go)
- **Capabilities**: Giới hạn theo manifest permissions
  - `notes:read/write` → core API access
  - `network` → fetch API (rate-limited)
  - `filesystem:read/write` → restricted to plugin data dir
  - `settings:read/write` → plugin settings only
  - `ui` → DOM access within plugin panel only
- **Resource limits**: Memory cap (64MB), CPU time, network request count
- **Fallback**: Plugin không sandbox được → chạy restricted mode (chỉ data hooks, no UI)

### 60. Plugin Store / Marketplace
Internal registry để browse và cài đặt plugins.

- **Registry source**: GitHub releases + `knot-plugins/index.json` (community repo)
- **Browse**: Search, category filter, sort by downloads/rating
- **Install flow**: Click → download → manifest validation → dependency check → confirmation → install
- **Updates**: Check for newer versions, one-click update, changelog view
- **Submission**: GitHub PR to community repo, auto CI validate manifest
- **Ratings**: Star rating + review (optional, requires account)

### 61. Source Plugin API
Plugin kết nối external data sources, import/sync notes.

- **Interface**: `fetch()` → raw data, `transform()` → Knot note format, `sync()` → incremental sync
- **Built-in sources roadmap**: Notion, Google Keep, Apple Notes, GitHub Issues, Confluence, Obsidian vault, Email (IMAP), Pocket
- **Sync modes**: One-time import, periodic poll, webhook-triggered
- **Conflict resolution**: Last-write-wins hoặc keep-both với diff
- **Scheduling**: Plugin tự đăng ký cron schedule trong manifest

### 62. AI Provider Plugin
Plugin thay thế hoặc bổ sung AI backend ngoài Ollama.

- **Interface**: `chat(messages, options)` → response, `embed(text)` → vector, `classify(text, categories)` → category
- **Built-in providers roadmap**: OpenAI, Anthropic Claude, Google Gemini, Groq, Together AI, vLLM, llama.cpp
- **Routing**: Plugin có thể route theo model name (e.g., "gpt-4" → OpenAI plugin, "claude-3" → Anthropic plugin)
- **Fallback chain**: Plugin A fail → tự động fallback sang plugin B
- **Cost tracking**: Token count + cost estimate per plugin (nếu có pricing)

### 63. Export Plugin API
Plugin custom export formats ngoài PDF/DOCX mặc định.

- **Interface**: `export(note, options)` → file bytes + metadata
- **Target formats**: Notion (API push), Obsidian (markdown vault), Anki (APKG), static site (JSON/HTML), CSV, JSON-LD
- **Batch export**: Plugin nhận list notes, tự handle ordering và bundling
- **Progress reporting**: Plugin report progress → UI progress bar

### 64. UI Plugin API
Plugin tạo custom surfaces trong Knot UI.

- **Custom note types**: Structured editor (e.g., "Recipe" with fields: ingredients, steps, time). Plugin đăng ký schema + renderer.
- **Custom panels**: Sidebar/docked panels với webview nội bộ. Plugin render HTML/CSS/JS trong sandboxed iframe.
- **Custom editors**: Diagram editor (draw.io style), mind map, kanban board, timeline.
- **Theme plugins**: Custom CSS variables, dark/light mode override.
- **Commands**: Plugin đăng ký palette commands + keyboard shortcuts.
- **Context menus**: Plugin thêm items vào right-click menu trên notes, tags, canvas.

### Integration with MCP Server

Khi plugin active, nó tự động expose tools qua MCP catalog:
- **Plugin tools prefix**: `plugin.<plugin_id>.<tool_name>`
- **Discovery**: MCP `listTools` returns union of core tools + plugin tools
- **Lifecycle sync**: Plugin disable → MCP tools removed dynamically
- **Use case**: Claude Code gọi `knot plugin.source.notion.sync` để trigger Notion sync



---

## D. Fediverse / Federation

### 65. Space-Based Architecture & Sync Engine
Cơ sở hạ tầng federation: mỗi Space (subject/course/project) là đơn vị sync độc lập. Hub-and-spoke topology — central server lưu tất cả, child server chỉ sync subset được authorization.

- **Space concept**: Mỗi space có id, name, description, owner_id, schema (tùy chọn). Space = sync boundary.
- **Sync model**: Hub-and-spoke. Central server chứa tất cả Spaces. Child server chỉ sync được authorized spaces.
- **Sync direction**: Bidirectional. Child push changes lên central; central push changes xuống children (WebSocket).
- **Granularity**: Per-space sync (không phải per-note). Mỗi space có change_log riêng, cursor riêng.
- **Change tracking**: `change_log(space_id, entity_type, entity_id, operation, data, hash, author_id, parent_id, timestamp)`. Entity types: note, tag, link, property.
- **Cursor-based sync**: Child gửi `since_cursor` → central trả về changes sau cursor đó. Cursor là ID của change entry cuối.
- **Transport**: REST pull (child → central) + WebSocket push (central → child).
- **Offline-first**: Child DB fully local SQLite. All operations work offline. Changes queued in change_log. Sync khi online.
- **Consistency model**: Eventual consistency. No strict ordering guarantees across spaces.
- **Delta sync**: Chỉ gửi changes từ cursor cuối — không gửi full data. Batch size 500 changes mỗi pull.
- **Compression**: gzip body cho payload >1MB.
- **Sync performance**: ~500 bytes/change entry. ~500KB/day traffic cho 1000 changes/day.

### 66. Server Identity & Federation Auth
Mỗi server (central/child) có identity riêng, authenticate qua signed tokens.

- **Server registration**: Child khởi tạo → generate Ed25519 key pair → `POST /fed/register { name, public_key }` → central trả server_id + API key.
- **Key pair**: Mỗi server có Ed25519 key pair. Requests signed với private key. Central verify với public key.
- **Auth tokens**: JWT với claims `{ server_id, space_ids[], role, exp }`. Short-lived (1h). Refresh via API key.
- **API key rotation**: User regenerate API key trong central admin UI. Old key invalidated immediately.
- **Audit log**: Central log mọi request: server_id, timestamp, action, result, IP. Lưu 90 ngày.
- **Server status**: Central theo dõi last_seen per server. Hiển thị online/offline trong admin UI.

### 67. Selective Sync & Permissions
Child chỉ sync spaces mình có quyền. Per-space role-based access.

- **Roles per space**:
  - `owner`: Full CRUD + manage members + delete space. Mỗi space có đúng 1 owner.
  - `editor`: CRUD notes, tags, links trong space. Không thể xóa space hoặc manage members.
  - `viewer`: Read-only. Sync notes về local để tra cứu. Không thể edit.
- **Capability tokens**: JWT scoped to specific space_ids. Central validate token trước mỗi sync operation.
- **Access revocation**: Admin revoke child's access → central reject sync requests. Child nhận `permission_revoked` event qua WebSocket.
- **Auto-discovery**: Child `GET /fed/servers/me` → trả về list spaces + roles. Child tự động sync spaces được cấp.
- **Public spaces**: Option `is_public: true` → bất kỳ child nào cũng có thể sync read-only. Không cần explicit member invite.
- **Space join flow**: Child request join space → owner approve/reject → notification gửi qua WebSocket.

### 68. Conflict Resolution & E2E Encryption
Xử lý concurrent edits từ nhiều children. Optional E2E encryption cho spaces nhạy cảm.

- **Conflict detection**: Central detect conflict khi 2 changes modify cùng entity từ 2 children khác nhau, không có parent-child relationship trong change_log.
- **LWW strategy**: Last-write-wins based on timestamp. Central lưu cả 2 versions, writer identity preserved.
- **Conflict log**: `conflicts(id, space_id, entity_id, version_a, version_b, detected_at, resolved, resolution)`.
- **Conflict review UI**:
  - Admin dashboard: list unresolved conflicts per space.
  - Click → diff view (side-by-side): highlight added/removed/changed lines.
  - Actions: "Keep A", "Keep B", "Edit merged version", "Ignore" (mark resolved, keep current).
  - Notification gửi tới affected children khi conflict resolved.
- **Auto-merge simple conflicts**: Nếu 2 changes edit different fields của cùng entity → auto merge (union). Chỉ flag conflict khi cùng field bị edit khác nhau.
- **E2E Encryption (optional, per-space)**:
  - Algorithm: XChaCha20-Poly1305 với 256-bit key.
  - Key derivation: Argon2id (owner passphrase + random salt) → 256-bit key.
  - Data: Encrypted content stored as base64 blob. Key never leaves owner's device.
  - Central role: Relay-only. Stores encrypted blob. Cannot decrypt content.
  - Metadata: Configurable — titles can be plain (searchable via central) or encrypted (private).
  - Multi-editor support: Option A — share passphrase out-of-band (simple). Option B — asymmetric wrap: owner encrypts space key with each editor's public key (forward secrecy).
- **Trade-offs**: E2E encryption disables central-side full-text search, wiki synthesis, and cross-space AI features cho space đó.

---

## E. Export Engine System

### 69. Export Engine System
Extends the basic PDF/DOCX export (#20) with multi-format support, template system, API-first design, and external tool integration.
Export notes to multiple formats (image/Word/PDF/PPTX) with template system, API-first design, and external tool integration.

- **Format support**:
  - **PPTX**: Presentations via native python-pptx engine or Presenton REST API integration
  - **DOCX**: Rich documents with python-docx, template-based with `{{placeholder}}` markers
  - **PDF**: Print-ready via WeasyPrint/Playwright, CSS layout templates, A4/letter/portrait/landscape
  - **Image (PNG/JPEG/WebP)**: Styled note cards via Playwright screenshot or Pillow rendering
  - **SVG**: Vector output for whiteboard/embedding
- **Template system**:
  - Upload existing PPTX/DOCX/PDF as reusable templates (giống Presenton's approach)
  - Template converter: AI phân tích template structure → extract placeholders
  - Brand themes: fonts, colors, logo auto-applied across formats
  - Template marketplace (future): community-shared templates per format
- **Render pipeline**: Note Markdown → intermediate AST → format-specific renderer → file bytes
- **API access**:
  - MCP tools: `export.render`, `export.list_templates`, `export.upload_template`, `export.batch`
  - HTTP endpoints: `POST /api/export/render`, `POST /api/export/batch`, `GET /api/export/templates`, `POST /api/export/templates`, `GET /api/export/status/:job_id`
- **Batch export**: Multiple notes → single PPTX (presentation), single DOCX (report), or ZIP bundle
- **Presenton integration** (optional): Dùng Presenton API làm PPTX render backend → tận dụng AI slide generation + template engine
- **External tool integration**:
  - Bất kỳ tool nào gọi MCP tools hoặc HTTP API để trigger export
  - Webhook: POST to callback URL khi export hoàn tất
  - Export Plugin API (#63) mở rộng: Plugin đăng ký format mới qua interface `export(note, options)` → bytes
- **Progress & status**: Long-running jobs (batch, large PPTX) → job_id + SSE progress updates
- **Use cases**: Share note as image on social media, generate weekly report as DOCX, auto-build presentation from tagged notes, embed note as SVG in whiteboard
