# Frontend Architecture

## Route Table (18 routes)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Daily briefing + recent notes + quick stats |
| `/notes` | NoteList | Grid/list view of all notes |
| `/notes/new` | NoteEditor | Empty editor for creating a new note |
| `/notes/:id` | NoteDetail | Editor with existing note data |
| `/tags` | TagTree | Full tag hierarchy management |
| `/tags/:id` | TagPage | Notes filtered by tag + wiki generation button |
| `/search` | SearchPanel | Extended search with filters and pagination |
| `/canvas` | Canvas | Force-directed knowledge graph |
| `/wiki/:tagId` | WikiArticle | Generated wiki article for a tag |
| `/rss` | RSSFeeds | Feed source management |
| `/settings` | Settings | AI providers, general preferences, MCP server config |
| `/maps` | MapList | Browse all saved maps (grid view). Supports hierarchy — sub-graphs linkable via `?focus=nodeId` or `?path=root,lvl1,lvl2` |
| `/maps/new` | MapEditor | Create a new map (type selector: mindmap/tree/node/drawing) |
| `/maps/:id` | MapDetail | Full-screen interactive map viewer |
| `/maps/:id/edit` | MapEditor | Edit map nodes, edges, layout |
| \`/database\` | DatabaseView | Multi-view database (table/kanban/gallery) |
| \`/ai/insights\` | AI | AI Insights dashboard (2nd-level nav) |
| \`/ai/insights/:tab\` | AI | AI Insights with tab (timeline/edges/glossary/economy) |

Map is a first-class document type (`type: 'note' | 'map' | 'drawing'`). Maps exist in the document tree alongside notes and can be embedded in any doc via the `/map` slash command.

## Three-Zone Layout

```
┌──────────────────────────────────────────────────┐
│ Left Sidebar   │   Main Content    │ Right Panel  │
│ (260-72px)     │   (flex-1)        │ (380px)      │
├────────────────┴────────────────────┴──────────────┤
│ StatusBar                                          │
└──────────────────────────────────────────────────────┘
```

### Zones

| Zone | Default Width | Content | Toggle |
|------|--------------|---------|--------|
| **Left Sidebar** | 260px (collapsed: 72px) | Search icon, tag tree, graph nav, today view, chat icon | Cmd+B |
| **Main Content** | flex-1 | Route-dependent page content | — |
| **Right Panel** | 380px | Properties, backlinks, doc context graph, doc hierarchy tree, similar notes, chat | Cmd+. |
| **StatusBar** | full width | Connection status, sync indicator, save status | Always visible |

### Responsive Behavior

- **Mobile** (< 768px): Both side panels become slide-over drawers. Main content takes full width.
- **Tablet** (768-1024px): Left sidebar collapses by default. Right panel becomes a drawer.
- **Desktop** (> 1024px): Three-zone layout as shown above.

## Component Tree

### Layout

| Component | Description |
|-----------|-------------|
| `AppShell` | Top-level layout wrapper. Manages panel states, keyboard shortcuts |
| `Sidebar` | Left navigation panel. Collapsible to icon-only mode |
| `MainPanel` | Content area wrapper. Renders the active route page |
| \`RightPanel\` | Contextual right panel with tabs: Properties, Backlinks, Doc Graph, Doc Tree, Similar Notes, Shadow. Content changes based on active note/route |
| `StatusBar` | Bottom bar with connection indicator, sync status, save indicator |

### Editor

| Component | Description |
|-----------|-------------|
| `EditorShell` | Editor container with metadata header and related-notes footer |
| `RichToolbar` | Multi-row floating toolbar. Row 1: font, size, color, alignment. Row 2: bold, italic, underline, strikethrough, code, link, clear formatting. Row 3: heading, list, table, image, embed, insert. Context-sensitive — shows relevant controls for current selection |
| `Editor` | TipTap editor instance. Markdown shortcuts, slash commands, drag-and-drop blocks |
| `TagBar` | Inline tag display + add/remove. Suggestion pill area |
| `MetadataPanel` | Created/updated timestamps, word count, version indicator |
| `FontSelector` | Dropdown list of available fonts (Times New Roman, Arial, Inter, Courier New, etc.) |
| `FontSizeDropdown` | Font size selector (8-72pt, with standard presets: 11, 12, 13, 14, 16, 18, 20, 24, 30) |
| `TextColorPicker` | Text color and highlight/background color picker. Preset palette + custom hex input |
| `AlignmentBar` | Paragraph alignment controls: left, center, right, justify. Applies to current paragraph or selection |
| `LineSpacingSelector` | Line spacing presets (1.0, 1.15, 1.5, 2.0, 2.5) with custom value input |
| `TableEditor` | Insert table (grid selector), add/remove rows and columns, merge/split cells, border style/color, cell background |
| `ImageEmbed` | Image upload (paste/drag/file picker), resize handles, alignment (inline/left/center/right), caption below |
| `PageLayoutPanel` | Dialog for page size (A4/Letter/Legal), margins (top/bottom/left/right), orientation (portrait/landscape) |
| `HeaderFooterEditor` | Per-section header and footer editor. Auto page number field, section title variable |
| `SectionBreakControl` | Insert/remove section breaks. New section inherits previous page layout, can override independently |
| `FillInBlankTool` | Insert placeholder dot-leader blanks (.....) for worksheets/forms. Configurable dot count and color |
| `MultiColumnControl` | Split content into 2/3 columns with configurable gap and optional divider line |
| `FootnoteEditor` | Insert footnote reference at cursor position, edit footnote text at bottom of page. Auto-numbering |
| `MapEmbed` | TipTap inline node extension. Inserts a map embed block (`/map` slash command). Props: mapId, view (mindmap/tree/node/force/drawing), interactive boolean, height |
| `MapEmbedToolbar` | Controls inside the embed: toggle interactive mode, expand to full-screen, change view type, refresh auto-layout |
| `ExternalImageEmbed` | TipTap node extension for embedding images by URL. Paste an image URL (e.g., tg-bridge `/tg/{id}?token=...`) → renders inline `<img>` with loading state, error fallback (broken link icon), resize handles, alignment options, caption. Export: fetches source bytes and embeds base64 inline. |

### Search

| Component | Description |
|-----------|-------------|
| `SearchOverlay` | Cmd+K modal overlay with backdrop |
| `SearchInput` | Text input with @tag autocomplete, mode tabs |
| `ResultCard` | Individual result: title, snippet, similarity bar, tags |
| `ResultGroup` | Grouped results (e.g., "Results in #tag") |
| `FilterBar` | Mode tabs (Best match / Text / Semantic), tag scoping |

### Canvas

| Component | Description |
|-----------|-------------|
| `GraphCanvas` | D3 force-directed graph container (SVG). Uses ForceGraphView internally. Renders edges with variable thickness/opacity/dash based on connection strength. Nodes scaled by prominence score |
| `NoteNode` | Rendered note circle/rectangle. Size varies by connection prominence (0.6× to 1.4× base). Border width by degree. Opacity and saturation by connectedness. Click/hover handlers |
| `EdgeLine` | SVG line/path for links. Thickness 1-8px by strength, opacity 0.1-1.0, dash pattern (dashed→dotted→solid) |
| `CanvasControls` | Zoom in/out, fit, reset, tag filter dropdown, strength sensitivity slider |
| `NodePopover` | Hover preview card: title, tags, first-line content, connection strength score |
| `CanvasToolbar` | Switch between canvas types (force graph / mind map / tree / node editor) via dropdown. "Weighted" toggle to enable/disable strength encoding |

### Connection Strength

Components for computing and visualizing connection strength across all graph types.

| Component | Description |
|-----------|-------------|
| `ConnectionStrengthEngine` | Core computation engine. Takes a graph's nodes and edges, computes pairwise strength using configured factors (links, tags, embedding, reciprocity, recency, common refs). Returns per-edge strength (0.0-1.0) and per-node prominence (0.0-1.0). Caches results, re-computes on relevant changes |
| `StrengthSlider` | Sensitivity slider (0-100%). Mounts in graph toolbar. At 0%: uniform rendering. At 100%: max differentiation. Default 70%. Changes trigger immediate visual update |
| `StrengthLegend` | Small overlay box in graph corner showing the visual mapping: thin→thick edge sample, small→large node sample, opacity gradient, with "Weak ← → Strong" labels |
| `FactorToggleGroup` | Row of toggle chips: Links, Tags, Embedding, Reciprocity, Recency, Common Refs. Enable/disable individual factors. Changes trigger re-computation |
| `StrengthWeightedToggle` | Binary toggle: "Weighted" / "Uniform". When off, all edges = 2px solid, all nodes = base size. Quick way to compare weighted vs unweighted view |
| `StrengthDebugOverlay` | Optional debug panel (keyboard shortcut Cmd+Shift+W) showing per-edge strength breakdown: which factors contributed, what weights, final score. For power users and tuning |
| `StrengthThresholdSlider` | Dual-range slider (min 0-100%, max 0-100%) in graph toolbar. Edges below min threshold are hidden. Edges above max threshold highlighted with glow. Default: min=0%, max=100% (all visible). Re-renders graph on change without re-computing strength |
| `HideWeakToggle` | One-click toggle button to hide edges with strength < 0.3. Visual indicator in Strength Legend ("Weak connections hidden" badge). Works in conjunction with threshold slider |
| `EdgeStrengthTooltip` | Hover tooltip on any graph edge. Shows: overall strength as circular progress bar (0.00-1.00), per-factor breakdown bar chart (links/tags/embedding/reciprocity/recency/commonRefs) with contribution values, top contributing factor highlighted with star icon. Click to pin tooltip persistent. Works on all graph types via ConnectionStrengthEngine |
| `StrengthAwareLayout` | Adapter mapping connection strength (0.0-1.0) to ELK edge weight (1-100). Passes `elk.edgeWeight` into ELKLayoutEngine. Strongly connected nodes positioned closer. When Uniform mode or sensitivity = 0%, all edges get weight = 10 (default ELK weight) |
| `StrengthBadge` | Small inline badge showing connection strength (0.00-1.00). Used in Similar Notes list items, search results, Doc Context Graph nodes. Color-coded: green (> 0.7), yellow (0.3-0.7), red (< 0.3) |

### Chat

| Component | Description |
|-----------|-------------|
| `ChatPanel` | Resizable chat overlay container |
| `MessageBubble` | Individual message (user or AI) with copy/share/pin |
| `StreamingContent` | Typewriter rendering of streaming response |
| `CitationCard` | Expandable citation: title, snippet, tags, relevance bar, open/link |
| `ScopeSelector` | Dropdown for tag scope with multi-select |

### Wiki

| Component | Description |
|-----------|-------------|
| `WikiArticle` | Full wiki article page with gradient border |
| `SectionBlock` | Editable section with drag handle and AI/modified badge |
| `CitationPopover` | Hover popover for inline `[N]` citations |
| `TableOfContents` | Auto-generated TOC sidebar with scroll tracking |

### Briefing

| Component | Description |
|-----------|-------------|
| `BriefingWidget` | Dashboard compact briefing card |
| `BriefCard` | Full briefing section container (icon + content) |
| `GraphSnapshot` | Mini static force graph for the briefing |
| `StaleNoteCard` | Stale note suggestion card with last-seen date |

### Doc Context Graph

| Component | Description |
|-----------|-------------|
| `DocContextGraph` | Mini interactive force-directed graph in the right panel. Shows current note at center + 1-2 hop connections (backlinks, forward links, same-tag, similar) |
| `ContextGraphNode` | Node in the doc context graph. Click to navigate, hover for preview, color-coded by tag |
| `ContextGraphEdge` | Edge in the doc context graph. Different stroke styles per connection type (backlink/same-tag/similar). Thickness by relevance, strongest connections (strength > 0.7) get highlight glow animation, weakest (strength < 0.2) rendered faded |
| `ContextGraphControls` | Filter toggles (backlinks/forward/same-tag/similar), connection depth slider (1/2 hops), "Open in Canvas" button |
| `ContextGraphPopover` | Hover popover showing note title, first-line preview, tags, similarity score |

### Doc Hierarchy Tree

| Component | Description |
|-----------|-------------|
| `DocHierarchyTree` | Interactive tree view in the right panel showing the current note's position in the doc hierarchy |
| `TreeBranch` | Expandable/collapsible branch. Shows parent, siblings, and children of current note |
| `TreeNode` | Individual tree node. Click to navigate. Icon by doc type (note/map/drawing). Drag handle for re-parenting |
| \`HierarchyBreadcrumb\` | Optional text breadcrumb alternative: "Parent Doc > Grandparent > Current Note" |

### Doc Graph View

| Component | Description |
|-----------|-------------|
| `DocGraphViewToggle` | Top toolbar toggle button: Page / Graph. When active, replaces the doc's Page view with a generated directed graph. Shows current mode label (Page/Graph). |
| `DocGraphRenderer` | Reads the current doc's child hierarchy via parent_id and renders it as a directed graph. Root = current doc, level-1 nodes = immediate children, expandable to arbitrary depth. Delegates to ForceGraphView or MindMapView for rendering. Graph is in-memory only (not persisted). |
| `HierarchyGraphNode` | Graph node representing a doc in the hierarchy. Shows title, doc-type icon, metadata line. Has expand/collapse toggle if the node has children. Click → navigate to that doc's Page view. |
| `HierarchyGraphEdge` | Directed edge from parent doc → child doc with arrow marking. Tooltip on hover: "Parent → Child" with source and target doc titles. |
| `DocGraphControls` | Controls in Graph mode: depth limit slider (1–5 levels), "Expand All" / "Collapse All" buttons, "Open as map document" action (persists the current graph as a real map doc), zoom controls. |

### AI Shadow & Insights

| Component | Description |
|-----------|-------------|
| \`ShadowTab\` | Right Panel tab. Shows summary, key points, entities, tags, confidence bar, thumbs up/down feedback for active doc's shadow data |
| \`ShadowStatusBadge\` | Inline badge: pending (gray), generating (yellow spin), ready (green), failed (red) |
| \`ShadowKeyPoints\` | Bullet list of key_points from shadow doc, clickable → navigate to section |
| \`ShadowEntities\` | Entity chips: Person, Concept, Tool, Location — click to search docs |
| \`ShadowFeedback\` | Thumbs up/down + text input. Submits to shadow_interactions table. "Regenerate" button |
| \`InsightsLayout\` | \`/ai/insights\` page shell. 2-column: left nav tabs, right content area |
| \`InsightsTimeline\` | Recent AI activity timeline: auto-summarizations, edge inferences, glossary extractions, temporal detections. Filterable by layer (1-5) |
| \`InsightsEdges\` | Inferred relation edges table: source → relation → target, confidence % , evidence snippet, "Confirm" / "Reject" buttons. Paginated, filter by confirmed/rejected/pending |
| \`InsightsGlossary\` | Glossary term viewer: term → definition, aliases, source docs, context sentences. Search, alphabet nav |
| \`InsightsTemporalTimeline\` | Semantic changelog: doc → change type (created/expanded/restructured/trimmed), summary, impact, token_delta. Color-coded, expandable |
| \`InsightsTokenEconomy\` | Token budget chart: per-layer token usage vs cap, estimated monthly cost, efficiency ratio (shadow tokens / raw tokens) |
| \`GraphInferredToggle\` | Checkbox in Doc Context Graph toolbar: "Show AI-inferred edges". When on, renders dashed colored edges (green=prerequisite, blue=references, orange=similar, red=contradicts) with tooltip showing confidence |
| \`GraphGhostNodeToggle\` | Checkbox: "Show ghost nodes" — docs referenced by AI but not yet in user's workspace. Rendered as dashed outline + "(ghost)" label |
| \`InsightsSettings\` | Settings panel under /settings → AI: enable/disable each layer (1-5), set cron interval for auto-generation, token budget per layer |

### Maps

| Component | Description |
|-----------|-------------|
| `MapRenderer` | Universal map renderer that detects type and delegates to the correct view (mindmap/tree/node/force) |
| `MindMapView` | Radial mind map layout using ELK `radial` algorithm. Root-centered branching hierarchy |
| `TreeMapView` | Vertical hierarchy with ELK `layered` + ORTHOGONAL edge routing (PCB-style 90° lines, no overlap) |
| `NodeMapEditor` | Full interactive graph editor built on React Flow (@xyflow/react). Drag-drop nodes, connect handles, style per-node/edge. Doc-link nodes support optional blockId field for heading-level linking |
| `ForceGraphView` | D3 force-directed graph (existing Spatial Canvas / GraphCanvas) |
| `DrawingCanvas` | Excalidraw whiteboard embed. Shapes, freehand, text, arrows |
| `MapToolbar` | Toolbar: auto-layout selector (force/radial/layered/mrtree), zoom controls, fit-to-screen, export PNG |
| `ELKLayoutEngine` | Abstraction layer for Eclipse Layout Kernel algorithms. Receives JSON Canvas, returns layouted JSON with xywh positions |
| `MapNode` | Base React Flow node component. Variants: text, doc-link (click opens note, supports `docId#blockId` hash for section-level deep linking), group/frame, image. Doc-link nodes auto-resolve live title/description from linked doc on load; stale labels overwritten by live data via `DocLinkResolver` |
| `MapEdge` | Base React Flow edge component. Supports arrows, labels, stroke style/width, orthogonal routing |
| `DocLinkResolver` | Batch resolver: on map mount, scans all nodes with `type: "file"`, collects unique docIds, runs `SELECT id, title, excerpt FROM docs WHERE id IN (?)`, populates live labels. Handles blockId resolution for heading-level links. Falls back to "(đã xoá)" for deleted docs. Caches results to avoid re-query on re-render; invalidated on SSE event |
| `DocLinkSyncProvider` | Context provider that subscribes to SSE `doc:renamed` events. When a linked doc is renamed, pushes update to all active MapRenderer instances — nodes update in real-time without page reload |
| `AutoLayoutButton` | One-click auto-layout button. Builds graph from current JSON Canvas, runs ELK, applies positions |
| `NodeStylePanel` | Right-click panel for styling: color, font size, border, icon/emoji for selected node |
| `EdgeStylePanel` | Right-click panel for styling: arrow type, label, color, stroke width for selected edge |
| `MapExport` | Export as JSON Canvas (.canvas file), PNG, SVG |

### Drill-Down Graph

Components that enable hierarchical zoom and navigation across all graph types (maps, canvases, context graphs). Every graph node can contain a sub-graph; clicking drills into it, breadcrumb navigates back.

| Component | Description |
|-----------|-------------|
| `DrillGraphContainer` | Wraps any graph view (force/mindmap/tree/node/drawing) with hierarchy navigation. Manages a stack of graph levels, current depth, zoom transitions between levels. Delegates rendering to the appropriate view component |
| `GraphBreadcrumb` | Persistent breadcrumb bar: "Root Graph › Chapter 1 › Section 1.1". Each segment clickable to jump to that level. Shows depth indicator: "3 / 5 levels deep". Truncates long paths with ellipsis |
| `GraphBackButton` | Floating "← Back" button (top-left corner of graph). Also responds to Escape key to pop one level, `[` key for back, `]` key for forward through history |
| `SubGraphPreview` | Hover popover triggered on nodes with a `subGraphId`. Shows mini preview of the sub-graph's first-level children: node count badge, top-3 child labels, tag summary |
| `PresentationController` | Full-screen presentation overlay. Auto-advance timer (configurable speed), play/pause, next/previous level. Exits on Escape. Shows depth indicator and breadcrumb. Fits each level to viewport on transition |
| `CompactExpandedToggle` | Toggle button pair: Compact (title-only nodes, thin edges, higher density) vs Expanded (full labels, thick edges, images/icons, more spacing). Auto-toggles based on zoom level; user can override |
| `AutoExpandController` | Internal controller that monitors zoom level and viewport changes. When zooming in, expands child nodes and triggers ELK re-layout to fill space. When zooming out past threshold, collapses branches into aggregate summary nodes |
| `GraphHistoryStack` | Manages the push/pop navigation stack. Maintains traversal history so user can go back/forward. Integrates with browser history via URL hash updates |

| `SubGraphSuggester` | Detects natural clusters in the connection strength matrix. Finds node sets with high internal strength (> 0.6) and low external strength (< 0.2). Surfaces "Suggested cluster" badges in toolbar. User actions: Accept (creates sub-graph), Dismiss, Adjust radius |
| `SubGraphFromSelection` | Context menu action: select N nodes → right-click → "Create sub-graph". Moves selected nodes into a new sub-graph map, creates parent node with subGraphId. Also handles Promote (move children up) and Demote (wrap into deeper sub-graph) |
| `AggregateProminenceEngine` | When branches auto-collapse into aggregate nodes, computes the aggregate's prominence as a weighted sum of its children's prominences. Ensures collapsed clusters of highly-connected nodes appear more prominent than isolated collapsed nodes |
### Template System

| Component | Description |
|-----------|-------------|
| `TemplateLibrary` | Browser/grid view of all saved templates. Search, filter by category, preview thumbnail |
| `TemplateCreator` | Save current doc as template. Select sections to include, define `{{variable}}` placeholders, set category and cover page |
| `TemplateApplier` | Apply template to new doc. Variable substitution dialog — user fills in `{{title}}`, `{{author}}`, etc. Sections cloned from template |
| `TemplateSection` | Named reusable section within a template (e.g., "Mục đích – Yêu cầu", "Nội dung thực hành"). Can be reordered during apply |
| `TemplateCoverPage` | Cover page editor within templates. Logo placeholder, title/subtitle/author fields, background color, alignment presets |
| `TemplateVariableTag` | Inline `{{variable}}` tag in the editor. Insert/remove via slash command or toolbar. Highlighted distinct color |
| `TemplateInheritanceTree` | Template hierarchy: base template → derived template with overrides. Child inherits all sections, can override specific ones |
| `TemplateStorage` | SQLite `templates` table. JSON serialization of block structure. Template-to-doc relationship for "derived from" tracking |

### Export & Publishing

| Component | Description |
|-----------|-------------|
| `ExportDialog` | Main export dialog. Select format (PDF/DOCX), page settings, template binding, scope (single document / group) |
| `ExportPDF` | PDF generation via Puppeteer. Renders note/page to A4 with headers/footers, page numbers, optional TOC |
| `ExportDOCX` | DOCX generation via docx.js. Maps TipTap JSON to OOXML. Preserves fonts, colors, tables, images, alignment |
| `ExportGroupDialog` | Group/batch export. Select multiple notes from tree, choose order, combine into single PDF/DOCX with per-section headers |
| `ExportSettingsPanel` | Per-export settings: page size (A4/Letter), margins, orientation, font mapping (editor font → DOCX font), header/footer link |
| `ExportPipeline` | Composable pipeline: FetchBlocks → TransformPage → ApplyTemplate → RenderFormat → WriteFile. Each step swappable |
| `BatchExportProgress` | Batch export progress indicator. Per-file status (pending/processing/done/error), cancel button, summary on completion |

### Common / UI

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost, icon variants |
| `Input` | Text input with icon, label, error state |
| `Modal` | Generic modal with title, body, footer |
| `Toast` | Notification toast (success, warning, error, undo) |
| `Popover` | Hover/click popover for previews and menus |
| `ResizablePanel` | Drag-handle resizable panel wrapper |

### Section Deep Linking

Mind map nodes, doc-link nodes, and block references can point to a specific heading within a document, not just the document itself.

**Data model** — JSON Canvas node extension:
```json
{
  "id": "node-uuid",
  "type": "file",
  "file": "doc-uuid-123",
  "blockId": "heading-block-uuid",
  "blockType": "heading",
  "label": "Điện trở",
  "x": 100,
  "y": 200
}
```

**Navigation flow**:
1. User clicks a mind-map node → router navigates to `/notes/:docId#blockId`
2. NoteDetail page reads `#blockId` from URL hash
3. Editor scrolls to the target heading block and highlights it briefly
4. If the block is collapsed or off-screen, it expands and centers

**Auto mind map from heading structure** (triggers):
- Via `/mindmap` slash command → "Generate from current doc structure"
- Via AI prompt → LLM returns JSON Canvas with per-section nodes
- Via template instantiation — giáo trình chapters auto-generate mind map nodes for each H2 section

**Cross-doc linking**:
- When editing a mind map node, user can search headings across all docs (type `#section-name`)
- The doc-link picker shows two-step: select doc → select heading within doc
- The heading preview shows breadcrumb path: "Chương 1 > Điện trở"
- Stored as `{ docId, blockId, label }` in the JSON Canvas node data

### Doc Link Auto-Sync

Map nodes that link to a document (`type: "file"`) automatically keep their label, description, and heading reference in sync with the source doc.

**Data model** — JSON Canvas node storage:
```json
{
  "id": "node-uuid",
  "type": "file",
  "file": "doc-uuid-123",
  "blockId": "heading-block-uuid",
  "label": "{{resolved}}",
  "description": "{{resolved}}"
}
```
The `label` and `description` fields are populated on map load (not cached statically). On every map open, `DocLinkResolver` runs a batch query and overwrites stale values with live data.

**Sync triggers**:
| Trigger | Mechanism | Latency |
|---------|-----------|---------|
| Map opens | `DocLinkResolver` batch query | On mount |
| Doc renamed | SSE `doc:renamed` → `DocLinkSyncProvider` → re-resolve affected nodes | Real-time |
| Doc deleted | SSE `doc:deleted` → gray out node, show "(đã xoá)" | Real-time |
| Block heading changed | SSE `doc:heading_changed` → re-resolve blockId label | Real-time |
| Manual refresh | User clicks "Refresh links" in MapToolbar | On demand |

**Cross-doc heading resolution**:
- When a node has `blockId`, `DocLinkResolver` queries the blocks table: `SELECT text FROM blocks WHERE id = ?`
- The result overwrites the node's `label` heading title
- If the heading no longer exists, falls back to doc title + "(heading not found)"

**Deleted doc handling**:
- If the linked doc is permanently deleted (not just trashed), the node turns gray with strikethrough label
- If the doc is in trash (soft-delete), the node shows a yellow warning icon + "(in trash)" suffix
- In both cases, the node remains clickable — clicking prompts "This document has been deleted"

### Drill-Down Architecture

The drill-down system is a cross-cutting layer that enhances all graph types — force, mind map, tree, node editor, and context graph.

**Data flow**:
1. Each JSON Canvas node can have `subGraphId: string | null` — pointing to another map document or a sub-section
2. When user clicks a node with `subGraphId`, `DrillGraphContainer` pushes the current state onto `GraphHistoryStack`
3. Viewport animates: zoom out → center on target → zoom in (using React Flow viewport transitions or D3.zoom)
4. Sub-graph data loads lazily (API call if not cached) and renders with the same graph view component
5. ELK re-layouts the sub-graph to fit the viewport — each level gets its own independent layout

**Zoom levels and auto behavior**:
| Zoom level | Auto behavior |
|------------|---------------|
| > 200% (very zoomed in) | Expanded mode: full node content, thick edges, images. Pan enabled |
| 100-200% (normal) | Mixed mode: labels visible, normal edges |
| 50-100% (zoomed out) | Compact mode: title-only, thin edges, higher density |
| < 50% (far out) | Auto-collapse: branches become aggregate nodes with child count badges |

**Keyboard shortcuts**:
| Shortcut | Action |
|----------|--------|
| `[` | Navigate back one level in drill history |
| `]` | Navigate forward one level in drill history |
| `Escape` | Exit sub-graph / close presentation mode |
| `Cmd+Shift+D` | Toggle drill-down breadcrumb visibility |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Search overlay |
| `Cmd+N` | Quick note (new) |
| `Cmd+B` | Toggle sidebar |
| `Cmd+.` | Toggle right panel |
| `Cmd+Shift+C` | Open/focus chat panel |
| `Cmd+S` | Save current note |
| `Cmd+Enter` | Send chat message / save note |
| `Esc` | Close overlay / cancel |
| `Shift+Enter` | Newline in input (chat) |
| `Arrow Up/Down` | Navigate search results |
| `Enter` | Open selected result |
| `Cmd+G` | Open graph/canvas view |
| `Cmd+M` | Insert map embed in editor |
| `Cmd+Shift+M` | Open full map editor (/maps/new) |
| `Cmd+Shift+G` | Toggle Doc Context Graph in right panel |
| `Cmd+Shift+T` | Toggle Doc Hierarchy Tree in right panel |
| `Cmd+T` | Insert table |
| `Cmd+Shift+E` | Open export dialog |
| `Cmd+Shift+F` | Focus font selector |
| `Cmd+Shift+P` | Open page layout panel |
| `Cmd+Shift+L` | Toggle line spacing selector |
| `Cmd+Alt+L` | Align left |
| `Cmd+Alt+C` | Align center |
| `Cmd+Alt+R` | Align right |
| `Cmd+Alt+J` | Align justify |
| `Cmd+Shift+1` | Heading 1 |
| `Cmd+Shift+2` | Heading 2 |
| `Cmd+Shift+3` | Heading 3 |
| \`Cmd+Shift+S\` | Search/create section deep link for selected node |
| \`Cmd+Shift+I\` | Open AI Insights (\`/ai/insights\`) |
| \`Cmd+Shift+ \` | Toggle Shadow tab in Right Panel |
| \`Cmd+Shift+W\` | Toggle connection strength debug overlay |
| \`H\` (when edge hovered) | Pin edge strength tooltip persistent |
| \`Esc\` (when tooltip pinned) | Dismiss pinned edge tooltip |
| `[` | Navigate back one level in drill history |
| `]` | Navigate forward one level in drill history |
| \`Cmd+Shift+D\` | Toggle drill-down breadcrumb visibility |

All shortcuts are configurable in Settings → Keyboard Shortcuts.

## New Feature Components

### Task Management (#37) — Kanban

| Component | Role |
|-----------|------|
| `KanbanBoard` | Full kanban board view: columns as vertical lanes, cards as draggable items. Drag-and-drop between columns with optimistic UI updates. Real-time SSE sync for multi-user/agent changes. |
| `KanbanColumn` | Single column with header (title, card count), card list, scrollable. Drop zone for moved cards. Collapse/expand. |
| `KanbanCard` | Card preview showing title, tags (colored badges), priority icon, due date, assignee avatar, subtask count, dependency indicator. Click to open detail. |
| `CardDetail` | Full card detail panel (slide-over or modal). Fields: title, description (rich text), assignee, due date, priority, status, column. Subtask tree (expandable). Dependencies list. Comments section with thread. Activity log. Link to docs. |
| `SubtaskTree` | Hierarchical tree of child cards. Expand/collapse per node. Drag to re-order. Quick-add subtask button. AI-suggested subtasks banner (via LLM). |
| `DependencyGraph` | Visual graph showing blocks/blocked_by relationships between cards. Arrows from blocker to blocked. Click node opens card detail. Cycle detection warning. |
| `BoardDashboard` | Board list grid showing all boards: name, type icon (task/trip), card counts per column, last activity timestamp. Click to open board. Create new board button. |
| `BoardSearch` | Full-text search overlay for cards across all boards. Filters: board, column, tag, assignee, date range, status. Results displayed as compact card list with context. |
| `TagFilter` | Tag filter bar for current board. Multi-select tags. Shows only cards matching selected tags. Tag auto-suggest from existing tags. |
| `KanbanMap` | Map view of geo-tagged cards using maplibre-gl (reusing existing kanban frontend component). Cards with lat/lng shown as markers. Click opens card detail. |
| `KanbanMindMap` | Mind map view of cards organized by parent-child relationships. Root = board, children = cards, grandchildren = sub-tasks. |
| `DocTaskLinker` | Sidebar widget linking current doc to kanban cards. Search and attach cards. Shows linked cards with status badges. Click opens card detail or kanban board. |
| `TaskSyncToggle` | Per-doc toggle: sync GFM checkboxes in doc ↔ kanban cards bidirectionally. Off by default. Sync status indicator in toolbar. |
| `LLMSuggestBar` | Auto-loading suggestion bar: appears 1.5s after mount with animated spinner. Shows action buttons colored by type (🏷️ categorize, ➕ create_card, ➡️ move_card, 🔖 add_tags, 💡 review). Each action executes independently with per-button loading state and toast feedback. Dismiss to hide. SSE board-changed refresh. |
| `TripSuggestPanel` | Trip-specific suggestion panel for boards of type=trip. Auto-refresh every 2 minutes. Shows AI-suggested places/activities as cards with priority badge, category tag, city, rating, estimated time. "Add" button creates card in backlog column with full metadata (lat/lng, address, category, reason). |

### Daily Notes (#38)

| Component | Role |
|-----------|------|
| `CalendarWidget` | Sidebar calendar component. Shows date with indicators: dot (has note), ring (has tasks due). Click to open/create daily note. Click arrows to navigate months. |
| `DailyNoteRenderer` | Auto-creates daily note from template on first open. Shows metadata: date, weekday, week number, tasks due today. |
| `PeriodicNoteTemplate` | Weekly/monthly/quarterly/yearly templates with auto-creation schedule. Template variables: {{date}}, {{week}}, {{month}}, {{year}}, {{tasks_due}}, {{tasks_overdue}}. |

### Custom Properties (#39) & Query Language (#40)

| Component | Role |
|-----------|------|
| `PropertyPanel` | Sidebar panel for viewing/editing doc properties. Inline add/edit/remove. Type-aware inputs (date picker, select dropdown, color picker). |
| `PropertySchemaManager` | Defines property types, validation rules, defaults. Stores schema in a system doc. CRUD for property definitions. |
| `FrontmatterEditor` | Raw YAML editor with syntax highlighting. Mirrors the visual PropertyPanel — changes in one reflect in the other. |
| `QueryEditor` | Syntax-highlighted code editor for Note Query Language. Autocomplete for property names, tags, operators. Error highlighting for invalid queries. |
| `QueryResultsTable` | Table view of query results. Sortable columns, resizable, paginated. Export to CSV. |
| `InlineQueryBlock` | TipTap node extension. Embeds a live query in any doc. Auto-refreshes when source data changes. Configurable output format (table/list/kanban). |
| `QueryAutocompleteProvider` | Provides autocomplete suggestions for QueryEditor: property names from schema, tag names, function names, date keywords (today, yesterday, this_week). |

### Outliner Mode (#41)

| Component | Role |
|-----------|------|
| `OutlinerExtension` | TipTap extension implementing outliner behavior: Tab/Shift+Tab for indent/outdent, Enter for new block, Backspace for merge, drag handle for reorder. |
| `OutlinerToggle` | Toolbar toggle or doc-level setting to switch between paragraph and outliner mode. |
| `BlockHandle` | Drag handle + collapse/expand arrow. Appears on hover in outliner mode. Shows child count when collapsed. |
| `BlockReference` | `((block-id))` parser extension. Renders as clickable chip with content preview tooltip. |
| `BlockEmbed` | `!((block-id))` parser extension. Embeds block content inline (live synced — updates when source changes). |

### Quick Capture (#42)

| Component | Role |
|-----------|------|
| `CaptureDialog` | Modal dialog opened by global hotkey. Input field for text/URL. File picker and voice button for attachments. Destination selector. |
| `QuickCaptureExtension` | Registers global hotkey (`Cmd+Shift+J`). Detects clipboard content. Routes captured content to configured destination with optional template + auto-tagging. CLI IPC listener for `knot capture` command. |

### Focus Mode (#43)

| Component | Role |
|-----------|------|
| `FocusModeToggle` | Toolbar/toggle that activates full-screen editor. Hides all panels, sidebars, and non-essential UI. |
| `TypewriterScroll` | ProseMirror scroll plugin. Keeps cursor at configurable vertical position (top/center/bottom of viewport). Smooth scroll. |
| `DimmedLinesPlugin` | ProseMirror decoration plugin. Dims all lines except the active paragraph. Configurable dim opacity. |

### Readwise Import (#44)

| Component | Role |
|-----------|------|
| `ReadwiseAuth` | OAuth flow for Readwise Reader. Token management. Connection status indicator. |
| `ImportWizard` | Step-by-step wizard: select source → choose items → map to templates → confirm. Shows preview of imported content before committing. |
| `HighlightImporter` | Fetches highlights from Readwise API. Creates docs from templates. Appends highlights as blockquotes with source backlinks. |

### Voice Notes (#45)

| Component | Role |
|-----------|------|
| `VoiceRecorder` | Inline audio recorder with waveform visualization. Start/stop/pause controls. Timer display. |
| `AudioBlock` | TipTap node extension. Inline audio player with playback controls, speed selector, waveform. Stores blob reference. |
| `TranscriptionEngine` | Sends audio to Whisper (configurable: local model or API). Appends transcript as editable text below audio player. Language auto-detection. |

### Git Backup (#46)

| Component | Role |
|-----------|------|
| `GitAutoBackup` | Background service that monitors doc changes and triggers commits. Configurable interval (on save, hourly, daily). Manages commit message template. |
| `GitStatusIndicator` | Sidebar status dot: green (synced), yellow (pending), red (conflict/uncommitted). Click for details panel. |
| `GitSettingsPanel` | Settings UI: enable/disable, commit interval, remote URL, branch name, .gitignore patterns, force push option. |
