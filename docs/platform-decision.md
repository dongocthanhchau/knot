# Platform Decision

## Platform Evaluation

| Criteria | Web (PWA) | Desktop (Tauri) | Desktop (Electron) |
|----------|-----------|-----------------|-------------------|
| Background tasks | ❌ Limited SW wake | ✅ Cron/tray | ✅ |
| Vector DB >50K | ❌ OPFS slow | ✅ Native SQLite | ✅ |
| Data durability | ⚠️ Can clear browser | ✅ Local files | ✅ |
| Binary size | ✅ 0MB | ✅ ~10MB | ❌ 150MB+ |
| Install friction | ✅ None | ⚠️ Required | ⚠️ Required |

**Decision**: Next.js (Web App + PWA) — the user chose web. For local-first, we use SQLite via better-sqlite3 on the server + IndexedDB/OPFS as a client cache. Can wrap with Tauri later for desktop.

## Architecture Diagram

```
Browser ←→ Next.js API Routes
              ↓
         Service Layer (AtomService, TagService, ChatService, etc.)
              ↓
         SQLite (better-sqlite3 + sqlite-vec)
```

External: Ollama/OpenRouter/OpenAI for embeddings + LLM.

## Key Architecture Decisions

### 1. Monolith
Next.js handles both frontend and backend — simpler for single-user. No need for a separate API server or microservices. API routes co-located with pages, shared types between client and server.

### 2. SQLite + sqlite-vec
Local vector search without external vector DB. sqlite-vec provides FTS5 for BM25 full-text search and vector cosine similarity in the same database. No need for Pinecone, Qdrant, or pgvector.

### 3. Hybrid Search
BM25 (FTS5) + dense (vector) with Reciprocal Rank Fusion (RRF):
```
score = 1/(k + rank_dense) + 1/(k + rank_sparse)
```
This combines keyword precision with semantic understanding. The RRF formula naturally handles the case where a result ranks high in one method but low in the other.

### 4. SSE Streaming
Server-Sent Events for chat — simpler than WebSocket for this use case. Chat is the only streaming feature. SSE is unidirectional (server → client), which is all we need. No need for a WebSocket server or reconnection logic beyond native EventSource.

### 5. No Real-Time Sync
Phase 1 is local-only. The entire SQLite database lives on the user's machine. No multi-device sync, no collaboration, no conflict resolution. Turso/libsql can be added later for optional sync across devices.

### 6. Export Pipeline
Export is a composable pipeline: `FetchBlocks → TransformPage → ApplyTemplate → RenderFormat → WriteFile`.

- **PDF**: Puppeteer renders the note/page to A4 via headless Chromium. Supports headers/footers, page numbers, table of contents, and per-section headers via CSS print media.
- **DOCX**: docx.js maps TipTap JSON to OOXML (Office Open XML). Preserves fonts, colors, tables, images, alignment, and page layout.
- **Batch export**: Multiple notes selected from the tree, ordered, combined into a single PDF/DOCX with per-section page headers and continuous page numbering.
- **Template binding**: Before export, the note can be wrapped in a template (cover page + section structure) so the output matches a predefined style guide (e.g., giáo trình format).

### 7. Template Storage
Templates are stored as JSON snapshots of block structure in a dedicated `templates` table. Applying a template clones blocks into a new doc, preserving structure and substituting {{variable}} placeholders. Template-to-doc "derived from" relationships enable update propagation.

### 8. External Image Hosting (tg-bridge)

Use tg-bridge as a self-hosted image CDN for embedding images in Knot docs. Images uploaded to a Telegram channel are served via tg-bridge HTTP endpoints.

**Flow**:
1. Upload image to Telegram via tg-bridge (web UI or `/upload` API)
2. tg-bridge stores the file and returns a message_id
3. Embed in Knot doc: paste `https://<host>/tg/{message_id}?token={static_auth_key}`
4. Knot renders `<img>` tag with the tg-bridge URL
5. Image is displayed inline with loading state, resize handles, caption

**Access control**:
- nginx reverse proxy enforces referer check (`valid_referers`)
- Currently whitelisted: AFFiNE origin (existing integration)
- Future: add Knot origin when ready
- Request without valid referer → 403

**Static auth**: Token `m3d14_a3eb7a6aca` appended as query param `?token=...`

**Upload paths**:
- **tg-bridge web UI**: Browser UI at `<tg-bridge-host>/` — upload and get message_id
- **Knot → tg-bridge API**: Knot calls `POST /upload` on tg-bridge with multipart file → returns file metadata

**Performance**:
- Large files (HEIC, >2MB) take time to download from Telegram — loading spinner during fetch
- File types: all Telegram-supported (JPEG, PNG, HEIC, etc.)
- HEIC may require downstream conversion if the browser doesn't support it

**Export**:
- PDF: fetch image bytes from tg-bridge URL → embed via blob URL (Puppeteer resolves)
- DOCX: fetch image bytes → embed as base64 in OOXML output
- Export always fetches and embeds the image, never the URL

## Database Architecture

### Schema Overview

```
atoms
├── id (TEXT PRIMARY KEY)
├── title (TEXT)
├── content (TEXT)
├── embedding (BLOB - F32 vector)
├── created_at (TEXT - ISO8601)
├── updated_at (TEXT - ISO8601)
├── deleted_at (TEXT - nullable, soft delete)

tags
├── id (TEXT PRIMARY KEY)
├── name (TEXT UNIQUE)
├── parent_id (TEXT - nullable, self-ref FK)
├── color (TEXT)
├── created_at (TEXT)

atom_tags
├── atom_id (TEXT FK)
├── tag_id (TEXT FK)

links
├── id (TEXT PRIMARY KEY)
├── source_atom_id (TEXT FK)
├── target_atom_id (TEXT FK)
├── type (TEXT - 'manual' | 'auto')
├── created_at (TEXT)

fts5_atoms (virtual table)
├── title
├── content
└── MATCH on atoms.id

vec_atoms (virtual table - sqlite-vec)
├── embedding
└── MATCH on atoms.id

templates
├── id (TEXT PRIMARY KEY)
├── name (TEXT)
├── description (TEXT)
├── category (TEXT - 'educational' | 'report' | 'note' | 'custom')
├── cover_page (TEXT - JSON: logo, title, subtitle, author, background color)
├── sections (TEXT - JSON array of section definitions: {name, order, locked})
├── variables (TEXT - JSON array of {{var}} names with labels + defaults)
├── content (TEXT - JSON snapshot of block structure)
├── parent_template_id (TEXT - nullable, FK to templates.id for inheritance)
├── created_at (TEXT)
├── updated_at (TEXT)

template_atoms
├── atom_id (TEXT FK)
├── template_id (TEXT FK)
├── derived_from (TEXT - nullable, snapshot ID of the template version used)
```

atoms now includes `page_layout` and `template_id`:
```
atoms (updated columns)
├── page_layout (TEXT - JSON: page size, margins, orientation, header/footer, columns)
├── template_id (TEXT - nullable, FK to templates.id if derived from a template)
```

Maps now include hierarchical sub-graph support via a JSON Canvas node extension. Each node can carry an optional `subGraphId` field pointing to another map document. Clicking such a node triggers a drill-down zoom transition into that map.

```json
{
  "nodes": [
    {
      "id": "node-uuid",
      "type": "file",
      "file": "doc-uuid",
      "subGraphId": "map-uuid-or-null",
      "subGraphPath": "node-id-1,node-id-2",
      "label": "...",
      "x": 100,
      "y": 200
    }
  ]
}
```

The `subGraphId` targets another map document (`type: 'map'`) in the workspace. Circular references (A→B→A) are allowed but flagged in the UI. The `subGraphPath` optional string provides a pre-deep-link path for URLs like `/maps/:id?path=root,a,b`.

A new top-level property `rootSubGraphIds: string[]` can be stored in the map's JSON Canvas metadata to enable eager pre-fetching of sub-graph previews when the parent map loads.

### Key Queries

**Hybrid search**:
```sql
-- BM25 via FTS5
SELECT rank, atom_id FROM fts5_atoms WHERE fts5_atoms MATCH ? LIMIT 20;

-- Vector cosine similarity via sqlite-vec
SELECT distance, atom_id FROM vec_atoms WHERE embedding MATCH ? LIMIT 20;

-- RRF merge happens in application code
```

## Client-Side Caching

The browser caches data via:
1. **Next.js SWR/React Query** — API response cache (in-memory)
2. **IndexedDB** — Offline note storage for PWA support
3. **Service Worker** — Static asset cache

On first load, the app fetches from the local Next.js server (which reads SQLite). Subsequent navigations use SWR cache. When offline, the service worker serves the last-known-good state from IndexedDB.

## Import Pipeline

DOCX/Markdown import converts external documents into templates via a server-side pipeline:

### Libraries

| Library | Purpose |
|---------|---------|
| **mammoth.js** | DOCX → HTML (content, structure, embedded images). Lightweight, no native dependencies |
| **docx.js** | Low-level DOCX access: styles.xml, numbering.xml, headers/footers, page layout, sections |
| **unified/remark** | Markdown parsing → MDAST tree. Heading hierarchy, tables, lists, code blocks |
| **turndown** | HTML → Markdown (for paste-from-clipboard: browser clipboard HTML → markdown → template) |

### Pipeline Flow

```
Upload / Paste
  → Raw parser (mammoth.js for DOCX, unified for MD, turndown for HTML)
    → Intermediate AST (normalized block tree: headings, paragraphs, tables, images, lists)
      → Structure detector (section boundaries, repeating patterns, cover page)
        → Variable extractor (heuristic + optional LLM for {{var}} suggestions)
          → Template candidate (JSON, validated against Zod schema)
            → Preview in UI → user edits → save as template in DB
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/templates/import` | POST | Upload DOCX/MD file. Returns parsed template candidate as JSON |
| `/api/templates/import/preview` | POST | Apply template candidate to a preview doc (renders TipTap JSON) |
| `/api/templates/validate` | POST | Validate a `.knot-template.json` file against Zod schema before import |

The import pipeline runs server-side in Next.js API routes (no client-side processing needed for DOCX). Paste-from-clipboard runs client-side (turndown in the browser).


## §9 AI Second Knowledge (5 Layers)

A five-layer AI knowledge system that enriches every document with structured summaries, semantic relations, domain glossary, temporal changelog, and pre-computed agent context. Layer 1 (Shadow Doc) generates compact summaries; Layers 2-5 build a second knowledge graph over the workspace.

### Data Model

```sql
CREATE TABLE shadow_docs (
  id        TEXT PRIMARY KEY,
  doc_id    TEXT NOT NULL UNIQUE REFERENCES docs(id),
  summary   TEXT,            -- 2-3 sentence LLM summary
  key_points TEXT,           -- JSON array of bullet points
  entities  TEXT,            -- JSON array: [{"name":"","type":"person|place|concept|date"}]
  llm_tags  TEXT,            -- JSON array of LLM-suggested tags
  content_hash TEXT,         -- SHA256 of doc content when last generated
  status    TEXT DEFAULT 'pending',  -- pending | generating | ready | failed
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### LLM Pipeline

```
Doc saved → content_hash changed
  → Queue summarization task (lib/summarizer.ts)
  → LLM prompt: extract summary(2-3 sentences), key_points(≤5), entities, llm_tags
  → Parse JSON response → INSERT/UPDATE shadow_docs
  → Broadcast SSE event: shadow:updated { docId }
```

### Triggers

| Trigger | Mechanism | Description |
|---------|-----------|-------------|
| On save | Hook after doc write | Compare content_hash; if different, queue |
| Periodic | Cron every N minutes | Sweep docs where content_hash ≠ current hash |
| On demand | Agent request | If none/stale, generate synchronously |
| Bulk | Admin / migrate | Regenerate all shadow docs |

### SSE Events

- `shadow:updated { docId }` — pushed to subscribed clients (chat, wiki, briefing panels)
- `shadow:failed { docId, error }` — for monitoring and retry

### MCP Integration

The `get_doc_context` MCP tool returns shadow doc data (summary + key_points + entities) when the consumer only needs lightweight context. Falls back to full doc if no shadow doc exists.

### Token Budget

~300–500 tokens per shadow doc, achieving ~10x reduction vs. a full document (~3k–10k tokens). Critical for agentic operations that need context from 10–50 docs in a single LLM call.

### Layer 2: Doc Relation Graph

Auto-inferred semantic edges between documents via LLM analysis, providing a richer connection map than manual links alone.

```sql
CREATE TABLE doc_inferred_edges (
  id              TEXT PRIMARY KEY,
  source_doc_id   TEXT NOT NULL REFERENCES docs(id),
  target_doc_id   TEXT NOT NULL REFERENCES docs(id),
  relation_type   TEXT NOT NULL CHECK(relation_type IN (
    'prerequisite', 'continues', 'similar', 'references',
    'contradicts', 'example_of'
  )),
  confidence      REAL NOT NULL DEFAULT 0.0,  -- 0.0–1.0
  evidence        TEXT,                        -- snippet from source_doc
  auto_generated  INTEGER NOT NULL DEFAULT 1,
  reviewed        INTEGER NOT NULL DEFAULT 0,  -- user confirmed/rejected
  reviewed_at     TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_inferred_source ON doc_inferred_edges(source_doc_id);
CREATE INDEX idx_inferred_target ON doc_inferred_edges(target_doc_id);
CREATE INDEX idx_inferred_reviewed ON doc_inferred_edges(reviewed);
```

**LLM pipeline**: Batch analysis runs on a cron schedule. For each pair of recently-changed docs, LLM evaluates relation type + confidence + evidence snippet. New edges broadcast via `shadow:inferred_edge { sourceId, targetId, type, confidence }` SSE event.

**Graph integration**: Inferred edges render as dashed colored lines in the Doc Context Graph (green=prerequisite, blue=references, orange=similar, red=contradicts) with confidence tooltip. User toggles visibility via graph toolbar checkbox. "Confirm" action sets `reviewed=1`; "Reject" deletes the edge.

### Layer 3: Workspace Glossary

Auto-extracted domain-specific terminology across all documents, building a living glossary for the workspace.

```sql
CREATE TABLE glossary_terms (
  id              TEXT PRIMARY KEY,
  term            TEXT NOT NULL UNIQUE,
  definition      TEXT,                  -- LLM-generated definition
  aliases         TEXT,                  -- JSON array of alias strings
  source_docs     TEXT,                  -- JSON array of doc IDs
  context_sentences TEXT,                -- JSON array: [{doc_id, sentence, relevance}]
  status          TEXT DEFAULT 'pending', -- pending | validated | rejected
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_glossary_term ON glossary_terms(term);
```

**LLM pipeline**: On doc save, extract 3-5 domain terms via LLM. Upsert into glossary_terms (merge aliases, source_docs, context_sentences). New/unfamiliar terms flagged as `pending` for user review.

**UI**: Glossary viewer at `/ai/insights/glossary` with search, alphabet nav, per-term source doc list. "Validate" / "Reject" buttons move term to `validated` or delete it.

### Layer 4: Temporal Delta

Semantic changelog capturing what meaningfully changed in a document between versions, designed for agent consumption.

```sql
CREATE TABLE doc_temporal_delta (
  id            TEXT PRIMARY KEY,
  doc_id        TEXT NOT NULL REFERENCES docs(id),
  version_from  TEXT NOT NULL,           -- previous content_hash or version id
  version_to    TEXT NOT NULL,           -- new content_hash or version id
  change_type   TEXT NOT NULL CHECK(change_type IN (
    'created', 'expanded', 'restructured', 'trimmed', 'refined', 'merged'
  )),
  summary       TEXT NOT NULL,           -- 1-2 sentence LLM summary of change
  impact        TEXT,                    -- 'minor' | 'moderate' | 'significant'
  token_delta   INTEGER,                -- token count added/removed
  created_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_temporal_doc ON doc_temporal_delta(doc_id);
CREATE INDEX idx_temporal_created ON doc_temporal_delta(created_at);
```

**LLM pipeline**: On content_hash change, compare old vs new content via LLM diff. Classify change_type, write 1-2 sentence summary, estimate token_delta (word_count_diff × 1.3). Broadcast `shadow:temporal_delta { docId, changeType, summary }` SSE event.

**UI**: Temporal timeline at `/ai/insights/timeline` showing document lifecycle as a color-coded stream (green=expanded, blue=created, orange=restructured, red=trimmed). Click to expand delta summary. Filterable by change_type, doc, date range.

### Layer 5: Agent Context Cache

Pre-computed optimized context windows per consumer type, avoiding real-time LLM calls for frequent agent queries.

```sql
CREATE TABLE agent_context_cache (
  id              TEXT PRIMARY KEY,
  doc_id          TEXT NOT NULL REFERENCES docs(id),
  consumer_type   TEXT NOT NULL CHECK(consumer_type IN (
    'chat', 'mcp', 'briefing', 'wiki', 'search_preview'
  )),
  context         TEXT NOT NULL,  -- optimized context string (200–500 tokens)
  token_count     INTEGER NOT NULL,
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  UNIQUE(doc_id, consumer_type)
);
CREATE INDEX idx_context_consumer ON agent_context_cache(consumer_type);
```

**Context composition per consumer**:
| Consumer | Content | Target tokens |
|----------|---------|---------------|
| chat | Summary + key_points + entities | 200 |
| mcp | Summary + key_points + tags + recent deltas | 300 |
| briefing | Summary + key_points + entities + temporal deltas (last 7d) | 400 |
| wiki | Summary + key_points + entities + glossary terms | 500 |
| search_preview | Title + summary + tags | 100 |

Cache invalidated on `shadow:updated` event for that doc_id.

### Visibility & Feedback

#### Shadow Tab (Right Panel)
- On note open, shows shadow data status (pending/generating/ready/failed) as a badge
- **Summary**: Expandable summary text
- **Key Points**: Bullet list, each clickable → scroll to section in doc
- **Entities**: Chips (Person/Concept/Tool/Location), click to search workspace
- **Tags**: LLM-suggested tags with apply button
- **Feedback**: Thumbs up/down + optional text. "Regenerate" button to re-run LLM
- Feedback stored in `shadow_interactions` table for continuous improvement

```sql
CREATE TABLE shadow_interactions (
  id            TEXT PRIMARY KEY,
  doc_id        TEXT NOT NULL REFERENCES docs(id),
  feedback      TEXT NOT NULL CHECK(feedback IN ('positive', 'negative')),
  comment       TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);
```

#### AI Insights Dashboard (`/ai/insights`)
- **Recent Activity tab**: Timeline of auto-summarizations, edge inferences, glossary extractions, temporal detections. Filterable by layer (1-5) and date range.
- **Inferred Edges tab**: Table of source → relation → target with confidence %, evidence snippet, Confirm/Reject buttons. Paginated, filter by status.
- **Glossary tab**: Term browser with search, alphabet nav, source doc links, validation actions.
- **Temporal Timeline tab**: Semantic changelog stream, color-coded, expandable per entry.
- **Token Economy tab**: Per-layer token usage vs cap, estimated monthly cost (via LLM provider pricing), efficiency ratio.

#### Graph Toggles
- **Show AI-inferred edges**: Checkbox in Doc Context Graph toolbar. When on, renders dashed colored edges with confidence tooltip.
- **Show ghost nodes**: Dashed outline nodes for docs referenced by AI but not yet in user's workspace, with "(ghost)" label.

### Settings (Settings → AI)
| Setting | Options | Default |
|---------|---------|---------|
| Layer 1: Shadow summaries | on/off | on |
| Layer 2: Doc relation graph | on/off | on |
| Layer 3: Workspace glossary | on/off | on |
| Layer 4: Temporal delta | on/off | on |
| Layer 5: Agent context cache | on/off | on |
| Cron interval | every 5/15/30/60 min | every 15 min |
| Token budget (per layer, daily) | number (1000-100000) | 10000 |
| LLM model for second knowledge | (provider model list) | same as chat |

### Hierarchical Graph Data Model

The drill-down graph system treats every map document as a node in a larger graph tree:

```
Map A (root)
  ├── Node A.1 (no sub-graph, plain doc link)
  ├── Node A.2 (subGraphId → Map B)
  │     └── Map B
  │           ├── Node B.1 (subGraphId → Map C)
  │           │     └── Map C (leaf)
  │           └── Node B.2 (plain)
  └── Node A.3 (subGraphId → Map D)
        └── Map D
              └── Node D.1 (plain)
```

**Storage**: Sub-graph references use existing map document IDs. No new tables needed — `subGraphId` is a JSON field within the map's content JSON.

**Loading strategy**:
- Level 0 (root): Loaded eagerly when the map page opens
- Level 1+ (sub-graphs): Lazy-loaded on first drill. Cache in memory (Map<mapId, JSON Canvas data>)
- Previews: `rootSubGraphIds` hint triggers pre-fetch of first-level sub-graph metadata only (title, node count)

**Layout**:
- Each level gets its own independent ELK layout when first opened
- Layout is cached per level (stored alongside the map data) — re-layout only on edit
- Parent graph does NOT need to know about sub-graph internal layout (decoupled)

**URL deep-linking**:
- `/maps/:id?focus=nodeId` — opens map at root level, highlights node, opens sub-graph if node has subGraphId
- `/maps/:id?path=rootNodeId,childNodeId,grandchildNodeId` — opens map drilled N levels deep. Invalid path segments handled gracefully (show at deepest valid level)

**SSE integration**: `graph:sub_graph_updated { mapId }` event notifies open viewers when a sub-graph's content changes — cache is invalidated, preview badges update.

### Connection Strength Model

A weighted graph encoding system that computes pairwise connection strength between documents and maps it to visual variables (edge thickness, node size, opacity) across all graph types.

**Strength factors and weights**:

| Factor | Weight (default) | Source | Update trigger |
|--------|-----------------|--------|----------------|
| Link count | 0.25 | `links` table — count of bidirectional manual + auto links | Link add/remove |
| Tag overlap | 0.20 | `atom_tags` — Jaccard similarity of tag sets | Tag add/remove |
| Embedding similarity | 0.25 | `vec_atoms` — cosine similarity of F32 embeddings | Doc edit (re-embed) |
| Reciprocity | 0.10 | Both docs link to each other (1.0) vs one-way (0.5) vs none (0.0) | Link add/remove |
| Recency | 0.10 | `1 / (days_since_last_edit + 1)` — recent edits boost weight | Doc edit |
| Common references | 0.10 | Jaccard similarity of outgoing link sets | Link add/remove |

**Computation**:

```
strength(a,b) = clip(
  0.25 × norm(links(a,b)) +
  0.20 × jaccard(tags(a), tags(b)) +
  0.25 × cosine(embed(a), embed(b)) +
  0.10 × reciprocity(a,b) +
  0.10 × recency_boost(a,b) +
  0.10 × jaccard(refs(a), refs(b)),
  0.0, 1.0
)
```

Where `norm(links)` maps link count to 0.0-1.0 via `tanh(count / 3)` — first few links matter most, diminishing returns after ~5.

**Node prominence**:

```
prominence(n) = Σ strength(n, *) / max_degree
```

The sum of all incident edge strengths, normalized by the max degree in the graph. This ensures hubs are visually distinct from leaf nodes regardless of graph size.

**Visual mapping**:

| Variable | Mapping function |
|----------|-----------------|
| Edge thickness | `1 + 7 × strength^0.7` (1px → 8px, exponential mid-range) |
| Edge opacity | `0.1 + 0.9 × strength` (0.1 → 1.0, linear) |
| Edge dash | `dashed(if < 0.3), dotted(0.3-0.6), solid(> 0.6)` |
| Node scale | `0.6 + 0.4 × prominence` (0.6× base → 1.4× for hubs) |
| Node border | `1 + 3 × prominence` (1px → 4px) |
| Node opacity | `0.5 + 0.5 × prominence` (0.5 → 1.0) |
| Node saturation | `prominence` applied via CSS filter: `grayscale(1 - prominence)` |
| Edge visibility | `hidden if strength &lt; threshold` via StrengthThresholdSlider. Hidden edges are removed from DOM (not just opacity: 0) — improves SVG render performance |
| Node visibility | `hidden if prominence &lt; minProminence` via MinProminenceSlider. Isolated nodes removed from layout + DOM |

**Strength-aware ELK integration**:

Connection strength is passed as edge weight to ELK layout algorithms. ELK's layered, radial, and mrtree algorithms use edge weight to determine node proximity — higher weight = shorter edge = closer positioning.

Mapping:
```javascript
elkEdgeWeight = Math.ceil(strength * 100)
```
Range: 1 (weakest) → 100 (strongest). In Uniform mode (sensitivity=0% or "Weighted" toggle off), all edges use weight=10 (ELK default uniform weight).

Supported ELK algorithms:
| Algorithm | Edge weight behavior |
|-----------|---------------------|
| `layered` | Strong edges keep connected nodes in same layer or adjacent layers |
| `radial` | Strong edges keep children closer to root in radius |
| `mrtree` | Strong edges cluster connected sub-trees |
| `force` | Strong edge = higher spring tension, nodes pulled closer |

Implementation: `StrengthAwareLayout` adapter in the ELKLayoutEngine pipeline. Receives strength matrix from `ConnectionStrengthEngine`, converts to ELK edge weight map, merges into ELK request:

```json
{
  "layoutOptions": {
    "elk.edgeWeight": "100"
  },
  "edges": [
    { "id": "e1", "source": "a", "target": "b", "properties": { "elk.edgeWeight": 72 } },
    { "id": "e2", "source": "b", "target": "c", "properties": { "elk.edgeWeight": 15 } }
  ]
}
```

**Graceful degradation when AI disabled**:

The embedding factor (0.25) and recency factor (0.10) require AI pipeline. When unavailable:

1. **Detection**: `ConnectionStrengthEngine` checks `vec_atoms` table — if < 50% of graph nodes have embeddings, skip embedding factor
2. **Re-normalization**:

| Factor | AI-enabled weight | AI-disabled weight |
|--------|------------------|-------------------|
| Link count | 0.25 | 0.40 |
| Tag overlap | 0.20 | 0.30 |
| Embedding similarity | 0.25 | 0.00 (skipped) |
| Reciprocity | 0.10 | 0.15 |
| Recency | 0.10 | 0.00 (skipped) |
| Common references | 0.10 | 0.15 |

3. **UI indication**: Strength Legend shows "Limited mode (AI off)" badge when in degraded state
4. **Recovery**: As soon as embeddings are generated (auto-tagging runs), engine auto-upgrades to full mode and re-computes

**Edge tooltip data shape**:

When user hovers over a graph edge, the frontend fetches strength breakdown via `ConnectionStrengthEngine.getEdgeBreakdown(edgeId)`:

```json
{
  "edgeId": "edge-uuid",
  "sourceId": "node-a",
  "targetId": "node-b",
  "strength": 0.72,
  "factors": {
    "links": { "value": 4, "contribution": 0.30, "weight": 0.25 },
    "tags": { "value": 0.67, "contribution": 0.15, "weight": 0.20 },
    "embedding": { "value": 0.82, "contribution": 0.20, "weight": 0.25 },
    "reciprocity": { "value": 1.0, "contribution": 0.10, "weight": 0.10 },
    "recency": { "value": 0.3, "contribution": 0.03, "weight": 0.10 },
    "commonRefs": { "value": 0.0, "contribution": 0.00, "weight": 0.10 }
  },
  "topFactor": "links"
}
```

**Sub-graph auto-discovery heuristics**:

The system can suggest creating sub-graphs from natural clusters in the connection strength matrix:

```
internalStrength = avg(strength between each pair within candidate cluster)
externalStrength = avg(strength from cluster nodes to nodes outside)

Cluster candidate condition:
  internalStrength > 0.6 AND
  internalStrength / externalStrength > 3.0 AND
  3 ≤ clusterSize ≤ 20
```

Algorithm: Greedy agglomeration — start with each node as its own cluster, merge strongest-connected pairs until cohesion condition fails. Results ranked by `cohesion = internalStrength / externalStrength`.

Surfaced as:
- "Suggested cluster (5 nodes, cohesion: 4.2×)" badge in graph toolbar
- Toolbar buttons: "Create sub-graph" / "Dismiss" / "Adjust cluster radius"
- On "Create sub-graph": selected nodes moved to new map, parent node auto-created with subGraphId, ELK re-layout triggered for both parent and child

**Storage**: Per-graph settings updated:

```json
{
  "weightConfig": {
    "sensitivity": 0.7,
    "enabled": true,
    "thresholdMin": 0.0,
    "thresholdMax": 1.0,
    "hideWeak": false,
    "minProminence": 0.0,
    "factors": {
      "links": true,
      "tags": true,
      "embedding": true,
      "reciprocity": true,
      "recency": true,
      "commonRefs": false
    },
    "manualWeights": {
      "edge-uuid-1": 0.8,
      "edge-uuid-2": 0.3
    }
  }
}
```

New fields: `thresholdMin`, `thresholdMax`, `hideWeak`, `minProminence`.

**SSE events** (updated):
- `graph:weights_updated { mapId }` — weight matrix re-computed, subscribers re-render
- `graph:cluster_suggested { mapId, clusters: [{nodes, cohesion, size}] }` — new cluster detected (triggered after weight re-computation)

**Storage**: Per-graph weight settings stored as JSON in the map document metadata:


### Doc→Graph Mapping Algorithm

Converts any regular document's child hierarchy into a transient graph for Graph view mode. The graph is generated on-the-fly from the existing parent_id tree — never persisted as a map document.

**Mapping rules**:

| Source | Graph element | Notes |
|--------|---------------|-------|
| Current doc (viewed) | Root node | Always present, positioned top-center |
| Direct child docs (parent_id = current doc id) | Level-1 nodes | One node per child, position by hierarchy order |
| Grandchildren (parent_id = child doc id) | Expandable sub-nodes | Visible when parent node is expanded |
| Nth-level descendants | Recursive expansion | Any node with children shows expand toggle |
| Doc title + icon + metadata | Node display | Title as heading, type icon, updated/word-count as secondary |
| parent_id relationship | Directed edge | Arrow from parent → child |

**Graph generation flow**:
```
1. User toggles to Graph mode on any doc
2. Frontend fetches child hierarchy: `SELECT id, title, icon, doc_type FROM docs WHERE parent_id = ?`
3. For each child found, recursively fetch its children (depth limited by slider, default 2, max 5)
4. Build transient graph structure:
   - Root = current doc (node)
   - For each child doc → create node + edge root→child with arrow
   - For each grandchild → create node + edge child→grandchild
   - Recursively for all depths
5. Nodes with children get an expand toggle flag
6. Pass to ELK `layered` layout for positioning
7. Render via ForceGraphView (default) or MindMapView
8. On Page mode toggle → discard the in-memory graph
```

**Lazy loading**:
- By default, only root + level-1 children are fetched
- Expanding a node triggers a fetch for that node's direct children
- Already-fetched nodes are cached in memory (avoid re-fetch on collapse/expand)
- Cache invalidated when: doc hierarchy changes (parent_id update), doc deleted

**Implementation constraints**:
- Frontend-only feature: no new API endpoints needed
- Uses existing tree-walk query (docs table, parent_id index)
- Graph is entirely in-memory — never saved to a map document
- Uses same ELKLayoutEngine and graph components as map documents
- "Open as map document" button in DocGraphControls persists the graph as a real map doc


### 10. Task Management (Kanban Integration)

Task Management (#37) is powered by the existing kanban backend running on Pi (port 3004). Instead of building a new task system, Knot integrates with this backend as the source of truth for all task data.

**Backend architecture**:
- Go backend (chi router) with SQLite storage (kanban.db, WAL mode)
- REST API for frontend CRUD: boards, columns, cards, comments, tags, dependencies, search
- MCP server at `/mcp` endpoint for AI agent interaction (JSON-RPC over HTTP)
- SSE endpoint at `/api/events` for real-time push (board changes → frontend + agent updates)
- LLM integration via Luna Proxy (Qwen3.6-plus) for: categorize, suggest, auto-tag, plan generation, budget analysis, contextual chat

**Integration pattern**:
- **Knot frontend** → REST API directly (kanban backend is already accessible within tailnet)
- **AI agents** → MCP tools (`list_boards`, `create_card`, `move_card`, `update_card`, `set_card_parent`, etc.)
- **Knot backend** (future) → optional proxy for auth gateway, or direct if no auth needed
- **Real-time sync**: Both human and AI actions go through SSE — all clients see changes instantly

**Data model** (simplified):
```
Board (id, title, type: task|trip, default_view, created_at, updated_at)
Column (id, board_id, title, position, color, created_at)
Card (id, board_id, column_id, parent_id, title, description, assignee, priority, 
      due_date, status: active|archived, position, lat, lng, created_at, updated_at)
Comment (id, card_id, author, body, created_at)
Tag (id, name, color)
CardTag (card_id, tag_id)
Dependency (id, blocker_card_id, blocked_card_id, created_at)
BoardSuggestion (id, board_id, suggestion_type, content, source: llm|system, 
                 applied: bool, created_at)
```

**Doc-card linking**:
- Linking table stored in Knot's primary DB (not in kanban DB)
- Schema: `card_doc_links (id, card_id, doc_id, created_at)`
- Query: Knot looks up linked cards by doc_id, kanban looks up linked docs by card_id
- Card context shown in doc sidebar via REST call: `GET /api/cards/{id}`
- Doc links shown in kanban card detail

**Auth strategy**:
- Kanban backend currently has NO auth (open within Docker network)
- Two options:
  a. **No auth** (MVP): Knot frontend calls kanban API directly within tailnet. Static token `m3d14_a3eb7a6aca` for write operations.
  b. **Proxy auth** (future): Knot backend proxies kanban API, adds JWT/session auth

**Implementation phases**:
1. **Phase 1** (current): Kanban backend runs independently. Knot embeds kanban board via iframe or links to kanban UI.
2. **Phase 2**: Knot frontend has native kanban components (KanbanBoard, CardDetail, etc.) talking to kanban REST API directly.
3. **Phase 3**: Full AI agent integration — agents auto-create tasks from doc content, suggest task breakdown, assign to humans/agents.

**Backend source**: Go source at `/home/chad/kanban/backend/` on Pi. Build with `GOOS=linux GOARCH=arm64 go build` → binary `kanban-backend`. Docker image: `alpine:3.20` with binary + Vue dist served as static files.


**LLM Integration Architecture**:

The LLM suggest feature follows the dual-strategy pattern proven by the Pi Kanban backend:

1. **LLM client**: OpenAI-compatible HTTP client connected to Luna Proxy (model `qwen3.6-plus` via `http://100.87.72.121:8088/v1`). 60s timeout. System prompt enforces strict analytical tone (no fluff, no pronouns, Vietnamese support). Returns stub when unreachable — never crashes.

2. **Analyze flow**:
   - Load board data (columns, cards, stats, overdue/reminder counts)
   - Query personal KB via Atomic KB API for relevant context (if configured)
   - For trip boards: fetch DuckDuckGo Instant Answer web search results
   - Build prompt with all context → LLM generates `SuggestedAction[]`
   - Run deterministic rules (`computeAnalyzeActions`) for guaranteed suggestions:
     - Backlog có card → suggest categorize
     - Urgent/high priority trong Backlog → suggest move to Tomorrow
     - Card không có tag → suggest add_tags
     - Trip board thiếu accommodation/transport → suggest create_card
     - Card quá hạn → suggest review
   - Merge LLM + deterministic results, deduplicate by type+label

3. **Action types**:
   - `categorize` — auto-sắp xếp card vào column phù hợp
   - `create_card` — tạo card mới từ suggestion (trip: địa điểm/hoạt động)
   - `move_card` — di chuyển card urgent từ backlog lên Tomorrow
   - `add_tags` — gợi ý tag cho card chưa có tag
   - `review` — cảnh báo card quá hạn

4. **Auto-tag fallback**: When LLM call fails, keyword-based matching kicks in:
   - `server|deploy|docker|kubernetes|devops` → `["devops", "server"]`
   - `bug|lỗi|fix|error|crash` → `["bug", "fix"]`
   - `ăn|quán|cà phê|nhà hàng|restaurant|food` → `["food", "địa điểm"]`
   - `meeting|họp|sync` → `["meeting"]`
   - `docs|documentation|tài liệu` → `["docs"]`
   - `design|ui|ux|giao diện` → `["design"]`
   - `test|kiểm tra|qa|testing` → `["test"]`

5. **Web search integration**: DuckDuckGo Instant Answer API (`https://api.duckduckgo.com/?q=...&format=json`) — no API key needed. Results are cleaned (strip HTML, truncate to 3000 chars) and injected into LLM prompt as context. Only active for trip boards.

6. **Frontend behavior**:
   - `LLMSuggestBar`: Auto-load 1.5s after mount to avoid UI flash on page load. Color-coded action buttons (purple=categorize, green=create, blue=move, amber=tags, slate=review). Per-action execute with independent loading spinner. Dismiss to hide entire bar. SSE `board-changed` event triggers refresh.
   - `TripSuggestPanel`: Auto-refresh every 2 minutes for live trip suggestions. Shows rich metadata cards (priority badge, category, city, rating, estimated time). "Add" button creates card in backlog with full geo metadata.



## Future Options

- **Tauri wrapper**: Wrap the Next.js build in a Tauri shell for native file system access, system tray, background tasks
- **Turso/libsql**: Replace better-sqlite3 with libsql for optional remote sync
- **LAN sync**: Simple HTTP-based sync between devices on the same network (later phase)
