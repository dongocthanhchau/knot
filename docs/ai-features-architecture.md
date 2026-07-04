# AI Features Architecture — Knowledge Management App

## App Layout Reference

The app has three zones to anchor all feature designs:

```
┌──────────────────────────────────────────────────────┐
│  [Left Sidebar]  │  [Main Content]  │  [Right Panel] │
│                  │                  │                │
│  • Search        │  • Editor        │  • Properties  │
│  • Tags tree     │  • Reader        │  • Backlinks   │
│  • Graph nav     │  • Wiki article  │  • Similar     │
│  • Today view    │  • Chat          │  • Citations   │
│                  │                  │                │
└──────────────────────────────────────────────────────┘
```

All panels are resizable. The right panel can be collapsed (Cmd+.). Left sidebar auto-hides on narrow viewports.

---

## 1. Semantic Search (#3)

### Trigger & Entry Points
- **Cmd+K** — opens quick-search overlay (the primary entry)
- **Click search icon** in the left sidebar — expands full search panel
- **Slash command** `/search` inside the editor

### Quick Search (Cmd+K)
```
┌──────────────────────────────────────────────┐
│  🔍  Search notes...                   [⌘+K] │
├──────────────────────────────────────────────┤
│  [Best match]  [Text match]  [Semantic]      │
├──────────────────────────────────────────────┤
│  📄 "How to ..."                        92%  │
│     snippet with <highlight>term</highlight> │
│     #productivity  #workflow                 │
│                                              │
│  📄 "Related ..."                         78%  │
│     another snippet...                       │
│     #research    #2024                       │
│                                              │
│  📄 Title match only...                    —   │
│     ...                                      │
│                                              │
│  Results in "Research" tag    →  Show all >  │
└──────────────────────────────────────────────┘
```

- Overlay is ~600px wide, centered, backdrop dims the editor
- **Three mode tabs**: `Best match` (hybrid, default), `Text match` (BM25/keyword), `Semantic` (vector only)
- Results appear in ~150ms as user types (debounced 300ms)
- Each result card shows:
  - **Icon/emoji** from the note
  - **Title** in medium weight
  - **Snippet** with query terms highlighted
  - **Similarity score** as a colored bar (green=high, yellow=medium, grey=low)
  - **Tags** as small pills
- **Keyboard navigation**: Arrow keys to move, Enter to open, Esc to dismiss
- **Tab auto-completes** search with suggested tags: `@tagname` filters results to that tag

### Expanded Search (Full Panel)
```
┌───────────────────┬──────────────────────────────┐
│  [Left Sidebar]   │  🔍 Search Notes             │
│                   │  ┌────────────────────────┐   │
│                   │  │  query here...    [↩]  │   │
│                   │  └────────────────────────┘   │
│                   │  [Best match] [Text] [Sem]    │
│                   │  Tags: [#all] [#dev] [#ideas] │
│                   ├──────────────────────────────┤
│                   │  Result 1          92%   ★   │
│                   │  snippet...                  │
│                   │  tags...                     │
│                   │  ...                         │
│                   │                       Page 2 │
│                   └──────────────────────────────┘
```

### Hybrid Search Mechanics
- Single query runs **two retrievals in parallel**:
  1. **Dense (vector)**: embed query → cosine similarity against note embeddings → top-K
  2. **Sparse (BM25)**: tokenize → TF-IDF scoring → top-K
- `Best match` mode uses **Reciprocal Rank Fusion (RRF)** to merge results:
  - `score = 1/(k + rank_dense) + 1/(k + rank_sparse)`
  - This gives a single ranked list that rewards items ranking high in either method
- `Text match` mode shows BM25 results only
- `Semantic` mode shows vector results only
- Tag filter is applied as a **post-filter** on the merged set (fast, linear scan over results)

---

## 2. Auto-Tagging (#21)

### Where It Happens

Auto-tagging triggers at the **note save** moment — when the user:
- Presses **Cmd+S**
- Closes the note (clicks away or navigates)
- App is backgrounded (auto-save)

### The UX Flow

**Step 1 — User completes writing**
```
┌──────────────────────────────────────┐
│  📄  My New Idea                     │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ #productivity  +  [✨ Suggest]   ││  ← tag bar
│  └──────────────────────────────────┘│
│                                      │
│  The content of the note goes here   │
│  and the user is typing...           │
│                                      │
│                       [Discard] [Save]│
└──────────────────────────────────────┘
```

**Step 2 — On save, tags appear with approval state**
```
┌──────────────────────────────────────┐
│  📄  My New Idea                     │
│                                      │
│  #productivity  #writing  #ideas     │
│         ✨✨  ✨new  ✨new            │
│                                      │
│  ┌─ AI Suggested Tags ─────────────┐ │
│  │  ✨ #brainstorming  (92% match)  │ │
│  │  ✨ #personal-knowledge (78%)    │ │
│  │                                 │ │
│  │  [Accept all]  [Accept 1]  [✕]  │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Content of the note...              │
└──────────────────────────────────────┘
```

- Tags that were already on the note are shown normally
- New suggestions have a **sparkle icon** (✨)
- A small **toast notification** appears briefly: "3 tags suggested" with Accept/Dismiss inline buttons
- The tag bar gets a subtle **pulse animation** on the suggestions

**Step 3 — Interaction modes**

Three modes set in preferences (Settings → AI → Auto-Tagging):

| Mode | Behavior |
|------|----------|
| **Suggest (default)** | Tags appear with sparkle. User must Accept or Dismiss. Tag is not indexed until accepted. |
| **Auto-apply** | Tags are added silently on save. A small undo toast: "Added 2 tags [Undo]" |
| **Manual only** | No auto-tagging. User can trigger manually via tag bar's "✨ Suggest" button. |

### How It Works
- On save, the note title + content (up to ~2000 chars) is sent to the LLM with the user's existing tag vocabulary as context
- LLM returns 1-5 suggested tags, each with a confidence score
- Tags that already exist in the workspace use the existing tag ID; new tag names are offered as candidates (not auto-created unless approved)
- Confidence threshold: tags below 50% confidence are not shown

### Edge Cases
- **Blank note**: No tagging attempted (waste of LLM call)
- **Note with 2 chars**: Skip
- **Existing tags already cover the content**: LLM may return empty; no UI shown
- **User manually added tags before save**: New suggestions are merged; existing manual tags are not duplicated
- **Offline**: Tag suggestions are queued and applied when online

---

## 3. Wiki Synthesis (#23)

### Trigger
From any **tag page** or **tag context menu**:

```
  [#productivity]
    ├── Open tag page
    ├── Pin to sidebar
    └── ✨ Generate Wiki Article  ← click this
```

Also available as a button on the tag page header:
```
  #productivity  (23 notes)
  [Generate Wiki] [Regenerate] [Last generated 2h ago]
```

### Generated Page Layout

Wiki articles open as a special **"Synthetic" page** — visually distinct with a subtle gradient left border or a different background tint to indicate it's AI-generated (not a user-authored note).

```
┌──────────────────────────────────────────────────┐
│  📄  Productivity  (Wiki)                  [⚙]   │
│  Generated from 23 notes • Last updated 2h ago   │
│  4 new notes since last generation          [↻]  │
│                                                   │
│  ┌── Table of Contents ──────────────────────┐   │
│  │  1. What is Productivity                   │   │
│  │  2. Productivity Frameworks                │   │
│  │     • Getting Things Done (GTD)       [3]  │   │
│  │     • Pomodoro Technique              [5]  │   │
│  │     • Eisenhower Matrix               [2]  │   │
│  │  3. Tools & Apps                           │   │
│  │  4. Personal Workflow                      │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ## What is Productivity                          │
│  Productivity is the measure of [1] ...            │
│                                                   │
│  ## Productivity Frameworks                        │
│                                                   │
│  ### Getting Things Done (GTD)                    │
│  David Allen's methodology[3] focuses on...       │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Citation System
- **Inline citations**: `[1]`, `[2]` — numbered links in bracket notation
- **Hover behavior**: Hovering shows a popover with the source note's title, first 2 lines, and tags

```
  ...as David Allen described[3]
                                ┌──────────────────────┐
                                │ 📄 GTD Summary       │
                                │ "The key insight of   │
                                │ GTD is..."           │
                                │ #productivity #gtd   │
                                │    [Open note →]     │
                                └──────────────────────┘
```

- **Click behavior**: Opens the source note in a **split view** (article on left, source note on right)
- **Footer references**: A numbered reference list at the bottom, each with:
  - `[1] Note Title — opened 5 times`
  - `[2] Another Note — created 2 days ago`
  - Direct "Open" button and "Pin citation" icon

### Regeneration Policy
- **Manual only** — user clicks "Regenerate" or the refresh icon
- The system tracks **notes added since last generation** and shows the count
- On regeneration, the previous version is **preserved in version history** (user can revert)
- Regeneration can be **scoped**: "Regenerate section 3 only" (nope — too complex for V1) or "Regenerate based on these notes" (user can select specific notes to re-synthesize from)

### Interaction
- The article is **editable** — user can click any paragraph to edit text directly
- User can **delete sections** (with undo)
- User can **reorder sections** (drag handle on the left)
- User can **add manual content** between AI-generated sections
- A subtle indicator shows which content was AI-generated vs. user-modified:
  - `✨ AI-generated` badge on auto content
  - `✏️ Modified` badge on user-edited sections

### How It Works
1. User clicks "Generate Wiki"
2. System collects all notes tagged with the target tag (up to ~200)
3. Notes are chunked and sent to LLM with instruction to synthesize into a structured article
4. LLM returns markdown with `[N]` citation markers
5. Citation mappings are stored: `{wiki_id, section, citation_number → note_id, chunk_text}`
6. The article is rendered with interactive citations
7. On regeneration, the prompt includes the previous version + new notes only (delta synthesis)

---

## 4. Agentic Chat (RAG) (#22)

### Entry Points
- **Cmd+Shift+C** — opens/resumes chat panel
- **Floating button** — bottom-right, persistent across views
- **Sidebar icon** — chat bubble in left sidebar
- **Slash command** `/ask` in editor

### Layout

The chat opens as a **resizable right-side overlay** (not a full page replacement — keeps the note context visible).

```
┌─────────────────────────────────────────────────────┐
│  [Editor / Note Content]         │  🤖 Chat         │
│                                   │                  │
│  User is reading a note...        │  [Search notes]  │
│                                   │                  │
│                                   │  ── Today ────   │
│                                   │                  │
│                                   │  Q: What did I   │
│                                   │  write about X?  │
│                                   │                  │
│                                   │  A: From your    │
│                                   │  notes [1]...    │
│                                   │                  │
│                                   │  ┌────────────┐  │
│                                   │  │ 📄 Note X │  │
│                                   │  │ "snippet" │  │
│                                   │  └────────────┘  │
│                                   │                  │
│                                   │  ──────────────  │
│                                   │  ▸ What about Y? │
│                                   │  ▸ Summarize Z   │
│                                   │                  │
│                                   │  Ask anything... │
│                                   │  [@tag]    [➤]   │
└─────────────────────────────────────────────────────┘
```

The overlay can be:
- **Docked** (default) — right panel, ~400px
- **Floating** — drag out to become a movable window
- **Full-page** — click expand icon (useful for long conversations)
- **Resizable** — drag left edge to resize

### Components

**Header:**
- "🤖 Chat with your notes"
- Scope selector: `[All notes] [▼]` — dropdown to pick specific tags
- "New chat" button
- Close/minimize buttons

**Scope Selector (Tag Scoping):**
```
[All notes ▼]  [⚙]
 ├── All notes
 ├── #productivity
 ├── #research
 ├── #personal
 ├── Custom...
 │   ┌──────────────────┐
 │   │ [#dev] [#ops]     │  ← multi-select tags
 │   │                   │
 │   │ [Apply scope]     │
 │   └──────────────────┘
```

- User can type `@tagname` in the input to scope mid-query
- Chat header shows active scope as colored pills: `[#dev] [#ops] [× Clear]`
- Scoped search is significantly faster and yields more relevant answers

**Message Area:**
- **Streaming response** — typewriter effect with a pulsating cursor
- Responses stream in chunks; user can interrupt by clicking stop icon
- Each message can be copied, shared, or pinned
- **Suggested follow-ups** appear as clickable pills at the bottom of each response:
  - `▸ Can you elaborate on point 3?`
  - `▸ How does this relate to project X?`

**Citation Cards — the key UX element:**
```
┌──────────────────────────────────┐
│ 📄 Note Title                    │
│ "Exact snippet from the note..." │
│ #tag1  #tag2            [→ Open] │
│ Relevance: ████████░░ 82%        │
│                            [📌]  │
└──────────────────────────────────┘
```

- Cards appear **inline** where `[1]`, `[2]` are referenced in the response
- Cards are **collapsible** (toggle with a click)
- **Relevance bar** shows how strongly the response relied on this source
- **Pin icon** saves the citation to a "Pinned Sources" collection
- **Open** navigates to the source note

**Input Area:**
```
┌──────────────────────────────────┐
│ Ask anything...      @tag  [➤]  │
└──────────────────────────────────┘
 [📎 Attach context from current note]
```

- Supports `@tag` for inline scope
- **Attach current note** toggle — includes the note being viewed as context
- Cmd+Enter to send, Shift+Enter for newline

### Chat Sessions
- Sessions are **auto-saved** and listed in a history panel (toggle in header)
- Each session has a title (auto-generated from first query) and timestamp
- User can **rename**, **delete**, or **share** sessions
- Sessions respect scope — reopening a session restores the original tag scope
- Search across chat sessions is available

### How It Works
1. User query + scope filter → retrieve top-K relevant chunks (hybrid search over notes in scope)
2. Retrieved chunks + conversation history + user query → LLM
3. LLM streams response; citation markers map to source chunks
4. Response is rendered in real-time; citation cards are populated from chunk metadata
5. Suggested follow-ups are generated from the response content (separate LLM call, ~200ms)

---

## 5. Daily Briefing (#24)

### Entry Point
- Sidebar → **"Today"** view (calendar icon)
- Default landing page when opening the app on a new day (first visit)

### Layout

The Daily Briefing is a **full-page view** with sections:

```
┌─────────────────────────────────────────────────────┐
│  📅  Today — July 4, 2026                     [↻]   │
│  Good morning, Chad. You have 4 notes from today.   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌── AI Brief ──────────────────────────────────┐   │
│  │                                                │   │
│  │ You wrote 4 notes today: 2 about the MCP      │   │
│  │ server architecture and 2 about tagging UX.   │   │
│  │                                                │   │
│  │ 🔗 I noticed a connection between "MCP tool   │   │
│  │   design" and "Tool Discovery" — want to      │   │
│  │   link them?                              [→] │   │
│  │                                                │   │
│  │ 👀 "Onboarding flow" hasn't been updated in   │   │
│  │    2 weeks — might be worth a review.    [→]  │   │
│  │                                                │   │
│  │ [Regenerate] [Copy] [Dismiss suggestions]      │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  ┌── New Notes ─────────────────────────────────┐   │
│  │                                                │   │
│  │  📄 MCP Tool Design              10 min ago    │   │
│  │  📄 Tagging UX Review           1 hour ago     │   │
│  │  📄 Search Result Caching       3 hours ago    │   │
│  │  📄 Connection Ideas            5 hours ago    │   │
│  │                                      [Show all] │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  ┌── Graph Snapshot ────────────────────────────┐   │
│  │                                     🔍+      │   │
│  │   [A small network graph showing today's     │   │
│  │    notes and their connections to existing   │   │
│  │    knowledge base]                           │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  ┌── Suggested Review ──────────────────────────┐   │
│  │                                                │   │
│  │  📄 Old Note About X        Last seen: 3w ago │   │
│  │     ⋮ related to "MCP Tool Design"            │   │
│  │  📄 Stale Draft Y           Last seen: 1mo ago │   │
│  │     ⋮ might need finishing                    │   │
│  │                                [Review Later]  │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Alternatively, a **compact widget** version lives on the dashboard/home page:
```
┌──────────────────────────────────┐
│  📅 Today's Briefing             │
│  4 new notes • 2 stale notes    │
│  "You wrote about MCP and UX    │
│   today. I found a connection   │
│   between..."              [→]  │
└──────────────────────────────────┘
```

### Content Sections

| Section | Content | Source |
|---------|---------|--------|
| **AI Brief** | Narrative summary of the day's notes, patterns, connections | LLM from today's notes + random sample of older notes for connection discovery |
| **New Notes** | Chronological list of notes created today | Metadata |
| **Updated Notes** | Notes modified today | Metadata |
| **Graph Snapshot** | Interactive mini-graph of today's activity | Graph data filtered to today's notes |
| **Suggested Review** | Notes that are stale, unfinished, or newly relevant | Heuristic: last-edited > 7 days, or newly connected to today's notes |
| **Connection Suggestions** | Specific "you should link these" recommendations | LLM or co-occurrence analysis |
| **Stats** | Streak, total notes, notes this week | Metadata aggregation |

### AI Brief — Detailed Structure

The AI Brief paragraph is generated by analyzing:
1. All notes created/modified today
2. A random sample of 10 older notes (for connection discovery)
3. The current tag structure

The LLM is prompted to produce:
- A concise 2-3 paragraph summary
- Specific "connection discovered" suggestions (with note titles)
- Review reminders (notes untouched for > 2 weeks that relate to today's activity)

### Generation Timing
- Generated on **first app open of the day** (client-side check: has today's briefing been generated?)
- Stored as a **system note** (not editable by user, but can be copied)
- User can trigger **manual regeneration** at any time
- If user opens the app after creating notes elsewhere (e.g., mobile), the briefing auto-updates

### Customization
User can toggle sections on/off in Settings → Daily Briefing:
```
☑ AI Brief
☑ New Notes
☐ Updated Notes
☑ Graph Snapshot
☐ Suggested Review
☑ Stats
```

---

## 6. Similar Notes (#25)

### Where They Appear

Similar notes appear in **two contexts**:

#### A. Right Panel (Viewing a Note)
```
┌─ Right Panel ─────────────────────┐
│                                   │
│  📋 Properties                    │
│  Created: 2h ago                  │
│  Tags: #dev #mcp                  │
│                                   │
│  🔗 Backlinks (3)                 │
│  • Note A                         │
│  • Note B                         │
│                                   │
│  🔍 Related Notes                 │
│  ┌─────────────────────────────┐  │
│  │ 📄 MCP Tool Design     ██░ │  │
│  │   Similarity: 87%     [↗] │  │
│  │   "The MCP server..."      │  │
│  │   #dev  #mcp               │  │
│  │                    [Link ✦]│  │
│  ├─────────────────────────────┤  │
│  │ 📄 Search Ranking      ██░ │  │
│  │   Similarity: 72%     [↗] │  │
│  │   "Hybrid search..."      │  │
│  │   #search  #ai            │  │
│  │                    [Link ✦]│  │
│  ├─────────────────────────────┤  │
│  │ 📄 Agentic Chat        ██░ │  │
│  │   Similarity: 65%     [↗] │  │
│  │   "Chat interface..."     │  │
│  │   #ai  #ux                │  │
│  │                    [Link ✦]│  │
│  └─────────────────────────────┘  │
│                         [Show +] │
└───────────────────────────────────┘
```

Each card shows:
- **Title** of the related note
- **Similarity bar** (visual: ████░ 87%)
- **First line** of content as preview
- **Tags** for context
- **Open button** (↗) — opens in split view
- **Link button** (✦) — creates a bidirectional link with one click
  - On click: brief success animation, "Linked!" toast, card moves to Backlinks section

#### B. Bottom of Editor
When editing a note, a persistent section at the bottom:
```
┌──────────────────────────────────────┐
│  ...end of note content              │
│                                      │
│  ── Related Notes ────────────── [+] │
│                                      │
│  📄 MCP Tool Design   87%   [Link]   │
│  📄 Search Ranking    72%   [Link]   │
│  📄 Agentic Chat      65%   [Link]   │
│                                      │
│  Drag a note here to link manually   │
└──────────────────────────────────────┘
```

This section has a **drag target** — user can drag any note from the sidebar or search results onto it to create a manual link.

### Manual Linking

Two ways to manually create links:

1. **Drag and drop**: Drag a note from anywhere (sidebar, search results, graph) onto:
   - The "Related Notes" section at the bottom of an open note
   - A note node in the graph view
   - Gives haptic feedback + "Linked!" toast

2. **Inline link syntax**: Type `[[Note Title]]` in the editor — auto-completes against note titles, creates a bidirectional link

### Graph View Integration
- In the **graph view**, edges between nodes can be:
  - **Created by user** (solid line)
  - **Auto-detected similar** (dashed line, lighter color)
  - User can convert auto-edges to manual edges (click edge → "Confirm link")
- Similarity strength controls edge thickness and opacity

### How It Works
- When a note is opened, its embedding vector is compared against all other note embeddings
- Top-K (default 5) nearest neighbors by cosine similarity are shown
- Similarity score is computed as normalized cosine distance (0-100%)
- Results are cached; re-computed when the note is modified
- Threshold: notes below 40% similarity are not shown
- Manual links are stored as explicit graph edges and always shown first



---

## Priority Queue Architecture

### Overview
Single-queue design phục vụ Ollama LLM. 3 priority levels: P1 (user-facing), P2 (interactive features), P3 (background batch). P1 pre-empts P3 directly; P2 chạy xen kẽ.

### Queue Levels

| Level | Origin | Max concurrency | Pre-emption | Example |
|-------|--------|----------------|-------------|---------|
| **P1** | UI request (user action) | 1 | Pre-empts P3 | Chat response, manual classify |
| **P2** | Feature trigger (interactive) | 1 | Starts after P1 | Auto-tag after save, template suggest |
| **P3** | Scheduler / batch | 1 | Paused when P1 arrives | Background tagging, daily briefing |

### State Machine

```
IDLE → P1_ACTIVE → (P2_QUEUED | P3_PAUSED) → P1_DONE → P2_ACTIVE → P3_RESUMED
```

- **IDLE**: No requests. Queue empty.
- **P1_ACTIVE**: Processing user request. P2/P3 queue up.
- **P1_DONE**: P1 complete. Check queue: P2 runs next, then P3 resumes.
- **P3_PAUSED**: Pre-empted by P1. State saved, resumed later.

### Streaming & SSE

```
Client → POST /api/ai/chat { query, priority: "P1" }
Server → SSE stream: data: { chunk: "..." }
       → event: done
       → event: busy    { level: "P2", position: 2 }
       → event: paused  { level: "P3", reason: "pre-empted" }
```

SSE events:
- `busy{n, level}` — queue depth và level hiện tại
- `paused{reason}` — P3 bị pre-empt, kèm lý do
- `resumed{level}` — job tiếp tục

### Ollama Connection Pattern

```
PriorityQueue
  ├── OllamaClient (shared singleton)
  │     ├── generate(model, prompt) → stream
  │     └── embeddings(model, input) → vector[]
  └── QueueWorker
        ├── dequeue() → Job
        ├── execute(job) → OllamaClient.call()
        └── handleResult/Error()
```

- Single OllamaClient instance (kết nối duy nhất đến Ollama)
- QueueWorker xử lý tuần tự theo priority
- P3 job lưu checkpoint khi bị pre-empt

---

## Auto-Organization Architecture

### Overview
5 features share a common pipeline: content capture → analysis → action. All use the Priority Queue for Ollama access.

### Common Pipeline

```
Content Event (save/paste/create)
  → Feature Trigger (on-save / new-note / manual)
  → Priority Queue (P2 for interactive, P3 for batch)
  → LLM / Embedding Analysis
  → Action (classify / suggest / link / template / merge)
  → Result Notification (toast / panel badge / auto-apply)
```

### Feature Details

#### Auto-Classify to Folder
- **Trigger**: On save (real-time) hoặc batch P3 scheduler
- **Prompt**: LLM nhận title + content → output folder path
- **Threshold**: >70% auto-classify; 50-70% suggest; <50% skip
- **Feedback**: User manual moves ghi vào history (top-10) → LLM preference learning

#### Auto-Folder Suggest
- **Trigger**: New note dialog opens
- **Performance**: <500ms (P1). Cache folder embeddings → similarity search local
- **Fallback**: Queue busy → "AI suggest unavailable" + empty dropdown

#### Auto-Link Discovery
- **Trigger**: Manual run + on-save suggest
- **Hybrid**: BM25 (candidates) → LLM rerank (top-3). Giảm 70% LLM calls.
- **Batch mode**: P3 job quét định kỳ

#### Auto-Template Matching
- **Trigger**: Paste event / create note
- **Pattern**: LLM detect content type → suggest template
- **Override**: Disable per-pattern. Custom templates via frontmatter.

#### Auto-Merge Duplicates
- **Trigger**: Manual + optional auto-detect
- **Thresholds**: >95% auto-merge; 85-95% suggest; <85% skip
- **Merge strategy**: Content union, frontmatter merge, backlinks union
- **Undo**: Snapshot trước merge

### Data Flow

```
┌──────────────┐     ┌────────────────┐     ┌───────────────┐
│  Event Bus   │────→│ Priority Queue │────→│ OllamaClient  │
│ (save/paste) │     │ (P1/P2/P3)     │     │ (generate/emb)│
└──────────────┘     └────────────────┘     └───────┬───────┘
                                                     │
                              ┌──────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │ Action Executor │
                    │ (classify/suggest│
                    │  /link/template │
                    │  /merge)        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  UI Notification│
                    │  (toast/badge)  │
                    └─────────────────┘
```



---

## Notification System Architecture

### Overview
Notification system phục vụ mọi AI feature. Thiết kế local-first, sẵn sàng cho web future. Push notifications không phụ thuộc vào server bên ngoài.

### Data Model

```
notifications {
  id:        TEXT PRIMARY KEY (ulid)
  type:      TEXT NOT NULL  -- ai_suggestion | batch_complete | daily_briefing | location_alert | system
  title:     TEXT NOT NULL
  body:      TEXT
  action_url TEXT            -- deep link khi click (e.g. knot://links/review)
  source:    TEXT            -- feature name (e.g. "auto-link", "daily-briefing")
  read_at:   INTEGER         -- null = unread
  created_at: INTEGER NOT NULL
}
```

Indexes: `(read_at, created_at)`, `(type, created_at)`

### Component Architecture

```
┌─────────────────────────────────────────────┐
│           NotificationService                │
│  - push(type, title, body, action_url)       │
│  - markRead(id) / markAllRead()              │
│  - getUnreadCount() → number                 │
│  - list(page, filter) → Notification[]       │
│  - cleanup(days=30)                           │
│  - onNotification callback                   │
├─────────────────────────────────────────────┤
│  Integration                                │
│  - AI features call NotificationService.push │
│  - Desktop: system notification (Electron)   │
│  - Web: dispatch custom event → web client   │
└─────────────────────────────────────────────┘
```

### Integration Points

| Feature | Notification Type | Trigger | Action URL |
|---------|------------------|---------|------------|
| Auto-Link Discovery | `ai_suggestion` | Batch complete | `knot://links/review` |
| Auto-Classify Batch | `batch_complete` | P3 job done | `knot://classify/review` |
| Daily Briefing | `daily_briefing` | Scheduler | `knot://briefing/today` |
| Location Suggest | `location_alert` | Geolocation match | `knot://location/suggest` |
| Version Sync | `system` | Conflict/backup | `knot://settings/sync` |
| Task Reminder | `reminder_due` | Cron eval (60s) | `knot://reminders/view` |

### Future Web

```
Local (desktop)           Web (future)
─────────────────────────────────────────
NotificationService  →    HTTP API (/api/notifications)
                         SSE stream (real-time push)
                         Web Push API (background)
```

- Desktop: Tauri notification API
- Web: Service Worker + Web Push (cần server push endpoint)
- Hybrid mode: web app dùng SSE khi active, Web Push khi background

---

## Location-Based Suggestion Architecture

### Overview
Geolocation-aware note suggestion. Privacy-first: opt-in, local-only, không tracking.

### Pipeline

```
App Start / Timer (30min)
  → Geolocation API → coordinates (lat, lng)
  → Reverse Geocode (Nominatim, rate-limited: 1 req/sec)
  → City / District name
  → Query notes WHERE location CONTAINS city OR district
  → Match found? → Push notification + show suggestion card
```

### Components

```
LocationService
  ├── getCurrentPosition() → {lat, lng, accuracy}
  ├── reverseGeocode(lat, lng) → {city, district, country}
  ├── matchNotes(city, district) → Note[]
  └── onLocationChange(handler)

LocationCache
  ├── get(key=coordinates) → cached geocode result
  ├── set(key, value, ttl=24h)
  └── Nominatim rate-limit guard
```

### Note Location Tagging

Frontmatter format:
```yaml
---
location: "Hanoi, Vietnam"           # Human-readable
location: "21.0285,105.8542"         # Coordinates
location: ["Hanoi", "21.0285,105.8542"]  # Both
---
```

Matching priority:
1. Exact city/district name match (case-insensitive)
2. Coordinates proximity (<5km radius)
3. Fuzzy name match (e.g. "Ha Noi" → "Hanoi")

### Privacy Controls

```
Permission State Machine:

UNSET → (dialog) → GRANTED (Nominatim + GPS)
                  → GPS_ONLY (no Nominatim)
                  → DENIED (no location features)
                  → ASK_AGAIN (prompt next time)
```

- **GRANTED**: Full features. GPS + reverse geocode (gửi coordinates đến Nominatim).
- **GPS_ONLY**: Chỉ match notes có coordinate tags. Không gọi Nominatim.
- **DENIED**: Không có location features.
- All location data stored locally. No telemetry.

### Rate Limiting

Nominatim giới hạn 1 request/second. Cache 24h:

```
Request → check cache → hit? → return cached
                      → miss? → wait 1s → fetch → cache → return
```

Queue Nominatim requests nếu nhiều location event cùng lúc.

## Cross-Feature Integration Points

| Feature pair | Integration |
|---|---|
| Semantic Search ↔ Similar Notes | Both use the same embedding index. Searching is just querying the index; similar notes is nearest-neighbor for a specific note vector. |
| Similar Notes ↔ Manual Linking | The "Link" button in Similar Notes panel creates a bidirectional link that shows in backlinks. |
| Wiki Synthesis ↔ Agentic Chat | Chat can reference wiki articles as sources. Chat response can include "This is covered in the [wiki article for #tag]". |
| Daily Briefing ↔ Similar Notes | The "Suggested Review" section in the briefing uses the same similarity engine to find stale notes related to today's activity. |
| Auto-Tagging ↔ Wiki Synthesis | New tags from Auto-Tagging surface in the tag tree; when a tag has enough notes (configurable: default 5), a "Generate Wiki" prompt appears. |
| MCP ↔ All features | Every AI feature is accessible programmatically through MCP server + HTTP API. See MCP/HTTP API section below. |
| Notification ↔ Task Reminder | Task Reminder engine calls `NotificationService.push` for due reminders. Reminder list view shows in notification center. |
| Notification ↔ Location Suggest | Location Suggest pushes location alerts via `NotificationService.push`. Both use the same notification channel. |
| Plugin System ↔ MCP | Plugin tools exposed via MCP with `plugin.<plugin_id>.<tool_name>` prefix. Plugin lifecycle syncs with MCP tool catalog. |
| Plugin System ↔ AI features | Plugin hooks can intercept AI operations (on_classify, on_summarize, on_chat, on_embed). Plugins can override or extend AI behaviour. |
| Fediverse ↔ Selective Sync | Federation sync engine depends on space-based architecture. Selective sync (per-space permissions) is a prerequisite for child server sync. |
| Fediverse ↔ Conflict Resolution | Conflict detection + resolution is built into the sync protocol. LWW strategy with auto-merge for non-overlapping field edits. |

---

## Task Reminder Architecture

### Overview
The Task Reminder system lets users create time-based, relative, and recurring reminders attached to notes, custom text, or URLs. ### SQLite Schema

```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  note_id TEXT REFERENCES notes(id),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT CHECK(type IN ('absolute', 'relative', 'recurring')) NOT NULL,
  trigger_at INTEGER NOT NULL,              -- Unix timestamp
  recurrence_rule TEXT,                      -- RRULE or cron expression
  origin_note_id TEXT REFERENCES notes(id),  -- Relative: reference note
  origin_offset_seconds INTEGER,             -- Relative: offset from origin
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'snoozed', 'cancelled')),
  snoozed_until INTEGER,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_at, status);
CREATE INDEX idx_reminders_note ON reminders(note_id);
```

### Reminder Evaluation Engine

Runs on app start + every 60s while app is active:

1. `SELECT * FROM reminders WHERE trigger_at <= now AND status = 'pending'`
2. For each due reminder: fire in-app notification + desktop notification
3. If `recurrence_rule` set: compute next `trigger_at`, re-insert with status=pending
4. Set current reminder status = 'completed'

### Snooze & Overdue Behaviour

- **Snooze**: User clicks "Snooze 5m/15m/1h" → `snoozed_until = now + N`. Next eval picks it up.
- **Overdue**: Reminder stays visible in notification center with overdue styling after `trigger_at + 1h`.
- **Recurring snooze**: When snoozing a recurring reminder, only affects the current instance; next occurrence unaffected.
- **Cancellation**: Soft delete via `status = 'cancelled'`. Cannot be re-activated.

### UX Integration Points

| Surface | Behaviour |
|---------|-----------|
| Note editor | Slash command `/remind` opens inline reminder picker |
| Reminder list | `/reminders` command or sidebar panel: grouped by Pending/Today/Overdue/Completed |
| Notification toast | Click → open note (if note_id set) or show reminder detail |
| Context menu | Right-click note → "Set reminder" → picker dialog |
| Status bar | Badge with overdue count (Electron tray icon)

---

## MCP Server + HTTP API Architecture

### Overview

Knot exposes **all features** programmatically through two interfaces:

| Interface | Transport | Audience |
|-----------|-----------|----------|
| **MCP Server** | stdio + SSE | AI agents (Claude Code, Cursor, custom MCP clients) |
| **HTTP API** | REST on `:8767` | Any HTTP client, automation scripts, webhooks |

Both interfaces share the same internal service layer — no feature parity gap.

### Architecture Diagram

```
┌─────────────┐     stdio/SSE     ┌──────────────────┐
│  Claude Code │─────────────────→│                  │
├─────────────┤                   │   MCP Server     │
│   Cursor    │─────────────────→│   (localhost)     │
├─────────────┤                   │                  │
│ Custom Agent │─────────────────→│                  │
└─────────────┘                   └────────┬─────────┘
                                           │
┌─────────────┐     HTTP :8767    ┌────────┴─────────┐
│  curl/wget  │─────────────────→│                  │
├─────────────┤                   │   HTTP API       │
│   scripts   │─────────────────→│   (localhost)     │
├─────────────┤                   │                  │
│  webhooks   │─────────────────→│   auth: API key   │
└─────────────┘                   └────────┬─────────┘
                                           │
                              ┌────────────┴────────────┐
                              │     Knot Core Layer      │
                              │  (service layer shared   │
                              │   by MCP + HTTP)         │
                              └────────────┬────────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
              ┌─────┴─────┐         ┌──────┴──────┐        ┌─────┴─────┐
              │  SQLite   │         │ File System │        │  Ollama   │
              │           │         │ (notes/     │        │ (embeddings│
              │           │         │  assets)    │        │  + LLM)   │
              └───────────┘         └─────────────┘        └───────────┘
```

### MCP Server (stdio + SSE)

**Discovery**: Tools advertised via MCP `listTools` capability. Client auto-discovers on connect.

**Tool Catalog** (grouped by feature domain):

| Domain | Tool | Description |
|--------|------|-------------|
| **Notes** | `notes_list` | List all notes |
| | `notes_get` | Get note content by ID |
| | `notes_create` | Create a new note |
| | `notes_update` | Update note content |
| | `notes_delete` | Delete a note |
| | `notes_search` | Full-text search across notes |
| | `tags_list` | List all tags |
| | `tags_add` | Add tag to note |
| | `tags_remove` | Remove tag from note |
| **Semantic** | `semantic_search` | Semantic search query |
| | `semantic_similar` | Find similar notes to a note |
| | `semantic_recommend` | Get AI recommendations |
| **AI** | `ai_chat` | Agentic chat with RAG |
| | `ai_classify` | Classify a note |
| | `ai_summarize` | Summarize a note |
| | `ai_wiki` | Generate wiki article for a tag |
| | `ai_briefing` | Generate daily briefing |
| **Reminders** | `reminder_create` | Create a reminder |
| | `reminder_list` | List reminders (filter by status) |
| | `reminder_snooze` | Snooze a reminder |
| | `reminder_complete` | Mark reminder complete |
| **System** | `system_settings_get` | Get app settings |
| | `system_settings_set` | Update app settings |
| | `system_stats` | Get usage statistics |
| | `system_health` | Health check (Ollama reachable, DB connected) |

**Security**: MCP server listens on `localhost` only. No authentication for stdio transport (local process). SSE transport requires API key header matching the HTTP API key.

**Config** (in `knot.config.json`):
```json
{
  "mcp": { "enabled": true, "port": 8767 },
  "http_api": { "enabled": true, "port": 8767, "api_key": "generate-on-first-start" }
}
```

### HTTP API (REST)

**Base URL**: `http://localhost:8767/api/v1`

**Authentication**: `Authorization: Bearer <api-key>` header on every request. API key generated on first start, stored in `knot.config.json`. User can regenerate from Settings.

**Endpoints**: Every MCP tool is mirrored as an HTTP endpoint:

| Method | Path | MCP equivalent |
|--------|------|----------------|
| GET | `/notes` | `notes_list` |
| GET | `/notes/:id` | `notes_get` |
| POST | `/notes` | `notes_create` |
| PUT | `/notes/:id` | `notes_update` |
| DELETE | `/notes/:id` | `notes_delete` |
| GET | `/notes/search` | `notes_search` |
| GET | `/tags` | `tags_list` |
| POST | `/notes/:id/tags` | `tags_add` |
| DELETE | `/notes/:id/tags/:tag` | `tags_remove` |
| GET | `/semantic/search` | `semantic_search` |
| GET | `/semantic/similar/:id` | `semantic_similar` |
| GET | `/semantic/recommend` | `semantic_recommend` |
| POST | `/ai/chat` | `ai_chat` |
| POST | `/ai/classify` | `ai_classify` |
| POST | `/ai/summarize` | `ai_summarize` |
| POST | `/ai/wiki` | `ai_wiki` |
| POST | `/ai/briefing` | `ai_briefing` |
| GET | `/reminders` | `reminder_list` |
| POST | `/reminders` | `reminder_create` |
| POST | `/reminders/:id/snooze` | `reminder_snooze` |
| POST | `/reminders/:id/complete` | `reminder_complete` |
| GET | `/system/settings` | `system_settings_get` |
| PUT | `/system/settings` | `system_settings_set` |
| GET | `/system/stats` | `system_stats` |
| GET | `/system/health` | `system_health` |

**Response Format**: Standard JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "took_ms": 123 }
}
```

**Rate Limiting**: 60 requests/minute per API key. Burst up to 100. Returned via `X-RateLimit-Remaining` header.

**OpenAPI/Swagger**: Available at `GET /api/v1/openapi.json` (or `/docs` for Swagger UI).

**CORS**: Configurable origins (default `*` for local development, restrict for production use).

### Use Cases

| User | Scenario |
|------|----------|
| Claude Code / Cursor | Connects via MCP stdio. Can read notes, semantic search, chat with context |
| Custom AI agent | Connects via MCP SSE or HTTP. Full read/write to Knot vault |
| Automation script | `curl`/`wget` to HTTP API. E.g., daily briefing → Slack webhook |
| Third-party integration | HTTP API from webhook events. E.g., save starred GitHub issues as notes |

### Future Extensions

- MCP resource templates (`knot://notes/:id`, `knot://tags/:name`)
- WebSocket for real-time note sync
- Python/TypeScript SDK packages
- OAuth for multi-user setups

---

## Plugin System Architecture

### Overview

Plugin system cho phép third-party code mở rộng Knot ở mọi layer. Thiết kế dựa trên 3 nguyên tắc:

1. **Hook-driven**: Plugin không sửa code Knot, chỉ đăng ký hooks vào extension points định sẵn
2. **Permissions-based**: Plugin manifest khai báo quyền, runtime enforced bởi sandbox
3. **MCP-native**: Plugin tự động expose tools qua MCP catalog

### Directory Layout

```
~/.knot/plugins/
├── knot-source-notion/
│   ├── knot-plugin.json        # Manifest
│   ├── main.js                 # Entry point
│   ├── lib/                    # Plugin code
│   ├── assets/                 # Static assets
│   └── data/                   # Plugin-local data (permissions: filesystem:read/write)
├── knot-ai-openai/
│   └── knot-plugin.json
└── knot-export-anki/
    └── knot-plugin.json
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Knot App Process                    │
│                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐  │
│  │ Plugin   │───→│  Extension   │───→│   Core     │  │
│  │ Loader   │    │  Point Bus   │    │ Services   │  │
│  └────┬─────┘    └──────┬───────┘    └──────┬─────┘  │
│       │                 │                    │        │
│  ┌────┴─────┐    ┌──────┴───────┐           │        │
│  │ Plugin   │    │  Hook        │           │        │
│  │ Sandbox  │    │  Pipeline    │           │        │
│  │ (JS/WA)  │    │  (ordered)   │           │        │
│  └────┬─────┘    └──────────────┘           │        │
│       │                                     │        │
│  ┌────┴─────┐    ┌──────────────┐    ┌──────┴─────┐  │
│  │ Plugin A │    │  Plugin B   │    │  MCP Server │  │
│  │ (active) │    │  (active)   │    │  (+plugin   │  │
│  └──────────┘    └──────────────┘    │   tools)   │  │
│                                       └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Hook System Detail

```
Hook Registration Flow:

1. Plugin on_activate() → register hooks
2. Extension Point Bus stores { plugin_id, hook_name, handler, priority }
3. When event fires (e.g., note saved):
   a. Core service emits 'before_note_save' event
   b. Bus collects all registered handlers, sorted by priority
   c. Pipeline executes handlers sequentially:
      - Each handler receives (context, next) — like Express middleware
      - Handler can: modify context, skip(), delegate(), or throw error
   d. Modified context passed to next handler
   e. Final context → core service continues

Hook Priority:
  1-100: System plugins (built-in)
  101-500: User plugins (default 300)
  501-1000: Late-binding plugins
```

### Sandbox Design

```
┌──────────────────────────────────┐
│          Plugin Sandbox           │
│  ┌────────────────────────────┐  │
│  │  QuickJS Runtime           │  │
│  │  (or Boa JS Engine)        │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ Plugin API Gate      │  │  │
│  │  │  - knot.notes.*      │  │  │
│  │  │  - knot.tags.*       │  │  │
│  │  │  - knot.ai.*         │  │  │
│  │  │  - knot.ui.*         │  │  │
│  │  │  - knot.network.*    │  │  │
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  │  Resource Limits:          │  │
│  │  - Max memory: 64MB        │  │
│  │  - Max CPU: 500ms/call     │  │
│  │  - Max network: 10 req/s   │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

**Capability mapping** (manifest permissions → API gate):

| Permission | API Gate Methods |
|---|---|
| `notes:read` | `knot.notes.get(id)`, `knot.notes.search(query)`, `knot.notes.list()` |
| `notes:write` | `knot.notes.create(data)`, `knot.notes.update(id, data)`, `knot.notes.delete(id)` |
| `tags:read` | `knot.tags.list()`, `knot.tags.get(name)` |
| `tags:write` | `knot.tags.create(name)`, `knot.tags.delete(name)` |
| `network` | `knot.network.fetch(url, options)` (rate-limited) |
| `filesystem:read` | `knot.fs.readFile(path)` (scoped to plugin data dir) |
| `filesystem:write` | `knot.fs.writeFile(path, data)` (scoped to plugin data dir) |
| `settings:read` | `knot.settings.get(key)` (plugin settings only) |
| `settings:write` | `knot.settings.set(key, value)` (plugin settings only) |
| `ui` | `knot.ui.createPanel(options)`, `knot.ui.registerCommand(cmd)` |

### Integration with Existing MCP Server

Plugin tools tự động xuất hiện trong MCP catalog:

```
Core tools              Plugin tools
─────────────           ──────────────────
notes_list              plugin.knot-source-notion.sync
notes_get               plugin.knot-source-notion.status
semantic_search         plugin.knot-ai-openai.chat
ai_chat                 plugin.knot-export-anki.export
...                     ...
```

- **Prefix convention**: `plugin.<plugin_id>.<tool_name>`
- **Discovery**: MCP `listTools` merges core tools + active plugin tools
- **Lifecycle**: Plugin enabled → tools added. Plugin disabled → tools removed.
- **Dynamic schema**: Plugin khai báo tool schemas trong manifest hoặc qua `registerTool()` API

### Performance & Security Considerations

- **Cold start**: Plugin JS runtime khởi tạo lazy (khi plugin đầu tiên activate). ~50ms overhead.
- **Hook overhead**: Mỗi hook call thêm ~0.5ms pipeline overhead. Batch hooks nếu không có plugin đăng ký.
- **Sandbox isolation**: Plugin crash không ảnh hưởng main process. Timeout kill sau 5s.
- **Audit log**: Mọi API call từ sandbox đều log: `[plugin:knot-source-notion] notes.get("abc123")`
- **Plugin update safety**: Staged update — download → verify hash → backup old → install → test activate → rollback on fail

---

## Fediverse / Federation Architecture

### Overview

Knot Fediverse cho phép chạy một **central server** làm kho tổng và nhiều **child servers** (trên máy cá nhân) tự động đồng bộ cha↔con. Mỗi Space (môn học, chủ đề) là đơn vị đồng bộ — central lưu tất cả, mỗi child sync chỉ subset được phân quyền.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Space** | Đơn vị tổ chức & sync cơ bản. Mỗi Space là một chủ đề/môn học. |
| **Central Server** | Server tổng, lưu tất cả Spaces, điều phối sync, quản lý phân quyền. |
| **Child Server** | Server con trên máy cá nhân, sync subset Spaces được cấp quyền. |
| **Change Log** | Ordered log của mọi thay đổi. Entity-based (giống Trilium). |
| **Cursor** | Timestamp đánh dấu vị trí đồng bộ. Mỗi child track cursor riêng cho từng Space. |

### Architecture Diagram

```
                     ┌─────────────────────┐
                     │   Central Server     │
                     │  (knot-central)      │
                     │                      │
                     │  ┌────────────────┐  │
                     │  │   All Spaces    │  │
                     │  │  SQLite + FS    │  │
                     │  └───────┬────────┘  │
                     │          │            │
                     │  ┌───────┴────────┐  │
                     │  │  Change Log     │  │
                     │  │  (global log)   │  │
                     │  └───────┬────────┘  │
                     └──────────┼───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
     ┌────────┴────────┐  ┌────┴────┐   ┌────────┴────────┐
     │  Child Server A  │  │ Child B │   │  Child Server C  │
     │  (laptop dev)    │  │ (desk)  │   │  (tablet)        │
     │                  │  │         │   │                  │
     │  Spaces: 1,2,3   │  │ Spaces: │   │  Spaces: 4       │
     │  SQLite + FS     │  │ 2,4,5   │   │  SQLite + FS     │
     └──────────────────┘  └─────────┘   └──────────────────┘
```

### Data Model

```sql
-- Central server tables

CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_space_id TEXT REFERENCES spaces(id),
  owner_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  encryption_key_id TEXT       -- NULL = unencrypted
);

CREATE TABLE space_members (
  space_id TEXT NOT NULL REFERENCES spaces(id),
  server_id TEXT NOT NULL REFERENCES servers(id),
  role TEXT CHECK(role IN ('owner', 'editor', 'viewer')) NOT NULL,
  granted_at INTEGER NOT NULL,
  PRIMARY KEY (space_id, server_id)
);

CREATE TABLE change_log (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id),
  entity_type TEXT NOT NULL,    -- 'note', 'tag', 'attachment', 'embedding'
  entity_id TEXT NOT NULL,
  operation TEXT CHECK(operation IN ('create', 'update', 'delete')),
  data TEXT,                    -- JSON payload (encrypted if E2E)
  author_server_id TEXT REFERENCES servers(id),
  hash TEXT NOT NULL,           -- SHA-256 of (parent_id || data)
  parent_id TEXT REFERENCES change_log(id),
  timestamp INTEGER NOT NULL
);
CREATE INDEX idx_change_log_space ON change_log(space_id, timestamp);

CREATE TABLE conflicts (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id),
  entity_id TEXT NOT NULL,
  change_a_id TEXT NOT NULL REFERENCES change_log(id),
  change_b_id TEXT NOT NULL REFERENCES change_log(id),
  resolution TEXT CHECK(resolution IN ('use_a', 'use_b', 'merged', 'manual')),
  resolved_at INTEGER,
  resolved_by_server_id TEXT REFERENCES servers(id)
);

CREATE TABLE servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,     -- Ed25519 public key
  role TEXT DEFAULT 'child' CHECK(role IN ('central', 'child')),
  registered_at INTEGER NOT NULL,
  last_seen_at INTEGER
);

CREATE TABLE sync_cursors (
  server_id TEXT NOT NULL REFERENCES servers(id),
  space_id TEXT NOT NULL REFERENCES spaces(id),
  cursor INTEGER NOT NULL,      -- max change_log.timestamp đã sync
  PRIMARY KEY (server_id, space_id)
);
```

### Sync Protocol

```
Pull (child → central):
  POST /sync/pull
  {
    "spaces": ["space_1", "space_2"],
    "since_cursor": 1719123456,
    "server_id": "child-server-abc",
    "signature": "edsig_..."    -- signed request
  }
  Response:
  {
    "cursor": 1719129999,
    "changes": [
      { "id": "chg_xxx", "entity_type": "note", "entity_id": "note_123",
        "operation": "update", "data": {...}, "timestamp": 1719129998 },
      ...
    ],
    "conflicts": [...],
    "has_more": false
  }

Push (child → central):
  POST /sync/push
  {
    "server_id": "child-server-abc",
    "changes": [
      { "space_id": "space_1", "entity_type": "note", "entity_id": "note_456",
        "operation": "create", "data": {...}, "parent_hash": "abc123" }
    ],
    "signature": "edsig_..."
  }
  Response:
  {
    "accepted": ["chg_yyy"],
    "conflicts": ["chg_zzz"]   -- returned for manual resolution
  }

WebSocket Events (central → child):
  event: space_updated      { "space_id": "space_1", "changed_by": "server_b" }
  event: conflict_detected  { "space_id": "space_1", "entity_id": "note_123", "conflict_id": "conf_1" }
  event: permission_revoked { "space_id": "space_1", "server_id": "child-server-abc" }
```

### Server Registration Flow

```
1. Child generates Ed25519 key pair (persisted in ~/.knot/fediverse/identity)
2. Child sends POST /register { name, public_key }
3. Central returns { server_id, api_key (write-scoped) }
4. Child stores server_id + api_key
5. Admin assigns spaces via central UI: "Grant server-abc access to space_1, space_2 (role: editor)"
6. Child pulls: GET /sync/pull { spaces: ["space_1"], since_cursor: 0 } → full sync
7. Subsequent pulls: GET /sync/pull { spaces: [...], since_cursor: <last_cursor> } → deltas only
```

### Selective Sync & Permissions

| Role | Permissions |
|------|-------------|
| **owner** | Read/write/delete notes, manage members, manage encryption, delete space |
| **editor** | Read/write notes, re-tag, manage own shadows |
| **viewer** | Read-only. Browse, search, export. No write/delete. |

- **API Keys**: Per-space API keys hoặc signed JWTs scoped to server_id + space_id list
- **Permission check**: Central validates signature + server_id + space_id on every pull/push
- **Revocation**: Central sets space_members.role = NULL → WebSocket push permission_revoked → child removes space data

### Conflict Resolution

| Scenario | Resolution |
|----------|------------|
| Non-overlapping field edits (e.g., A edits title, B edits body) | Auto-merge |
| Same field, same value | Dedup (no conflict) |
| Same field, different value | LWW (later timestamp wins). Logged to `conflicts` table for admin review |
| Delete vs update | Delete wins |
| Network partition (both offline, edit same field) | Both accepted, conflict logged. Admin resolves via UI |

**Manual resolution UI**: Conflict list → select → diff view → "Use A" / "Use B" / "Edit merged version" / "Accept both as separate versions"

### Offline Support

- **Local SQLite** + `change_log` với `status` tracking (`pending` / `synced` / `conflicted`)
- Sync engine runs on app start + every 60s (configurable). Push local changes → Pull remote changes
- **Queue**: Failed pushes retry with exponential backoff (1s → 5s → 30s → 5min → 1h)
- **Connectivity detection**: `navigator.onLine` + periodic health check to central

### Security

| Layer | Mechanism |
|-------|-----------|
| **Transport** | TLS 1.3 (HTTPS/WSS) — bắt buộc cho mọi giao tiếp |
| **Server identity** | Ed25519 key pair. Mỗi request signature-verified. |
| **API auth** | Per-space API keys hoặc signed JWTs |
| **At-rest** | SQLite encryption (SQLCipher) cho node data |
| **E2E (optional)** | Per-space XChaCha20-Poly1305. Key từ passphrase (Argon2id). Central relay-only. |

### E2E Encryption (Optional, Per-Space)

```
Setup:
  1. Owner sets passphrase for space
  2. Key = Argon2id(passphrase, salt) → 256-bit key
  3. Data encrypted before sync: encrypt(change_log.data) with XChaCha20-Poly1305
  4. Central stores encrypted blobs, cannot read content

Multi-editor via asymmetric wrapping:
  1. Each editor has their own Ed25519 key pair
  2. Space key encrypted with each editor's public key
  3. Wrapped keys stored on central alongside space metadata
  4. When editor joins: their public key fetched, space key wrapped, stored
  5. When editor revoked: their wrapped key deleted (space key unchanged)

Metadata options:
  - Full: titles, tags, timestamps encrypted
  - Relaxed (default): timestamps + tags visible, only content encrypted
  - None: no E2E (LWW + TLS only)
```

### Migration Path (Existing User → Federation)

```
1. Export space as SQLite dump: knot export space_1 --format sqlite
2. Child imports: knot import space_1.sqlite
3. Child registers with central: knot federate register --central https://hub.knot.dev
4. Admin assigns space_1 on central
5. First sync: full push of existing data
6. Ongoing: incremental deltas
7. To migrate entire vault: repeat per space
```

### Future Extensions

- **CRDT (Yjs/Automerge)**: Real-time collaborative editing trong cùng Space. v2 after LWW baseline stable.
- **Peer-to-peer sync**: Child-to-child direct sync (Bluesky-style). Bypass central cho Spaces không cần relay.
- **Federation gateway**: Cho phép Knot ↔ Anytype/Trilium import (thông qua Export Plugin API).
- **Public Spaces**: Read-only public view cho selected Spaces (blog-style).

---

## Export Engine System Architecture

### Overview
Export Engine là core service quản lý việc render notes ra nhiều định dạng (image/Word/PDF/PPTX/SVG) với template system, job queue, và API-first design. Tích hợp sâu với MCP Server (#55) và Export Plugin API (#63) để external tools có thể gọi export programmatically.

### Core Components

```
┌─────────────────────────────────────────────────────┐
│                   Export Engine                      │
│                                                      │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐   │
│  │ Template  │  │  Render    │  │   Job Queue    │   │
│  │ Manager   │──│  Pipeline  │──│   (Background) │   │
│  └──────────┘  └─────┬──────┘  └────────────────┘   │
│                      │                               │
│         ┌────────────┼────────────┐                  │
│         ▼            ▼            ▼                  │
│  ┌───────────┐ ┌─────────┐ ┌──────────┐            │
│  │ PPTX      │ │ DOCX    │ │ PDF/Img  │             │
│  │ Renderer  │ │ Renderer│ │ Renderer │             │
│  │(python-   │ │(python- │ │(Play-    │             │
│  │ pptx/     │ │ docx)   │ │ wright/  │             │
│  │ Presenton)│ │         │ │ Pillow)  │             │
│  └───────────┘ └─────────┘ └──────────┘            │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         MCP Tools / HTTP API Layer            │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │
         ▼
  External Tools (Claude Code, Cursor, scripts...)
```

### Template Manager

- **Template storage**: SQLite `export_templates(id, name, format, file_path, thumbnail, placeholders[], brand_theme_id, created_at, updated_at)`
- **Template discovery**: `GET /api/export/templates` returns all templates, filterable by format
- **Upload flow**: User uploads file → AI phân tích structure → extract `{{placeholder}}` positions → save as reusable template
- **Placeholder system**:
  - Built-in: `{{title}}`, `{{content}}`, `{{tags}}`, `{{created_at}}`, `{{author}}`
  - Custom: `{{custom_field}}` — mapped từ note properties
  - Conditional: `{{#if image}}` / `{{/if}}` blocks
- **Brand themes**: JSON config `{ fonts: { heading: "Inter", body: "Inter" }, colors: { primary: "#...", secondary: "#..." }, logo_url: "..." }`

### Render Pipeline

1. **Input**: Note ID + format + template ID (optional) + options (page size, DPI, etc.)
2. **AST Generation**: Note Markdown → parsed AST (headings, paragraphs, code blocks, lists, images, tables, math)
3. **Template Binding**: AST merged with template placeholders + brand theme
4. **Format Rendering**:
   - **PPTX**: python-pptx builds slides from AST sections. Each heading = new slide title, content = slide body. Images embedded. Template PPTX as base (giữ nguyên slide master, colors, fonts).
   - **DOCX**: python-docx renders AST into document. Template DOCX as base với {{placeholder}} replacement.
   - **PDF**: WeasyPrint renders HTML+CSS from AST. Custom CSS layout templates. Supports headers/footers, page numbers, TOC.
   - **Image**: Playwright renders HTML card → PNG/JPEG/WebP screenshot. Options: width, background color/transparent, card style (compact/full note).
   - **SVG**: AST → structured SVG with typography rendering. Embeddable in whiteboard canvas.
5. **Output**: File bytes returned directly (small) or saved to temp storage + job_id returned (large/batch)

### Presenton Integration

- **Optional PPTX backend**: Knot cấu hình Presenton API endpoint + API key
- **Flow**: Knot AST → Presenton API request (topic, slides structure) → Presenton returns PPTX bytes
- **Fallback**: Nếu Presenton không available, dùng native python-pptx engine
- **Benefit**: Presenton handles AI slide generation (layout, imagery, design) — Knot just provides content structure
- **Config**:
  ```yaml
  export:
    pptx:
      engine: "presenton"  # or "native"
      presenton_url: "http://localhost:5000"
      presenton_api_key: "..."
      presenton_template_id: "default"
  ```

### Batch Export & Job Queue

- **Batch endpoint**: `POST /api/export/batch` with array of note_ids + format + options
- **Bundling strategies**:
  - `single_file`: Tất cả notes → 1 file (PPTX / DOCX — mỗi note là 1 slide/1 section)
  - `zip`: Mỗi note → 1 file → ZIP bundle
  - `presentation`: Notes grouped into slides by tags → 1 PPTX
- **Job tracking**:
  - `export_jobs(id, status, format, note_ids[], file_path, error, created_at, completed_at)`
  - `GET /api/export/status/:job_id` returns progress %
  - SSE stream: `/api/export/stream/:job_id` — real-time progress updates
- **Resource limits**: Max 50 notes per batch, max 100MB per output file, 5 concurrent jobs per user

### MCP Tool Catalog (Export Domain)

| Tool | Description |
|------|-------------|
| `export.render` | Render single note to format. Returns file bytes + metadata |
| `export.list_templates` | List available templates, filterable by format |
| `export.upload_template` | Upload file as reusable template. Returns template_id + extracted placeholders |
| `export.batch` | Batch export multiple notes. Returns job_id for status polling |
| `export.delete_template` | Remove a registered template |
| `export.formats` | List supported export formats + their options |

### HTTP API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/export/render` | Render single note |
| POST | `/api/export/batch` | Batch export |
| GET | `/api/export/templates` | List templates |
| POST | `/api/export/templates` | Upload template |
| DELETE | `/api/export/templates/:id` | Delete template |
| GET | `/api/export/templates/:id` | Get template details |
| GET | `/api/export/status/:job_id` | Get job status |
| GET | `/api/export/stream/:job_id` | SSE progress stream |
| GET | `/api/export/formats` | List supported formats |

### Security & Rate Limiting

- **Auth**: API key required (same as MCP Server #55), scoped per-user
- **Rate limits**: 60 export renders/min per user, 10 batch exports/min
- **File size**: Max 100MB per export, max 50MB per template upload
- **Storage**: Temp files auto-deleted after 24h (configurable)
- **Format restrictions**: External renderers (Presenton) called server-side only — no client-side API key exposure

### Integration with Plugin System

- **Export Plugin API (#63)**: Plugin đăng ký format mới qua:
  ```python
  class MyExportPlugin(ExportPlugin):
      format_name = "my_format"
      mime_type = "application/x-my-format"
      async def export(self, note_data: NoteAST, options: dict) -> bytes:
          # custom rendering logic
          return file_bytes
  ```
- **Plugin lifecycle**: Plugin enable → format auto-appears in `/api/export/formats` + MCP catalog
- **MCP tool prefix**: `plugin.<plugin_id>.export.<tool_name>`

### Future Extensions

- **Template marketplace**: Community-shared templates, installable via Plugin Store
- **Google Slides export**: Via Google Slides API (Export Provider Plugin)
- **Keynote export**: Via AppleScript or Keynote automation
- **Template gallery UI**: Visual template picker with preview thumbnails
- **AI template suggestion**: LLM tự động chọn template phù hợp dựa trên note content + format
- **Auto-export rules**: User-defined rules (e.g., "notes tagged #weekly auto-export to PPTX every Friday")


## 10. Spaced Repetition Flashcards (#26)

- **What**: Transform notes into flashcards with spaced repetition scheduling (FSRS v5 algorithm). Cards are auto-generated from note headings (heading → front, content → back) or created manually as Q&A pairs.

- **FSRS v5 Algorithm**: Parameters: stability (S), difficulty (D), retrievability (R). After each review + rating, (S, D) are updated via the FSRS recall/multichoice formulas. Next due = now + interval(S).

- **Review Workflow**:
  1. Show card front (user recalls answer)
  2. Reveal card back
  3. Rate 1-4: Again (fail) / Hard / Good / Easy
  4. Scheduler computes next interval
  5. Card marked `due` at new timestamp

- **Data Model**:
  ```
  cards: id, note_id, source_doc_id, card_type (auto/manual),
         front (text), back (text),
         stability, difficulty, retrievability,
         due_at, review_count, last_reviewed_at
  reviews_history: card_id, rating, elapsed_days,
                   review_date, stability_before, difficulty_before
  ```
- **Card Generation**: Auto-mode: heading depth = deck. `##` = deck name, paragraph = back. Manual-mode: `/flashcard` command or right-click → "Create Flashcard".

- **Integration Points**:
  - **#24 Daily Briefing**: Include "cards due today" count + preview
  - **#52 Notification System**: Push notification when cards due
  - **Priority Queue**: Batch card scheduling + due reminders
  - **#49 Auto-Link Discovery**: Link flashcards back to source note
  - **#22 Agentic Chat**: "Quiz me on these cards" via chat

- **Review UI**: Dedicated review view (sidebar or full-width) showing front → reveal → rating buttons. Progress bar: X/Y reviewed today.

- **Storage**: SQLite `cards` + `reviews_history` tables. Exportable as Anki APKG for interoperability.


## 11. Scheduled Reports (#27)

- **What**: Cron-based recurring AI-generated summaries of user notes. Scheduled reports convert daily/weekly/monthly note collections into digestible reports delivered via email, in-app notification, or exported document.

- **Schedule Config**: Each report has:
  - `cron_expr` — cron expression (e.g., `0 8 * * 1` for Monday 8 AM)
  - `scope` — which notes to include (tag filter / folder / project / query)
  - `template` — output format (digest HTML / markdown / PDF)
  - `destination` — delivery target (email SMTP / in-app / auto-export)
  - `llm_prompt` — custom summarization instruction (default: "summarize key insights")

- **Report Generation Pipeline**:
  1. **Trigger**: Priority Queue wakes at cron time, pushes `ReportGenerate` job
  2. **Query**: Fetch notes matching scope from search index
  3. **Aggregate**: Group by tag/date/project, deduplicate, sort by relevance
  4. **Summarize**: LLM generates summary from aggregated notes
  5. **Format**: Apply template → produce HTML/MD/PDF
  6. **Deliver**: Send via channel (email / in-app / export-to-doc)
  7. **Archive**: Store in `report_history` table

- **Data Model**:
  ```
  report_schedules: id, name, cron_expr, scope (JSON),
                    template, destination, llm_prompt,
                    enabled, last_run_at, next_run_at
  report_history: id, schedule_id, generated_at,
                  status (ok/error), output_type,
                  delivery_summary, content_preview
  ```

- **Integration Points**:
  - **#24 Daily Briefing**: Scheduled reports can extend or replace the daily briefing
  - **Priority Queue**: Cron scheduling via persistent cron→queue bridge
  - **#21 Auto-Tagging**: Reports can be auto-tagged with `#weekly-report` etc.
  - **#69 Export Engine**: PDF/HTML output uses Export Engine renderers
  - **#52 Notification System**: Sends delivery notification + link

- **Cron→Queue Bridge**:
  ```
  schedule table ──► cron watcher (every 60s check next_run_at)
                    ──► PriorityQueue.enqueue(ReportGenerate{schedule_id})
                    ──► worker generates + delivers
                    ──► update next_run_at
  ```

- **Future**: Recurring meeting notes summary, auto-timesheet, weekly knowledge digest.


## 12. AI Second Knowledge (#28)

- **What**: A 5-layer system that builds persistent AI-generated knowledge layers on top of user notes. Each layer is computed asynchronously and evolves as notes change, providing deeper context, relationships, and temporal awareness.

### Layer 1: Shadow Docs
- **Purpose**: AI-generated companion documents that expand on note content — summaries, Q&A banks, related concepts, reading lists.
- **Architecture**:
  1. User writes/edits a note → trigger `ShadowDocUpdate` event
  2. Priority Queue picks up event, calls LLM with note content + shadow prompt
  3. LLM returns structured shadow: `{summary, qa_pairs, related_concepts, reading_list}`
  4. Stored as JSON in `shadow_docs` table, linked to source note
  5. Re-computed only when note changes (content hash comparison)
- **UI**: Collapsible "Shadow Doc" section at bottom of note view. Show/hide toggle. Editable (user can adjust AI output).
- **Storage**: `shadow_docs: id, note_id, content_hash, shadow_json, generated_at`

### Layer 2: Relation Graph
- **Purpose**: Deep semantic relationship detection beyond explicit wiki-links. Discovers thematic, temporal, and structural connections between notes.
- **Architecture**:
  1. Batch job (Nightly/weekly) embeds all notes via text embedding model
  2. Compute similarity matrix between note vectors
  3. Threshold-based edge creation (cosine > 0.75 → relation `strong`, > 0.6 → `weak`)
  4. Store edges in `knowledge_graph` table
  5. Types: `semantic_similar`, `temporal_sequence`, `topic_complement`, `contradiction`
- **UI**: Graph visualization (force-directed layout) in the AI Insights Panel. Hover shows relation type + score.
- **Storage**: `knowledge_graph: source_note_id, target_note_id, relation_type, score, discovered_at`

### Layer 3: Glossary
- **Purpose**: Auto-extract key terms, acronyms, and definitions from user notes into a searchable glossary.
- **Architecture**:
  1. Periodic batch job (or on-demand via MCP)
  2. Extract candidate terms using NLP (noun phrase extraction + frequency analysis)
  3. Filter: cross-reference across notes → if term appears in 3+ notes, promote to glossary
  4. LLM generates definition from context
  5. Store in `glossary_terms` table
  6. User can add/remove/edit terms manually
- **Integration**:
  - **#22 Agentic Chat**: Chat can reference glossary terms automatically
  - **#23 Wiki Synthesis**: Glossary feeds into Wiki page generation
  - **#21 Auto-Tagging**: Terms can become tag suggestions
- **Storage**: `glossary_terms: id, term, definition, aliases (JSON), source_note_ids, verified (bool)`

### Layer 4: Temporal Delta
- **Purpose**: Track what changed in the knowledge base over time — "what's new this week?" — providing a change-log at the semantic level.
- **Architecture**:
  1. Snapshot note corpus at configurable intervals (daily/weekly)
  2. Compute diff: new notes, deleted notes, significantly changed notes (by content hash)
  3. LLM generates weekly digest: "**New**: 5 notes about Rust async. **Updated**: Project X roadmap."
  4. Store in `temporal_deltas` table
- **Integration**:
  - **#24 Daily Briefing**: Temporal delta becomes the "changes since last briefing" section
  - **#27 Scheduled Reports**: Delta is the core content of weekly reports

### Layer 5: Agent Context Cache
- **Purpose**: Pre-computed context bundles for faster, cheaper AI responses. Instead of re-scanning all notes, Agent Context Cache provides relevant context instantly.
- **Architecture**:
  1. Define "context profiles" (tag-based / project-based / time-window-based)
  2. For each profile, periodically compute: relevant note summaries + entity graph + recent changes
  3. Store as serialized context in `agent_context_cache` table
  4. On AI request: match request to context profile → serve pre-computed context
  5. Invalidate cache on note change (event-driven)
- **Storage**: `agent_context_cache: profile_id, context_blob (JSON), generated_at, expires_at, hit_count`

### Cross-Layer Integration
| Layer | Trigger | Frequency | Consumed By |
|-------|---------|-----------|-------------|
| Shadow Docs | Note change | On-demand | #22 Chat, #25 Similar Notes |
| Relation Graph | Batch | Nightly | #23 Wiki, #49 Auto-Link |
| Glossary | Batch | Weekly | #22 Chat, Search |
| Temporal Delta | Batch | Daily/Weekly | #24 Briefing, #27 Reports |
| Agent Context Cache | Note change + Batch | On-invalidation | #22 Chat, MCP API |


## 13. AI Insights Panel (#29)

- **What**: A dedicated UI panel that surfaces all AI activity in the app — what AI has tagged, summarized, suggested, generated. Provides transparency, control, and discoverability.

- **Panel Layout**:
  - **Activity Feed** (timeline): Real-time stream of AI actions: "Auto-tagged 3 notes", "Wiki 'Rust Async' updated", "5 flashcards due", "Briefing generated"
  - **Stats Cards**: Cards today, wiki pages, glossary terms, relation graph size, monthly AI actions
  - **Widget Area**: User-configurable widgets:
    - "Upcoming Flashcards" — next 5 due cards
    - "Recent Shadow Docs" — last 3 generated shadow docs
    - "Scheduled Reports Status" — next report time, last report preview
    - "Relation Graph Mini" — small force-directed graph view
  - **Action Log**: Full searchable history of all AI actions with undo capability

- **Data Flow**:
  ```
  AI action ──► action_log table ──► WebSocket push
                                    ──► Insights Panel (reactive)
  ```
- **Action Log Schema**:
  ```
  ai_actions: id, action_type (tag/wiki/briefing/glossary/relation/shadow/...),
              target_id, target_title, summary, user_dismissed (bool),
              created_at, undone_at (nullable)
  ```
- **Undo Support**: Each action type registers an undo handler. E.g., undo auto-tag → remove tag + log. Undo window: 30 seconds (configurable).

- **Widget System**:
  - Each widget is a mini-dashboard component
  - Widget registry: `{id, label, icon, default_position, component}`
  - User can add/remove/reorder widgets in panel settings
  - Widgets can be AI-generated from natural language ("Show me my tagging stats this week")

- **Integration Points**:
  - **All AI features (#21-#29, #47-#51)**: Every AI action publishes to the panel
  - **#52 Notification System**: Panel replaces notification center for AI events
  - **#22 Agentic Chat**: Chat can query panel data ("What did AI do yesterday?")
  - **MCP API**: Panel data accessible via MCP tools (`mcp_panel_stats`, `mcp_panel_actions`)
  - **#69 Export Engine**: Export panel report as "AI Activity Summary"

- **UI Implementation**: Slide-out panel from right side (CMD+I shortcut). Same pattern as VS Code AI panel. Tabs: Feed / Stats / History.


## 14. Voice Notes (#45)

- **What**: Record voice memos and auto-transcribe them into formatted notes using Whisper STT (speech-to-text). Supports browser microphone capture, file upload, and mobile recording via PWA.

- **Audio Capture Pipeline**:
  ```
  [Desktop] Web Audio API ──► Audio blob (WebM/Opus)
  [Mobile]  PWA MediaRecorder ──► Audio blob
  [Upload]  File input (.mp3/.wav/.m4a) ──► Audio blob
                                   │
                                   ▼
                            Whisper STT ──► raw_text
                                   │
                                   ▼
                     Post-processing pipeline
                         ├── #21 Auto-Tagging
                         ├── #50 Auto-Template Matching
                         └── Speaker diarization (future)
                                   │
                                   ▼
                           Markdown note
  ```

- **Whisper Integration**:
  - **Local mode**: Whisper.cpp (ONNX runtime, runs on CPU/GPU) — privacy-first, no data leaves device
  - **API mode**: OpenAI Whisper API or compatible endpoint — for high accuracy
  - **Configurable**: User chooses mode in settings. Fallback: local → API on error.
  - **Language**: Auto-detect or manual selection. Default: system locale.
  - **Model size**: tiny/base/small/medium/large — configurable (default: base for speed)

- **Post-Processing**:
  1. Raw transcript cleaned (punctuation, paragraph breaks by silence detection)
  2. **#21 Auto-Tagging**: Extract keywords → suggest tags
  3. **#50 Auto-Template Matching**: Match to note template (meeting note / idea / journal)
  4. **#22 Agentic Chat**: Optional "enhance transcript" — fix grammar, add structure
  5. **Result**: Formatted markdown note with optional audio attachment

- **Data Model**:
  ```
  voice_notes: id, title, duration_sec, audio_blob_id,
               transcript_raw, transcript_enhanced,
               whisper_model, language, processing_time_ms,
               status (recording/processing/done/error),
               created_at
  ```
  Final note stored as regular note with `source: voice` property + link back to `voice_notes` record.

- **Recording UX**:
  - Floating microphone button (bottom-right, like WhatsApp voice note)
  - Hold-to-record or tap-to-start/tap-to-stop
  - Visual waveform during recording
  - Processing spinner during transcription
  - Result preview → user edits → save as note

- **Integration Points**:
  - **#52 Notification System**: Notify when transcription complete
  - **#42 Quick Capture**: Voice notes appear in Quick Capture inbox
  - **#21 Auto-Tagging**: Transcript auto-tagged on completion
  - **#50 Auto-Template**: Meeting voice notes auto-apply meeting template
  - **#22 Agentic Chat**: "Summarize my voice note from yesterday"
  - **#41 Outliner Mode**: Transcript can be converted to outline
  - **#69 Export Engine**: Export voice note transcript to PDF/DOCX with audio link

## 15. CRDT Real-Time Collaboration (#36)

- **What**: Real-time collaborative editing using Conflict-Free Replicated Data Types (CRDT). Multiple users can edit the same note simultaneously with automatic conflict resolution. Built on Yjs (CRDT library) with WebSocket sync transport.

- **Architecture**:
  ```
  ┌─────────────────────────────────────────────────────┐
  │                  Client A (User 1)                   │
  │  Local Y.Doc ←── Yjs ←── Editor Binding (ProseMirror)│
  └─────────────┬───────────────────────────────────────┘
                │ WebSocket (sync protocol)
  ┌─────────────▼───────────────────────────────────────┐
  │              Sync Server (collab.y-websocket)         │
  │  ┌──────────┴──────────┐                             │
  │  │ Awareness (presence) │── who's online, cursors    │
  │  │ State Vector       │── what each client has      │
  │  └────────────────────┘                             │
  │              │                                       │
  └──────────────┬──────────────────────────────────────┘
                 │
  ┌──────────────▼──────────────────────────────────────┐
  │                  Client B (User 2)                   │
  │  Local Y.Doc ←── Yjs ←── Editor Binding (ProseMirror)│
  └─────────────────────────────────────────────────────┘
  ```

- **Yjs CRDT Properties**:
  - **No central authority**: Every client can merge edits without a master copy
  - **Automatic conflict resolution**: Concurrent edits to the same text merge cleanly (operational transformation via Yjs internal algo)
  - **State Vector based sync**: Clients exchange only missing operations, not full document
  - **Offline support**: Edits made offline merge when reconnected

- **Data Flow**:
  1. User types → Yjs captures as CRDT operation (insert/delete)
  2. Operation stored in local Y.Doc + broadcast to sync server
  3. Sync server forwards to all other connected clients
  4. Each client applies operation to local Y.Doc → editor binding updates UI
  5. Periodic persistence: Y.Doc snapshot saved to SQLite as binary blob

- **Presence (Awareness)**:
  - Who's viewing: user avatar + name in editor header
  - Cursor positions: colored cursors with user label
  - Selection highlights: colored background on selected text
  - Protocol: Yjs Awareness Protocol (BPER extension) over same WebSocket

- **Conflict Resolution Strategy**:
  | Scenario | Resolution |
  |----------|-----------|
  | Same word, concurrent edit | Both inserts preserved (character-level merge) |
  | Delete vs edit | Delete wins (Yjs tombstone) |
  | Offline edits overlap | Merged on reconnect via state vector diff |
  | Network partition | Each partition edits independently, merge on heal |

- **Sync Server**:
  - Built as standalone Node.js process (or embedded in main backend)
  - Rooms: one room per note/document
  - Authentication: validate JWT on connect, reject unauthorized
  - Scaling: horizontal via Redis pub/sub (multiple sync server instances)
  - Persistence: Y.Doc snapshots saved to SQLite every 30s (configurable) or on all-clients-disconnect

- **Storage**:
  ```
  collab_docs: doc_id, y_doc_blob (binary), version,
               last_synced_at, connected_clients (int)
  collab_awareness: doc_id, user_id, cursor_pos (JSON),
                    last_seen_at (ephemeral, in-memory)
  ```

- **Integration Points**:
  - **#35 Scripting API**: Scripts can observe real-time edits via Yjs events
  - **#22 Agentic Chat**: Chat can join a document context in real-time
  - **#52 Notification System**: Notify when another user starts editing your document
  - **#69 Export Engine**: Export snapshot of collaborative document state
  - **#46 Git Backup**: CRDT snapshots don't replace git — git commits represent intentional saves, CRDT handles real-time sync

- **Offline & Reconnection**:
  - Local edits queued in IndexedDB (browser) / SQLite (desktop)
  - On reconnect: exchange state vectors → send missing operations
  - No edit lost: CRDT ensures eventual consistency

- **Self-Hosted Sync Server**: Optional — user can run their own sync server via Docker image. Default: use Knot cloud sync.

- **Threat Model**:
  - Unauthorized room join → JWT per-room validation + key rotation
  - Malicious merge → operation validation (type checking, size limits)
  - Data exfiltration → end-to-end encryption optional layer


## 16. Scripting API (#35)

- **What**: JavaScript scripting engine that lets users automate Knot via custom scripts. Scripts can read/write notes, trigger AI actions, hook into events, and extend the UI. Powered by a sandboxed QuickJS runtime.

- **Architecture**:
  ```
  User Script (.js) ──► QuickJS Sandbox
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Knot API       Event Hooks    UI Extensions
         (read/write)   (onCreate,     (Sidebar panels,
          notes, tags,   onTag,         custom views)
          search)        onCron)
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                     Knot Core (Rust/TS)
  ```

- **Runtime**:
  - **QuickJS** (embedded JS engine): Fast startup, small memory, ES2020 support
  - **Sandbox**: No filesystem, no network (limited whitelist), memory limit (128MB default), timeout (5s default)
  - **API surface**: Exposed via global `knot` object
    ```
    knot.notes.get(id) / query(filter)
    knot.notes.create(content, tags, properties)
    knot.tags.list() / add(name) / remove(id)
    knot.search.query(text, options)
    knot.ai.summarize(text) / tag(text) / ask(prompt)
    knot.ui.showToast(message) / createPanel(config)
    knot.schedule.cron(expr, handler)
    knot.mcp.call(tool, params)
    knot.export.to(format, notes)
    ```

- **Script Lifecycle**:
  1. **Register**: User creates or imports a `.js` file → stored in `scripts` table
  2. **Hooks**: Script declares `knot.on('event', handler)` at top level
  3. **Execute**: QuickJS instantiates + runs handlers on matching events
  4. **Unload**: On script edit/delete → old instance garbage collected
  5. **Hot-reload**: Script changes apply without restart

- **Event Hooks**:
  | Event | Fires When | Handler Receives |
  |-------|-----------|-----------------|
  | `note:created` | Note created | `{id, title, content, tags}` |
  | `note:updated` | Note saved | `{id, changes}` |
  | `note:deleted` | Note deleted | `{id}` |
  | `tag:added` | Tag applied | `{noteId, tag}` |
  | `cron:minute` | Every minute | `{timestamp}` |
  | `cron:hourly` | Every hour | `{timestamp}` |
  | `cron:daily` | Every day at 00:00 | `{date}` |
  | `ai:action` | AI completes an action | `{action, result}` |
  | `app:startup` | App launches | `{version}` |
  | `app:shutdown` | App quits | `{}` |

- **Script Storage**:
  ```
  scripts: id, name, version, source_code, enabled,
           registered_hooks (JSON array),
           created_at, updated_at
  script_logs: id, script_id, event, executed_at,
               duration_ms, success, error (nullable)
  ```

- **Security**:
  - **Sandbox isolation**: QuickJS in separate worker thread + Wasm sandbox
  - **No FS/Network**: Explicitly denied. File read/write only through `knot.export` / `knot.import`
  - **Rate limiting**: Max 100 API calls per script per minute
  - **Timeout**: Default 5s per handler, configurable per script
  - **Permission system**: User grants API categories on install (read / write / ai / ui / schedule)
  - **Audit log**: Every API call logged to `script_logs`

- **UI for Scripts**:
  - **Script Manager**: List of installed scripts with enable/disable toggle
  - **Editor**: Built-in code editor (CodeMirror) with syntax highlighting
  - **Marketplace**: Download scripts from Community Store (future)
  - **Log Viewer**: Per-script execution log with errors, timestamps, filter

- **Use Cases**:
  - Auto-backup notes to GitHub on save
  - Daily note template with weather + calendar
  - Custom import/export format converter
  - Slack/Discord webhook notifier on tag
  - Periodic cleanup of empty notes

- **Integration Points**:
  - **#36 CRDT**: Scripts can observe collaborative editing events
  - **#22 Agentic Chat**: "Run my cleanup script" via chat invocation
  - **#56-#64 Plugin System**: Scripting API is the foundation for plugin hooks
  - **#30 RSS Feeds**: Script can poll RSS and create notes
  - **#69 Export Engine**: Scripts can define custom export formats


## 17. Task Management / Kanban (#37)

- **What**: Full Kanban board inside Knot — create, organize, and track tasks across columns. Each note or manual card becomes a task with status, assignee, due date, priority, labels, and checklist. Supports board view, list view, and timeline (Gantt) view.

- **Architecture**:
  ```
  ┌──────────────────────────────────────────────────────┐
  │                    Kanban Board                        │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
  │  │  To Do    │  │ In Progress│  │  Review   │  │  Done    ││
  │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ ││
  │  │ │Card 1│ │  │ │Card 2│ │  │ │Card 3│ │  │ │Card 4│ ││
  │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ │  │ └──────┘ ││
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
  └──────────────────────────────────────────────────────┘
         ▲              ▲              ▲              ▲
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                    tasks table (all cards)
  ```

- **Data Model**:
  ```
  task_boards: id, name, description, columns (JSON: [{id, title, wip_limit?}]), 
               created_at, updated_at
  task_cards: id, board_id, column_id, note_id (nullable),
              title, description, priority (low/medium/high/urgent),
              assignee, due_date, labels (JSON), checklist (JSON),
              position (float), start_date, estimated_hours,
              created_at, updated_at
  ```

- **Columns**: Default: To Do / In Progress / Review / Done. Fully customizable — user can add, rename, reorder, delete columns.

- **Views**:
  - **Board**: Drag-and-drop cards between columns. WIP limits per column
  - **List**: Flat list with sort/filter (priority, due date, assignee, labels)
  - **Timeline (Gantt)**: Cards with start_date + due_date displayed on calendar timeline
  - **Calendar**: Cards with due_date on a month/week calendar view

- **Card Types**:
  - **Note-linked**: Right-click on any note → "Convert to Task" → creates card linked to note
  - **Manual**: Create standalone task card in board directly
  - **Auto**: From AI (#54 Task/Work Reminders, #27 Scheduled Reports)

- **Kanban Features**:
  - **Drag-and-drop**: Move cards between columns (HTML5 DnD API)
  - **Inline editing**: Click card title to edit, click + to add new card
  - **Quick filters**: By assignee, priority, label, due date range
  - **Batch actions**: Select multiple cards → move, tag, assign, delete
  - **WIP limits**: Per-column max card count, visual warning when exceeded
  - **Card comments**: Threaded comments on each card
  - **Activity log**: Per-card history (moved, edited, assigned)

- **Integration Points**:
  - **#54 Task/Work Reminders**: Reminders create task cards + due dates
  - **#42 Quick Capture**: Quick Capture items become "To Do" cards
  - **#27 Scheduled Reports**: Report schedules tracked as recurring task cards
  - **#52 Notification System**: Notify on due date approaching, card assignment
  - **#69 Export Engine**: Export board as CSV, Markdown table, or PDF
  - **#35 Scripting API**: Scripts can create/move cards programmatically
  - **MCP API**: Board accessible via MCP tools (list, create, move cards)

- **Storage**: SQLite `task_boards` + `task_cards` tables. Position is fractional index (BlockSuite-style) for O(1) reordering.


## 18. Quick Capture (#42)

- **What**: Universal inbox for quickly capturing thoughts, links, images, files, and voice memos into Knot from anywhere — browser extension, share sheet, floating widget, CLI, and email. Items land in the Inbox for later processing.

- **Capture Sources**:
  ```
  ┌────────────┐    ┌────────────┐    ┌────────────┐
  │ Browser Ext│    │ Share Sheet│    │  Widget    │
  │ (Chrome/Fx)│    │ (iOS/Android)│   │ (Desktop)  │
  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                   Inbox API Endpoint
                           │
                    ┌──────┴──────┐
                    │ Queue (fast) │
                    └──────┬──────┘
                           ▼
                    Inbox Processing
                    ├── OCR (image)
                    ├── Markdown (clip)
                    ├── Whisper (voice)
                    └── Categorize (#21)
                           ▼
                        Inbox
  ```

- **Supported Capture Types**:
  | Source | Format | Processing |
  |--------|--------|-----------|
  | Browser extension | URL + selection text + screenshot | Extract title, convert to markdown, add source URL |
  | Share sheet | Text / Image / URL / File | Detect type, route to processor |
  | Desktop widget | Text / Voice | Global hotkey (CMD+SHIFT+Q) → popup input |
  | Mobile widget | Text / Voice / Photo | OS share extension + notification-based |
  | CLI | Pipe stdin / `knot capture "text"` | Auto-capture from terminal |
  | Email | Forward to inbox@knot.app | Parse email → note with sender metadata |
  | Drag-and-drop | File(s) dropped on app | Detect type, process async |

- **Inbox Data Model**:
  ```
  inbox_items: id, source (extension/share/widget/cli/email/drag),
               capture_type (text/link/image/file/voice),
               raw_content, processed_content,
               preview_url (for links), thumbnail_url (for images),
               file_size, mime_type,
               status (pending/processing/done/error),
               suggested_tags (JSON), suggested_template,
               created_at, processed_at
  ```

- **Desktop Widget**:
  - Global hotkey: CMD+SHIFT+Q (configurable)
  - Small popup overlay (centered, 400x300px):
    - Text input area (auto-focus on open)
    - Voice button (for quick voice note)
    - Submit → pushes to Inbox queue
    - Closes automatically on submit
  - Stays on top of other windows
  - Minimizes to tray icon

- **Browser Extension**:
  - **Action**: Click extension icon → capture current page
  - **Context menu**: Right-click link/text → "Capture to Knot"
  - **Output**: Title + URL + selected text (if any) + screenshot (optional)
  - **Auth**: API token stored in extension settings
  - **Status**: Desktop app must be running (WebSocket connection) or use cloud relay

- **Processing Pipeline**:
  1. Raw capture arrives at Inbox API
  2. Type detection: text/link/image/file/voice
  3. If image: OCR (Tesseract.js or AI Vision)
  4. If voice: Whisper STT (#45)
  5. If link: Open Graph metadata extraction (title, description, image)
  6. **#21 Auto-Tagging**: Suggest 3-5 tags based on content
  7. **#50 Auto-Template Matching**: Match content to template (recipe, article, idea, task)
  8. Store in `inbox_items` with status=done
  9. **#52 Notification**: "Item captured → Inbox"

- **Integration Points**:
  - **#21 Auto-Tagging**: Every capture auto-tagged on arrival
  - **#50 Auto-Template Matching**: Content-aware template suggestion
  - **#45 Voice Notes**: Voice capture routed to Whisper STT
  - **#52 Notification System**: Toast "Captured to Inbox" on success
  - **#37 Task Management**: Quick Capture items can convert directly to task cards
  - **#69 Export Engine**: Batch process inbox items → export
  - **#35 Scripting API**: Scripts can hook `capture:received` event

- **Inbox UI**:
  - Separate "Inbox" view in sidebar (badge with unread count)
  - List view: item source icon + preview line + timestamp
  - Click → expand to full preview + suggested tags/template
  - Quick actions: Process now / Archive / Delete / Convert to task
  - Batch select → process/archive/delete multiple items


## 19. RSS Feeds (#30)

- **What**: Built-in RSS/Atom feed reader that auto-imports articles as notes. Users subscribe to feeds, and new articles are periodically fetched, converted to clean markdown, and stored as notes with source metadata.

- **Architecture**:
  ```
  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
  │ RSS Source 1 │───►│              │    │              │
  │ RSS Source 2 │───►│  Feed Fetcher │───►│  Parse +      │
  │ RSS Source 3 │───►│  (cron + queue)│   │  Clean (Read) │
  └─────────────┘    └──────────────┘    └──────┬───────┘
                                                │
                                          ┌─────▼───────┐
                                          │ Auto-Tag (#21)│
                                          │ + Metadata    │
                                          └─────┬───────┘
                                                │
                                          ┌─────▼───────┐
                                          │  Create Note  │
                                          │  (source: rss) │
                                          └─────────────┘
  ```

- **Feed Config**: User adds feed URL → app fetches + parses → config UI:
  - `url` — RSS/Atom feed URL
  - `name` — Display name (auto-filled from feed title)
  - `category` — Tag to apply to all imported articles
  - `fetch_interval` — How often to check (15min / 1h / 6h / 24h / manual)
  - `max_items` — Max items to keep from this feed (FIFO, old items auto-deleted)
  - `auto_archive` — Archive after N days

- **Fetch Pipeline**:
  1. Priority Queue fires per-feed fetch job (based on `fetch_interval`)
  2. Fetch: HTTP GET feed URL (with ETag + Last-Modified for bandwidth saving)
  3. Parse: RSS 2.0 / Atom (fast-xml-parser or similar), extract title/link/description/content/pubDate/author
  4. Deduplicate: Skip if `guid` or `link` already imported
  5. Clean: Extract article content using Readability algorithm (Mozilla's @mozilla/readability) → strip ads/nav/clutter
  6. **#21 Auto-Tagging**: Apply category tag + auto-tags
  7. Store: Create note with `source: rss` property + `feed_name` + `feed_url` + `original_url` + `published_at`
  8. **#52 Notification**: Optional — "New article from {feed}: {title}"

- **Data Model**:
  ```
  rss_feeds: id, url, name, category, fetch_interval,
             etag, last_modified, last_fetched_at,
             enabled, created_at
  rss_entries: id, feed_id, guid, link, title,
               author, published_at, fetched_at, note_id (FK)
  ```

- **Feed Management UI**:
  - Dedicated "Feeds" view in sidebar
  - List: feed name + unread count + last fetched
  - Click feed → list of imported articles
  - Article: title + preview + open note button
  - Import actions: Import all unread / Import single / Mark as read

- **Integration Points**:
  - **#21 Auto-Tagging**: New articles auto-tagged
  - **#52 Notification System**: Optional new-article notifications
  - **#22 Agentic Chat**: "Summarize today's RSS articles"
  - **#29 AI Insights Panel**: Show feed stats (articles this week, top feeds)
  - **#69 Export Engine**: Export feed articles as "Reading Digest"
  - **#35 Scripting API**: Scripts can add/process feeds programmatically


## 20. Web Clipping (#33)

- **What**: Browser extension + desktop app feature to clip web content (articles, pages, screenshots, selections) directly into Knot with automatic content extraction, formatting, and metadata preservation.

- **Architecture**: Browser extension injects content script on user action → extracts page data → sends to Knot via HTTP API → processed into note.

- **Clip Methods**:
  | Method | What | Output |
  |--------|------|--------|
  | **Article clip** | Full article via Readability | Clean markdown + OG metadata |
  | **Selection clip** | User-selected text | Selected text as quote block + source |
  | **Screenshot clip** | Full page screenshot | Image attachment + URL |
  | **Bookmark clip** | Just URL + title | Link note with OG preview |
  | **PDF clip** | Link to PDF | Download PDF to Knot + metadata |
  | **Video clip** | YouTube/Vimeo URL | Embed block + description |

- **Browser Extension Flow**:
  1. User clicks extension icon or right-click → "Clip to Knot"
  2. Content script extracts: page title, URL, OG meta, selected text (if any), full HTML
  3. Extension popup shows preview: title, description, tags (suggested)
  4. User can: edit title, add tags, choose notebook, add comments
  5. Submit → HTTP POST to Knot API (`PUT /api/clip`)
  6. Knot processes: Readability extraction → markdown → auto-tag → create note
  7. **#52 Notification**: "Clipped: {title}" with link to note

- **Smart Detection**:
  - URL pattern detection: YouTube → embed, Twitter → embed + thread, GitHub → repo metadata
  - Image-heavy pages → clip as gallery
  - PDF URLs → download + store as PDF note
  - Multi-page articles → detect "next page" links and combine

- **Data Model**:
  ```
  clips: id, url, title, description, clip_type (article/selection/screenshot/bookmark/pdf/video),
         og_image, site_name, author, content_markdown,
         suggested_tags (JSON), user_tags (JSON),
         note_id (FK, nullable), created_at
  ```

- **UI**:
  - "Clipped" badge on notes from clips
  - Source URL visible in note properties
  - One-click "Open original" in note toolbar

- **Integration Points**:
  - **#42 Quick Capture**: Clips appear in Inbox before final processing
  - **#21 Auto-Tagging**: Auto-suggest tags from page content
  - **#30 RSS Feeds**: RSS articles can be clipped as individual notes
  - **#69 Export Engine**: Export clipped content with source attribution
  - **#47 Auto-Classify**: Automatically categorize clipped content
  - **#35 Scripting API**: Scripts can process clips on arrival


## 21. PDF Annotation → Note (#34)

- **What**: Import PDFs into Knot with built-in PDF viewer + annotation layer. Users can highlight text, add margin notes, and extract annotations into structured notes with one click.

- **Architecture**:
  ```
  PDF file ──► PDF.js renderer (viewer)
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
  Annotation Layer      Text Extraction
  (Canvas overlay)      (pdf.js textContent)
      │                     │
      └──────────┬──────────┘
                 ▼
        Extract → Markdown Note
        (highlight → quote + comment)
        (margin note → callout)
  ```

- **PDF Viewer**:
  - **pdf.js** (Mozilla's PDF renderer): Page rendering, text layer, search
  - **Side-by-side**: PDF on left, notes on right (split view)
  - **Thumbnails**: Page thumbnails sidebar for navigation
  - **View modes**: Single page / Scrolling / Presentation
  - **Search**: Full-text search within PDF

- **Annotation Types**:
  | Type | Action | Output |
  |------|--------|--------|
  | **Highlight** | Select text → highlight color | Quote block in extracted note |
  | **Margin note** | Click margin → type note | Callout block linked to page |
  | **Sticky note** | Place on page → type | Callout + page reference |
  | **Underline** | Select text → underline | Quote block with underline style |
  | **Freehand draw** | Draw on page | Image overlay (for tablet users) |

- **Extract to Note**: "Extract Annotations" button → generates markdown note:
  1. Groups annotations by page (ordered)
  2. Each highlight → blockquote with page reference
  3. Each margin/sticky note → callout or paragraph
  4. Adds metadata: source PDF, total pages, extract date
  5. Opens in editor for user to refine

- **Data Model**:
  ```
  pdf_documents: id, filename, size_bytes, page_count,
                 blob_id, status (importing/ready/error), created_at
  pdf_annotations: id, pdf_id, page_num, type (highlight/margin/sticky/underline/draw),
                   content (text), color, position (JSON: {x,y,w,h}),
                   note_id (FK, nullable after extract), created_at
  ```

- **UI**:
  - PDFs appear in note list with 📄 icon
  - Click → open PDF viewer (full-width or split)
  - "Extract Annotations" button in toolbar
  - Notes created from PDF extraction linked back to source PDF

- **Integration Points**:
  - **#69 Export Engine**: Include PDF annotations when exporting
  - **#21 Auto-Tagging**: Suggest tags from PDF content
  - **#22 Agentic Chat**: "Summarize this PDF" → LLM processes extracted text
  - **#28 AI Second Knowledge**: PDF can have Shadow Docs for deeper analysis
  - **#23 Wiki Synthesis**: PDF content can feed into wiki generation


## 22. Note Query Language (#40)

- **What**: A SQL-like query language for searching and filtering notes with conditions on content, tags, properties, dates, AI metadata, and relationships. Allows complex cross-referencing queries without leaving the keyboard.

- **Syntax**:
  ```
  FIND notes WHERE
    tags IN ("rust", "async") AND
    created_at > "2024-01-01" AND
    content CONTAINS "tokio" AND
    ai.similarity > 0.8 AND
    property.priority = "high"
  SORT BY created_at DESC
  LIMIT 20
  ```

- **Query Clauses**:
  | Clause | Example | Description |
  |--------|---------|-------------|
  | `FIND notes / tasks / clips / all` | `FIND tasks` | Entity type to search |
  | `WHERE` | `tags IN ("rust")` | Filter conditions |
  | `SORT BY` | `SORT BY title ASC` | Sort results |
  | `LIMIT / OFFSET` | `LIMIT 10 OFFSET 20` | Pagination |
  | `GROUP BY` | `GROUP BY tags` | Group results |

- **Filter Operators**:
  | Operator | Example | Description |
  |----------|---------|-------------|
  | `= / !=` | `property.priority = "high"` | Exact match |
  | `> / >= / < / <=` | `created_at > "2024-06-01"` | Date/number comparison |
  | `IN / NOT IN` | `tags IN ("rust", "go")` | Set membership |
  | `CONTAINS` | `content CONTAINS "async"` | Substring match |
  | `LIKE` | `title LIKE "%.md"` | SQL-style pattern match |
  | `REGEX` | `title REGEX "^[A-Z]"` | Regex match |
  | `ai.similarity > N` | `ai.similarity > 0.8` | Semantic similarity threshold |
  | `ai.relation TYPE` | `ai.relation "contradiction"` | Relation graph filter |

- **Properties**: Access note properties via `property.<name>`:
  - `property.priority`, `property.status`, `property.author`, etc.
  - Custom properties from #39 Custom Properties & Frontmatter

- **AI Filters**: Access AI layer data via `ai.*`:
  - `ai.tags` — auto-tags applied
  - `ai.similarity` — similarity score to current note
  - `ai.relation` — relation type in knowledge graph
  - `ai.summary` — LLM-generated summary (match against)
  - `ai.glossary` — glossary terms present

- **Joins** (future): `FIND notes WHERE RELATED TO (FIND notes WHERE tags IN ("project-x"))` — nested queries for cross-reference.

- **Query Bar**: Always-visible search bar (CMD+P → query mode)
  - Type `>` prefix to enter query mode
  - Syntax highlighting in query bar
  - Auto-complete: tag names, property names, operators
  - Recent queries dropdown
  - Save query as "Smart Folder" (persistent, auto-updating)

- **Execution**:
  ```
  Query text ──► Parser (PEG.js / hand-written)
                   │
                   ▼
              AST (conditions tree)
                   │
                   ▼
              SQLite FTS5 + metadata query
                   │
                   ▼
              Results list (matching note IDs)
                   │
                   ▼
              Sort + paginate → display
  ```

- **Smart Folders**: Saved queries that appear in sidebar as dynamic folders:
  - "Urgent Tasks" → `FIND tasks WHERE property.priority = "urgent"`
  - "Reading List" → `FIND notes WHERE tags IN ("to-read") AND status != "done"`
  - "Recent AI Activity" → `FIND notes WHERE ai.generated_at > today - 7`
  - Smart Folders auto-update their results every time they're opened

- **Use Cases**:
  - "Show all meeting notes from last month with action items"
  - "Find notes tagged 'rust' that mention 'tokio' and have high similarity"
  - "All tasks assigned to me with due date this week"
  - "Notes created this week with auto-tag 'important'"

- **Integration Points**:
  - **#29 AI Insights Panel**: Save queries as panel widgets
  - **#52 Notification System**: Smart Folders can trigger notifications ("3 urgent tasks due")
  - **#24 Daily Briefing**: Briefing can embed query results as sections
  - **#27 Scheduled Reports**: Queries define scope for scheduled reports
  - **#69 Export Engine**: Export query results as dynamic report
  - **MCP API**: Query accessible via MCP tool


## 23. Dashboard (#32)

- **What**: Customizable home screen that gives users an at-a-glance overview of their knot knowledge base — recent notes, upcoming tasks, AI activity, quick stats, and personal widgets. Accessible from the sidebar "Home" icon or via CMD+D.

- **Widget System**:
  ```
  ┌────────────────────────────────────────────────────────────┐
  │  [🌤] Good morning, Chad    ● 5 cards due    ● 3 unread    │
  ├──────────────┬──────────────────────────────┬──────────────┤
  │ 📝 Recent    │  🔖 Upcoming Tasks           │ 🤖 AI Activity│
  │ Notes        │  ┌──────────────────────┐    │ ┌──────────┐ │
  │ ┌──────────┐│  │ ☐ Fix auth bug  - today │   │ │Tagged 12 │ │
  │ │ Rust async││  │ ☐ Write blog   - tomrrw│   │ │notes     │ │
  │ │ ...       ││  │ ☐ Meeting prep  - Fri  │   │ │Wiki gen  │ │
  │ └──────────┘│  └──────────────────────┘    │ │Brief     │ │
  │              │                              │ │          │ │
  ├──────────────┴──────────────────────────────┴──────────────┤
  │ 📊 Stats: 842 notes · 23 tags · 7 feeds · 142 flashcards  │
  └────────────────────────────────────────────────────────────┘
  ```

- **Built-in Widgets**:
  | Widget | Shows | Click Action |
  |--------|-------|-------------|
  | Recent Notes | Last 5-10 edited notes | Open note → |
  | Upcoming Tasks | Tasks due today/tomorrow (+ count badge) | Open Kanban |
  | Cards Due | Flashcard count + "Review Now" button | Open Flashcards |
  | AI Activity | Last 3 AI actions (tag, wiki, brief, etc.) | Open AI Insights Panel |
  | Quick Stats | Total notes, tags, feeds, flashcards, tasks | — |
  | Inbox | Unread capture count + recent items | Open Inbox |
  | Scheduled Reports | Next report time + last report snippet | Open Reports |
  | RSS Feeds | Unread article count per feed + headlines | Open Feed Reader |
  | Daily Brief | Today's briefing preview | Expand briefing widget |
  | Search Bar | CMD+K-style quick search | Open search overlay |

- **Widget Config**:
  - Grid layout: 2-column by default, configurable to 1/2/3 columns
  - Widget size: Small (1×1) / Medium (2×1) / Large (2×2) — grid units
  - Add/remove widgets from "Customize Dashboard" panel
  - Drag-and-drop to reorder
  - Widget state persisted in `dashboard_config` table

- **Data Model**:
  ```
  dashboard_config: id, layout_columns (int),
                    widgets (JSON: [{id, type, size, position, config?}])
  ```

- **States**:
  - **Empty state** (first launch): "Welcome to Knot!" with quick-start guide + tips
  - **Normal**: All widgets showing data
  - **Offline**: Widgets show cached data + "Last updated: X min ago" indicator

- **Integration Points**:
  - **All features**: Every feature can register a dashboard widget via widget registry
  - **#29 AI Insights Panel**: AI Activity widget links to full panel
  - **#24 Daily Briefing**: Briefing widget shows today's summary
  - **#52 Notification System**: Badge counts for notifications
  - **#37 Task Management**: Task widget shows upcoming cards
  - **#26 Flashcards**: Cards Due widget
  - **#42 Quick Capture**: Inbox unread count widget
  - **#30 RSS Feeds**: Feed unread widget
  - **#27 Scheduled Reports**: Report status widget


## 24. Daily Notes & Calendar (#38)

- **What**: Automatic daily note creation + calendar view for browsing notes by date. Each day gets a template-based daily note (created at midnight or first launch of the day). Calendar view shows a month grid with dots indicating which days have notes.

- **Daily Note Flow**:
  ```
  Midnight / First app launch
           │
           ▼
    Check: daily note for today exists?
           │
      ┌────┴────┐
      │ YES     │ NO
      │         ▼
      │    Create from template
      │    ├── Title: "YYYY-MM-DD Daily"
      │    ├── Template: "# {date}\n## Todo\n\n## Notes\n\n## Log"
      │    └── Properties: date, type=daily
      │         │
      │         ▼
      │    Apply #24 Daily Briefing content
      │    (weather, calendar events, cards due, etc.)
      │
      ▼
    Navigate to daily note
  ```

- **Daily Note Template**:
  - User-configurable via note templates (#50 Auto-Template Matching)
  - Default template:
    ```
    # {{date}} Daily
    ## ✅ Tasks
    - [ ] 

    ## 📝 Notes

    ## 📅 Events

    ## 💡 Ideas
    ```
  - Variables: `{{date}}`, `{{day_of_week}}`, `{{week_number}}`, `{{month}}`, `{{year}}`

- **Calendar View**:
  - Month grid: Sunday-start or Monday-start (configurable)
  - Dots under dates where notes exist
  - Click date → opens daily note (creates if not exists)
  - Year dropdown + month arrows for navigation
  - Mini-calendar in sidebar (collapsible)

- **Data Model**:
  ```
  No separate table — daily notes are regular notes with `type: daily` property
  + `date` property for indexing. Queried via #40 Note Query Language:
  FIND notes WHERE type = "daily" AND date >= "2026-01-01" AND date <= "2026-01-31" SORT date DESC
  ```

- **Integration Points**:
  - **#24 Daily Briefing**: Briefing content auto-injected into today's daily note
  - **#50 Auto-Template Matching**: User-customizable daily note template
  - **#40 Note Query Language**: Query daily notes by date range
  - **#37 Task Management**: Quick-add tasks to daily note's task section
  - **#42 Quick Capture**: "Capture to daily note" option
  - **#21 Auto-Tagging**: Daily notes auto-tagged with `daily`
  - **#27 Scheduled Reports**: Weekly report includes daily note summaries
  - **#22 Agentic Chat**: "What happened on March 15?" → reads daily note
  - **#52 Notification System**: Optional "Good morning" notification with daily note link

- **Calendar View UI**:
  - Full-page calendar accessible from sidebar or CMD+SHIFT+C
  - Mini-calendar in sidebar for quick date navigation
  - Notes list below calendar for selected date
  - Week view option (toggle between month/week)


## 25. Custom Properties & Frontmatter (#39)

- **What**: YAML frontmatter support for notes with user-definable custom properties. Each note can have structured metadata (tags, status, date, priority, custom fields) stored as YAML frontmatter in the markdown file. Properties are indexed for search, filter, and query.

- **Frontmatter Format**:
  ```yaml
  ---
  title: "Rust Async Patterns"
  tags: [rust, async, programming]
  status: published
  created: 2026-01-15
  updated: 2026-06-20
  priority: high
  author: chad
  project: knot
  review_date: 2026-07-01
  ---
  ```

- **Built-in Properties**:
  | Property | Type | Default | Description |
  |----------|------|---------|-------------|
  | `title` | string | (note title) | Document title |
  | `tags` | string[] | [] | Tags for categorization |
  | `created` | date (ISO) | auto | Creation date |
  | `updated` | date (ISO) | auto | Last modified date |
  | `status` | enum: draft/review/published/archived | draft | Document lifecycle status |
  | `source` | string | — | Origin (manual/rss/clip/voice/import) |

- **Custom Properties**:
  - User defines custom properties in Settings → Properties
  - Property types: text, number, date, checkbox, select, multi-select, URL, email
  - Properties appear as form fields in note editor (below title, above content)
  - Properties indexable via #40 Note Query Language
  - Auto-complete for select/multi-select values
  - Default values configurable

- **Frontmatter UI**:
  ```
  ┌──────────────────────────────────┐
  │ 📝 Rust Async Patterns          │ ← title (editable)
  ├──────────────────────────────────┤
  │ Status: [draft ▼]  Project: [knot ▼]
  │ Priority: High    Review: 2026-07-01
  │ Tags: rust × async × programming +
  ├──────────────────────────────────┤
  │ Note content...                  │
  └──────────────────────────────────┘
  ```
  - Properties displayed as inline form fields between title and content
  - Toggle raw YAML view (for power users)
  - Validation: required fields, type checks
  - Batch edit: multi-select notes → bulk update properties

- **Indexing & Search**:
  - Properties extracted on save → stored in `note_properties` table
  - Indexed for filter/query: `FIND notes WHERE project = "knot" AND status = "published"`
  - FTS5 includes property values for full-text search

- **Data Model**:
  ```
  custom_property_defs: id, name, type, options (JSON for select),
                        default_value, required, created_at
  note_properties: note_id, property_id, value (text),
                   indexed_value (type-coerced for filtering)
  ```

- **Integration Points**:
  - **#40 Note Query Language**: Core query target — properties are the WHERE clause columns
  - **#38 Daily Notes**: Daily notes use `type: daily` + `date` properties
  - **#37 Task Management**: Task properties map to card fields
  - **#21 Auto-Tagging**: Tags are built-in multi-select property
  - **#69 Export Engine**: Properties included in export frontmatter
  - **#39 (self)**: Frontmatter synced to file on disk for portability
  - **#46 Git Backup**: Frontmatter preserved in git commits
  - **#44 Readwise Import**: Readwise highlights mapped to `source: readwise` property


## 26. Outliner Mode (#41)

- **What**: Bullet-journal-style outliner for rapid hierarchical note-taking. Each line is an indented bullet that can be collapsed/expanded, indented/outdented, reordered, and converted between bullet types. Inspired by Workflowy/Dynalist/Logseq.

- **Core Interaction Model**:
  ```
  - Root bullet 1           ← ENTER creates sibling
    - Sub-bullet 1.1        ← TAB indents, SHIFT+TAB outdents
      - Sub-sub-bullet      ← Click chevron to collapse
    - Sub-bullet 1.2        ← Drag handle to reorder
  - Root bullet 2           ← CMD+ENTER adds child
    [ ] Todo item           ← CMD+SHIFT+T toggles todo
    * Bullet item
    1. Numbered item        ← Auto-numbering on type change
  ```

- **Bullet Types**:
  | Shortcut | Type | Display |
  |----------|------|---------|
  | `-` | Dash bullet | `- text` |
  | `*` | Star bullet | `* text` |
  | `[ ]` | Todo (unchecked) | `☐ text` |
  | `[x]` | Todo (checked) | `☑ text` |
  | `1.` | Numbered | `1. text` |
  | `>` | Quote/Block | `▸ text` (colored) |

- **Keyboard Shortcuts**:
  | Key | Action |
  |-----|--------|
  | `ENTER` | New sibling below |
  | `SHIFT+ENTER` | New line within same bullet (soft break) |
  | `CMD+ENTER` | New child bullet |
  | `TAB` | Indent (demote) |
  | `SHIFT+TAB` | Outdent (promote) |
  | `CMD+SHIFT+↑/↓` | Move bullet up/down |
  | `CMD+SHIFT+→` | Collapse children |
  | `CMD+SHIFT+←` | Expand children |
  | `CMD+SHIFT+T` | Toggle todo status |
  | `CMD+D` | Duplicate bullet |
  | `CMD+DELETE` | Delete bullet (with children) |

- **Features**:
  - **Collapse/Expand**: Click chevron or `CMD+SHIFT+→/←`. Collapsed bullets show `... (N)`
  - **Zoom**: Focus on one bullet → zoom into it (hides siblings, shows children full-width)
  - **Search within outline**: CMD+F filters visible bullets in real-time
  - **Drag-and-drop reorder**: Drag handle (6 dots) on hover
  - **Multi-select**: CMD+click bullets → batch move/delete/convert
  - **Convert between types**: Select → CMD+SHIFT+T to toggle todo, or right-click → Change Type
  - **Auto-numbering**: Numbered list auto-updates on insert/move/delete
  - **Filter by state**: "Show only todos" or "Show only checked"

- **Persistence**: Each line stored as a block in Yjs/BlockSuite format (same as flat notes — outliner is just a different view mode). No separate storage model.

- **Integration Points**:
  - **#42 Quick Capture**: Captured text can be rendered as outline
  - **#40 Note Query Language**: Query results can be displayed as outline
  - **#37 Task Management**: Todo bullets sync with Kanban tasks
  - **#45 Voice Notes**: Transcript rendered as outline
  - **#22 Agentic Chat**: "Convert this note to outline" via chat
  - **#69 Export Engine**: Export outline as OPML, Markdown, or indented text
  - **#35 Scripting API**: Scripts can manipulate outline blocks

- **View Toggle**: Button in editor toolbar: "Outline" / "Normal" / "Split" (outline left, preview right). Toggle persists per note.


## 27. Readwise / Import Integration (#44)

- **What**: Import highlights and annotations from Readwise Reader into Knot. Also supports generic import from other note apps (Obsidian, Notion, Roam, Bear) via Markdown/JSON/CSV. Incoming items are deduplicated, auto-tagged, and merged into the existing note graph.

- **Readwise Sync Architecture**:
  ```
  Readwise API ──► OAuth2 token exchange
                   │
                   ▼
             Poll: GET /api/v2/highlights
             (every 15 min via Priority Queue)
                   │
                   ▼
             Dedup: skip if highlight_id exists
                   │
                   ▼
             Transform: highlight → note
               ├── title: book/article title
               ├── content: highlight text + note/comment
               ├── source: "readwise"
               ├── metadata: {url, author, category, source_type}
               └── tags: [book_title_tag, readwise_source_tag]
                   │
                   ▼
             #21 Auto-Tagging → store as note
                   │
                   ▼
             #52 Notification: "N new highlights imported"
  ```

- **Readwise Config**:
  - OAuth2 flow: "Connect Readwise" button → authorize → store refresh token
  - Sync interval: 15min / 1h / 6h / manual (configurable)
  - Import scope: All / Books only / Articles only / Podcasts / Tweets
  - Tag mapping: `readwise_{category}` prefix, or custom template
  - Auto-archive: Import highlights → mark as read in Readwise (optional)

- **Generic Import Formats**:
  | Source | Format | Method |
  |--------|--------|--------|
  | Obsidian | Markdown files (.md) | Drag folder / File picker |
  | Notion | Markdown export (.zip) | Upload ZIP, parse folder structure |
  | Roam Research | EDN / JSON export | File upload |
  | Bear | Bear export (.zip) | Upload ZIP |
  | Standard Markdown | .md files | Drag-and-drop |
  | JSON | Structured JSON array | File upload |
  | CSV | Spreadsheet with columns | File upload with column mapping UI |

- **Import Pipeline** (generic):
  1. **Detect format**: File extension + content sniffing
  2. **Parse**: Format-specific parser:
     - Markdown: Extract frontmatter + body
     - ZIP: Recursively unzip, parse each file
     - EDN: Parse outline structure
     - JSON: Map fields to note schema
     - CSV: Column mapping UI → map to title/content/tags/date
  3. **Dedup**: By title similarity + content hash
  4. **Transform**: Convert to Knot's internal format with frontmatter
  5. **#21 Auto-Tagging**: Add `imported: obsidian` etc.
  6. **#25 Auto-Template Matching**: Match to template if applicable
  7. **Store**: Create notes
  8. **Report**: "Imported 42 notes from Obsidian vault"

- **Data Model**:
  ```
  import_sources: id, source_type (readwise/obsidian/notion/...),
                  config (JSON: token, sync_interval, settings),
                  last_sync_at, status (active/paused/error),
                  created_at
  import_log: id, source_id, imported_count, skipped_count,
              error_count, started_at, completed_at, status
  ```

- **Integration Points**:
  - **#21 Auto-Tagging**: All imports auto-tagged with source tag
  - **#42 Quick Capture**: Imported items appear in Inbox as "New Import"
  - **#50 Auto-Template Matching**: Imported content matched to templates
  - **#52 Notification System**: "Import complete: N notes" notification
  - **#40 Note Query Language**: Query imported notes by `source: readwise`
  - **#46 Git Backup**: Imported notes included in git commits
  - **#22 Agentic Chat**: "Summarize my Readwise highlights from this week"
  - **#69 Export Engine**: Re-export imported items in any format


## 28. Git Backup (#46)

- **What**: Automatic git-based versioning of all notes and metadata. Every note change triggers a git commit (batched per minute), giving users a full history tree that can be pushed to any remote (GitHub, GitLab, self-hosted). Notes are stored as flat `.md` files on disk for maximum portability.

- **Storage Design**:
  ```
  .knot/
  ├── notes/
  │   ├── 2026/
  │   │   ├── 01-rust-async.md
  │   │   ├── 02-knot-architecture.md
  │   │   └── ...
  │   └── ...
  ├── .git/
  ├── .gitignore
  └── knot.db           ← SQLite database (excluded from git)
  ```

- **Why files + git over pure DB**:
  - **Portability**: Notes are plain `.md` files — readable with any editor
  - **History**: Full git blame/log per file — see who changed what and when
  - **Remote backup**: Push to GitHub/GitLab for free backup
  - **Interop**: Other git-aware tools can read/edit notes directly
  - **Merge**: Standard git merge for conflict resolution across devices

- **Commit Strategy**:
  ```text
  Auto-commit: batched per 60s (or N changes) → single commit
  Format: "Auto-save: updated 3 notes · created 1 note · deleted 0 notes"
  
  Manual commits: CMD+S → "fix: update auth section" (user-editable message)
  
  Configurable:
  - Auto-commit interval: 30s / 60s / 5min / manual-only
  - Commit message format: template with variables
  - Push behavior: auto-push / manual-push / never-push
  ```

- **File Name Convention**:
  - Pattern: `{YYYY}/{MM}-{slugified-title}.md`
  - Collision handling: append `-N` if duplicate slug exists
  - Rename detection: git detects file renames automatically

- **Frontmatter Sync**:
  - Every note has frontmatter synced between file and DB
  - File is source of truth for content; DB is search index
  - On startup: if file modified externally → re-import to DB
  - On save: write file first, then update DB index

- **Sync & Push**:
  - **Remote config**: Add one or more git remotes in Settings
  - **Auto-push**: After each auto-commit, run `git push` (credential helper or SSH key)
  - **Pull before push**: `git pull --rebase` to handle remote changes
  - **Conflicts**: On merge conflict → store conflicted copy + notify user

- **Data Model**:
  ```
  git_config: id, remote_url, branch, auto_push, auto_interval,
              last_sync_at, last_commit_sha
  git_history: id, commit_sha, commit_message, files_changed,
               created_at, pushed (bool)
  ```

- **Git UI**:
  - **Status indicator**: In status bar: "Synced" / "N changes to commit" / "Pushing..."
  - **History view**: CMD+SHIFT+G → show recent commits with files changed
  - **Diff view**: Select commit → show note diffs (added/removed lines)
  - **Manual commit**: Command palette → "Git: Commit" → enter message
  - **Remote config**: Settings → Git → Add remote / Push now / Pull

- **Integration Points**:
  - **#39 Custom Properties & Frontmatter**: Frontmatter synced to file on every save
  - **#36 CRDT**: CRDT snapshots are database-level; git commits are file-level intentional saves
  - **#35 Scripting API**: Scripts can trigger git commit/push programmatically
  - **#52 Notification System**: Notify on push failure or merge conflict
  - **#69 Export Engine**: Export git history as changelog

- **Security**:
  - Git credentials stored in OS keychain (not in config file)
  - SSH key support (auto-detect ~/.ssh/id_*)
  - Token-based auth for GitHub/GitLab (stored in keychain)
  - `.gitignore` includes `knot.db` (no binary data in git)

---

## 29. Graceful Degradation — AI Offline Mode

### Design Principle

AI features are **value-add, never gating**. Core note-taking, search (BM25 fallback), navigation, export, and all non-AI features must work without any AI service. Users should never lose data or feel blocked when AI is unavailable.

### Detection & State

- **Heartbeat**: Knot pings Ollama (or configured AI provider) every 30 seconds
- **States**: `online` / `degraded` (Ollama reachable but slow) / `offline` (connection refused or timeout)
- **UI indicator**: Status bar dot — green (online), yellow (degraded), red (offline)
- **Event**: On state change → `ai_status_changed` event → affected features re-evaluate

### Per-Feature Fallback Matrix

| Feature | Normal | AI Offline Behavior | Notes |
|---------|--------|-------------------|-------|
| **#3 Semantic Search** | BM25 + vector hybrid (RRF) | BM25 FTS5 only. Vector tab hidden. "Semantic unavailable" badge on tab | Results still usable, just keyword-based |
| **#21 Auto-Tagging** | LLM suggests tags | Button disabled with tooltip. Manual tagging works normally | Tag system unaffected |
| **#22 Agentic Chat** | LLM with RAG context | "AI unavailable" message. Chat history preserved for when AI returns | User can still browse queued messages |
| **#23 Wiki Synthesis** | LLM generates wiki | "Generate Wiki" button disabled. Show last generated wiki with stale badge | Wiki content preserved from last successful generation |
| **#24 Daily Briefing** | LLM generates morning summary | Show last cached briefing with ⚠️ "Stale — AI offline" banner. Refresh button disabled | Cached for 7 days max |
| **#25 Similar Notes** | Vector similarity (embed model) | Fallback to tag-based + title-word overlap similarity | Lower quality but still useful |
| **#26 Flashcards** | AI cloze deletion generation | FSRS review queue works. "Generate cloze" button disabled. Manual cloze creation still works | Spaced repetition core is AI-independent |
| **#27 Scheduled Reports** | AI-summarized | Skip AI summary sections. Render template-only format. Mark report as "AI content omitted" | No data loss |
| **#28 AI Second Knowledge** | 5-layer AI augmentation | All 5 layers show "AI unavailable" with cached content if available. Shadow docs: show last cached version tagged stale. Relation graph: tag-based-only edges | Core graph navigation (manual edges, hierarchy) unaffected |
| **#29 AI Insights Panel** | LLM patterns, trends suggestions | Show cached insights with "last updated" timestamp. Poll for AI return | Right panel collapses gracefully |
| **#47-#51 Auto-Org** | LLM classification/linking | Suggestions paused. Manual classification/linking works. Pending queue preserved for when AI returns | Queue stored in `auto_org_pending` table |
| **#52 Notification System** | AI-suggested notifications | Rule-based notifications only. AI-scored importance falls back to chronological | Core notification delivery unaffected |
| **#53 Location Suggestions** | GPS + AI place analysis | GPS suggestions only (RawLocation). No semantic place annotation | Degraded but functional |
| **#54 Task Reminders** | AI-optimized reminder times | Rule-based reminders only. No AI rescheduling. Evaluation engine (60s poll) still runs | No missed reminders |
| **#55 MCP Server** | Full AI tool access | Tools that require AI return error `{ error: "ai_offline", feature: "..." }`. Non-AI tools (notes CRUD, search, tags) work normally | MCP tool catalog filtered; clients see `requires_ai: true` flag |

### Auto-Organization Queue Recovery

When AI returns after offline period:
1. **Priority replay**: Pending auto-org items processed in FIFO order, 5/min throttle to avoid LLM rate limits
2. **Stale skip**: Items older than 24h dropped (context stale)
3. **User notification**: Summary badge "X items processed since AI recovery"
4. **Conflict resolution**: If auto-classification contradicts manual classification made during offline — manual wins

### Implementation Notes

- **No silent data loss**: All AI-generated content cached in SQLite `ai_cache` table. Users always see something (even if stale)
- **User control**: Settings → AI → "Allow Knot to queue AI tasks while offline" toggle (default ON)
- **Network resilience**: 3 retries with exponential backoff (1s, 4s, 15s) before declaring offline. Transient blips don't trigger degradation UI
- **Multi-provider**: If user configured multiple AI providers (Ollama + OpenAI), Knot auto-fails over. Degradation only when ALL providers unreachable

---

## 30. Spatial Canvas / Whiteboard (#4)

- **What**: Infinite canvas for free-form layout of notes, drawings, images, sticky notes. Canvas can be a first-class "note type" — toggle between document view and canvas view per note.

- **Architecture**:
  ```
  ┌──────────────────────────────────────────────────────────┐
  │  Editor toggle: [Document] / [Canvas]                    │
  │                                                          │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  ∞ Infinite Canvas (zoom 25%–400%)                 │  │
  │  │                                                    │  │
  │  │  ┌──────────┐    ┌──────┐    ┌──────────────────┐ │  │
  │  │  │ 📄 Note  │    │ Text │    │ 🖼 Image         │ │  │
  │  │  │ "Rust    │    │ Box  │    │ (embedded blob)  │ │  │
  │  │  │ async"   │    │      │    │                  │ │  │
  │  │  └──────────┘    └──────┘    └──────────────────┘ │  │
  │  │                                                    │  │
  │  │       ┌───────────────┐      ┌─────────────────┐   │  │
  │  │       │ 🟡 Sticky Note │      │ ✏️ Drawing      │   │  │
  │  │       │ "Review"      │      │ (freehand)      │   │  │
  │  │       └───────────────┘      └─────────────────┘   │  │
  │  │                                                    │  │
  │  │  └─── Mind Map ──────────────────────────────────┘  │  │
  │  │        ┌─── Node A                                  │  │
  │  │        │── Node B ── Sub B1                         │  │
  │  │        └─── Node C                                  │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  Toolbar: [Select] [Note] [Text] [Shape] [Pen] [Sticky]  │
  │  [Image] [Connector] [Mind Map] [+ New Layer]            │
  └──────────────────────────────────────────────────────────┘
  ```

- **Canvas State**: Stored as a JSON blob in the `canvases` table. `node` array with explicit z-ordering.

  ```json
  {
    "viewport": { "x": 0, "y": 0, "zoom": 1.0 },
    "nodes": [
      {
        "id": "uuid",
        "type": "note | text | shape | image | sticky | drawing | mindmap",
        "x": 140, "y": 220, "w": 300, "h": 200,
        "zIndex": 3,
        "rotation": 0,
        "content": { /* type-specific payload */ },
        "style": { "fill": "#fff", "stroke": "#ddd", "fontSize": 14 },
        "sourceNoteId": "note_uuid | null",
        "connectorIds": ["edge_uuid", ...]
      }
    ],
    "edges": [
      {
        "id": "edge_uuid",
        "source": "node_uuid",
        "target": "node_uuid",
        "label": "relates to",
        "style": { "color": "#888", "dashed": false }
      }
    ],
    "layers": [
      { "id": "layer_uuid", "name": "Brainstorm", "visible": true, "locked": false }
    ]
  }
  ```

- **Data Model**:
  ```sql
  CREATE TABLE canvases (
    id TEXT PRIMARY KEY,                    -- note_id (1:1 with notes table)
    note_id TEXT NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT '{}',       -- JSON: nodes[], edges[], layers[], viewport
    version INTEGER NOT NULL DEFAULT 1,     -- incremented on every save (conflict detection)
    auto_save_at INTEGER,                   -- last auto-save timestamp
    thumbnail_id TEXT REFERENCES blobs(id), -- cached PNG thumbnail for sidebar preview
    width INTEGER DEFAULT 4000,             -- logical canvas width
    height INTEGER DEFAULT 4000             -- logical canvas height
  );

  CREATE INDEX idx_canvases_note ON canvases(note_id);

  CREATE TABLE canvas_nodes (
    id TEXT PRIMARY KEY,
    canvas_id TEXT NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL,                 -- note | text | shape | image | sticky | drawing
    source_note_id TEXT REFERENCES notes(id) ON DELETE SET NULL,
    x REAL NOT NULL, y REAL NOT NULL,
    w REAL NOT NULL DEFAULT 200, h REAL NOT NULL DEFAULT 150,
    z_index INTEGER NOT NULL DEFAULT 0,
    style TEXT DEFAULT '{}',                 -- JSON style overrides
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX idx_canvas_nodes_canvas ON canvas_nodes(canvas_id);
  CREATE INDEX idx_canvas_nodes_source ON canvas_nodes(source_note_id);
  ```

- **Node Types**:
  - **Note** — live-linked embed of another note. Shows title + excerpt. Double-click opens source. Changes in source note reflected on canvas (debounced, 2s).
  - **Text Box** — inline text with markdown support. No sourceNoteId.
  - **Shape** — rect/ellipse/diamond/arrow with fill, stroke, opacity. Optional text label.
  - **Image** — blob reference (stored in `blobs` table, rendered via thumbnail pipeline). Drag-drop from filesystem.
  - **Sticky Note** — yellow square with rich text, fixed aspect ratio, auto-expands vertically.
  - **Drawing** — vector stroke array `[{points, width, color, opacity}]`. Freehand + bezier smoothing.
  - **Mind Map** — container node that renders a Dagre layout internally. Collapsible.

- **Auto-Save**: Debounced 800ms after last interaction. Incremental sync: only changed nodes sent to SQLite update.

- **UI / Interactions**:
  - **Pan**: Click-drag on empty canvas or middle-mouse drag
  - **Zoom**: Scrollwheel (Cmd+scroll = zoom, plain scroll = pan). Pinch-to-zoom on trackpad.
  - **Select**: Click to select, Shift+click to multi-select, drag to lasso
  - **Move**: Drag selected nodes. Snaps to grid (optional, 20px).
  - **Resize**: Drag handles on selection bounds. Min size 50×50.
  - **Connector**: Click source node's anchor point → drag to target → creates edge
  - **Context menu**: Right-click node → Duplicate / Delete / Link to note / Bring to front / Copy style
  - **Drag from sidebar**: Drag a note from the sidebar → drops onto canvas → creates Note node linked to that note
  - **Drag between canvases**: Open two canvas tabs → drag node → copies node and its sourceNoteId linkage
  - **Canvas/document toggle**: Note properties → toggle `view_mode: 'document' | 'canvas'`. Switching preserves both representations (markdown + canvas_json). No data loss.

- **Integration Points**:
  - **#1 Semantic Search**: Canvas notes indexed. Search results can be dragged onto canvas.
  - **#3 Wiki Synthesis**: Wiki articles renderable as canvas nodes (read-only mode in canvas).
  - **#12 Auto Mind Map**: Mind map layout renders inside a canvas or as standalone document.
  - **#14 Node Map Editor**: Graph view and canvas share node positioning coordinates (bidirectional sync optional).
  - **#15 Doc Context Graph**: Context graph nodes can be pinned/spread onto canvas.
  - **#23 Daily Briefing**: Daily briefing can embed a "today's canvas snapshot" as an image.
  - **#28 AI Second Knowledge**: AI-generated shadow notes rendered as tinted (purple) sticky nodes on canvas.
  - **#69 Export Engine**: Export as SVG (vector) or PNG (rasterized at 2x/3x). Export as `.knot-canvas` JSON for re-import.

- **Edge Cases**:
  - **Orphan nodes**: If source note deleted, Note node shows `[Note deleted]` placeholder with "Unlink" option
  - **Cycle prevention**: Connector edges are directional; UI blocks cycles in mind map mode
  - **Canvas too large**: Virtual rendering — only nodes in current viewport are DOM-mounted. Pan reveals nearby nodes with 500px buffer.
  - **Concurrent edit (#36 CRDT)**: Canvas state uses CRDT merge — conflicting node moves resolved by last-writer-wins per node ID

---

## 31. Auto Mind Map (#12)

- **What**: Convert any document (or selected headings) into a force-directed mind map. Supports structure derivation from headings or AI-suggested organization of unstructured notes.

- **Architecture**:
  ```
  Input document                          Mind Map Canvas
  ┌──────────────────┐            ┌────────────────────────────┐
  │ # Rust Async     │            │        Rust Async          │
  │                   │            │            │               │
  │ ## Tokio Runtime │   Dagre    │    ┌───────┼───────┐       │
  │ ## Async/Await   │ ──layout──→│ Tokio   Async  Best     │
  │ ## Best Practices│   engine   │ Runtime /Await Practices │
  │                   │            │   │       │       │       │
  │ ### Task Spawn   │            │ Task  .await  Pattern  │
  │ ### .await       │            │ Spawn         Matching │
  │ ### Patterns     │            └────────────────────────┘
  └──────────────────┘
          │                            │
          ▼                            ▼
  AI suggest mode:              User interactions:
  unstructured text →           drag nodes, collapse/
  LLM extracts topics →         expand branches, zoom,
  auto-structures → layout      export as PNG/SVG
  ```

- **Two Modes**:
  1. **Heading-derived** (instant, offline): Parse markdown headings — `H1` → root, `H2` → direct children, `H3` → grandchildren, etc. No AI needed.
  2. **AI-suggested** (online): LLM analyzes unstructured note content → returns topic hierarchy JSON — then layout engine renders it.

- **Layout Engine**: Dagre (default) for directed graph layout with top-down orientation. ELK (Eclipse Layout Kernel) available as alternative for left-to-right or radial layouts. User can switch in Settings.

  ```
  Input: { nodes: [...], edges: [...] }
     ↓
  Dagre.layout(graph, { rankdir: 'TB', nodesep: 50, ranksep: 80 })
     ↓
  Output: { nodes: [{ id, x, y, w, h }], edges: [{ from, to }] }
     ↓
  Rendered on canvas or standalone mind map view
  ```

- **Data Model**:
  ```sql
  -- Persistent storage (when user saves a mind map)
  CREATE TABLE mind_map_nodes (
    id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    source_note_id TEXT REFERENCES notes(id) ON DELETE SET NULL,
    source_line INTEGER,              -- line number in source document
    depth INTEGER NOT NULL DEFAULT 0,
    collapsed INTEGER DEFAULT 0,      -- 1 = children hidden
    x REAL, y REAL,                   -- last user-adjusted position
    style TEXT DEFAULT '{}',          -- color, icon, font overrides
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE mind_map_edges (
    id TEXT PRIMARY KEY,
    map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
    label TEXT,
    style TEXT DEFAULT '{}'
  );

  CREATE TABLE mind_maps (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
    layout TEXT DEFAULT 'dagre-tb',    -- dagre-tb | dagre-lr | elk-tb | elk-lr | radial
    ai_generated INTEGER DEFAULT 0,    -- 1 = structure from AI, 0 = from headings
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  -- Alternative: derive from document on-the-fly (no storage needed)
  -- Used when user has not explicitly saved the mind map layout.
  -- Nodes are computed from headings + positions cached in memory.
  CREATE VIEW v_mind_map_derived AS
    WITH RECURSIVE headings AS (
      SELECT id, parent_id, title, level, line_number
      FROM note_headings
      WHERE note_id = ?
      ORDER BY line_number
    )
    SELECT ...;  -- Recursive CTE builds tree, returned as flattened node set
  ```

- **Click-to-Navigate**: Each node stores `source_note_id` + `source_line`. Click scrolls the source document to that heading. If source is a different note, opens it in split view.

- **Collapse/Expand**: Click chevron on a parent node to hide/show its subtree. Collapsed branches are excluded from layout passes (Dagre treats them as leaf nodes).

- **Canvas Interaction**:
  - Drag nodes to reposition (user position overrides layout engine)
  - Zoom/pan same as #4 Spatial Canvas
  - Right-click → "Expand branch" / "Collapse all" / "Focus on this branch" (re-roots the layout)
  - "Focus" mode: selected node becomes virtual root, only its subtree shown in full viewport

- **Export**:
  ```text
  SVG: Vector output via HTML-to-SVG (svg.js or dom-to-svg)
  PNG: Rasterize via <canvas> at 2x/3x DPI
  OPML: Outline format (importable by MindNode, FreeMind, etc.)
  ```

- **Integration Points**:
  - **#4 Spatial Canvas**: Mind map renders inside a canvas node OR as standalone full-canvas view. Nodes are regular canvas nodes with `type: "mindmap"` — user can add other nodes around the mind map.
  - **#14 Node Map Editor**: Bidirectional — node map edits (add/remove links) reflected in mind map; mind map branch reorganization updates node map.
  - **#15 Doc Context Graph**: Context graph shows mind map branches as a sub-graph. Click a mind map node → context graph highlights its document neighbors.
  - **#3 Semantic Search**: Mind map node labels indexed. Search can find nodes by label and scroll to their position in the mind map.
  - **#36 CRDT**: Mind map layout syncs across devices. Node positions use last-writer-wins per node ID.
  - **#69 Export Engine**: Mind maps exportable as SVG, PNG, OPML, or embedded in exported note bundles.

- **Edge Cases**:
  - **Very deep nesting** (>6 levels): Clamp visible depth to 6. Deeper levels show a "+N more" badge on deepest visible parent.
  - **Empty document**: Show empty canvas with "Add headings or let AI suggest a structure" placeholder.
  - **No headings, AI offline**: Fall back to sentence-level clustering (paragraph as node, basic TF-IDF grouping). Lower quality but functional.
  - **Large documents** (>200 headings): Warn user "Large document — showing top 3 levels". Collapse H4+ by default.
  - **Orphan sources**: If source note deleted, node shows label with strikethrough + "Source deleted" tooltip. Node remains on canvas (user may want to keep it as a label).
  - **AI structure mismatch**: AI generates a topic the user disagrees with → user can drag that node to "Trash" (cross icon), which adds it to a blacklist. Future AI suggestions exclude blacklisted topics from this document.

---

## 32. Drawing / Handwriting (#9)

### What

Freehand drawing on canvas and notes via stylus, mouse, or touch. Users can sketch diagrams, annotate documents, highlight passages, and draw shapes over any content layer. Optional handwriting recognition converts ink strokes to text.

### Architecture

- **Rendering Engine**: Canvas 2D API with Fabric.js for vector stroke management. Strokes are retained as SVG path data (not rasterized), enabling resolution-independent zoom and edit-after-draw.
- **Input Pipeline**: PointerEvents API (unified mouse/touch/stylus) → gesture recognizer → stroke recorder:
  ```
  PointerEvents (pointerdown/move/up)
       ↓
  Input Normalizer (pressure, tilt, twist from PointerEvent)
       ↓
  Stroke Sampler (adaptive: <2ms at high velocity, up to 50ms when still)
       ↓
  Bezier Fitter (simplify raw points → cubic bezier curves → SVG path d)
       ↓
  Stroke Commit (append to stroke_data JSON, schedule persistence)
  ```
- **Stroke Types**: Rendered as `<path>` elements on an SVG overlay layer above the note content:
  - `pen` — solid stroke, round cap/join, variable width from pressure
  - `highlighter` — semi-transparent wide stroke, blend mode `multiply`
  - `eraser` — subtractive: clips/removes underlying stroke segments via SVG clip-path or stroke-by-stroke hit-test
  - `shape` — constrained geometry (line/arrow/rectangle/ellipse): on pointerup, raw stroke points are replaced with the fitted shape path
- **Layers**: Two-canvas architecture — content canvas (DOM/SVG of note) + drawing canvas (SVG overlay). Drawing layer can be toggled above or below content via z-index swap. Multiple drawing layers stored as separate canvas_id entries.
- **Handwriting Recognition** (optional):
  ```
  Stroke Data (SVG paths + timing)
       ↓
  Rasterize strokes to image (off-screen canvas, white bg)
       ↓
  MyScript Cloud API / Google Cloud Vision (OCR handwritten)
       ↓
  Return text candidates + confidence scores
       ↓
  Insert text at cursor or replace stroke layer
  ```
- **Pressure Sensitivity**: PointerEvents API provides `.pressure` (0–1) and `.tiltX`/`.tiltY`. Stroke width interpolated between `minWidth` and `maxWidth` based on pressure. Fallback to constant width on non-stylus devices.

### UI

- **Toolbar**: Floating palette, positioned near the active area (draggable). Auto-hides after 3s of inactivity when not in drawing mode. Reappears on stylus proximity (PointerEvent `pointerenter`) or toolbar trigger button.
  ```
  ┌──────────────────────────────┐
  │  ✏️  🖍  🧹  │  ┃  ⬛  ◯  ➡️  │  ← tool row        │
  │  ◉  ◉  ◉  ◉  ◉  ○  │  ← color swatches       │
  │  ─────●─────  │  ← stroke width (slider)   │
  │  100% ○────── │  ← opacity slider           │
  │  [Undo] [Redo] [✗ Done]   │
  └──────────────────────────────┘
  ```
- **Mode Indicator**: When drawing mode is active, a subtle border pulse on the canvas edge and a "Drawing" chip in the status bar.
- **Stroke Selection**: Lasso tool (hold Shift + drag) or click a stroke to select. Selected strokes show control points. Can move, delete, resize, or change color/width post-hoc.
- **Shape Constraints**: While drawing a shape stroke:
  - Hold Shift → constrain proportions (circle from ellipse, square from rect)
  - Hold Alt → draw from center outward
  - Snap indicators (dashed alignment lines) appear near existing stroke edges

### Data Model

```sql
CREATE TABLE drawing_strokes (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL REFERENCES drawing_canvases(id) ON DELETE CASCADE,
  stroke_data TEXT NOT NULL,   -- JSON array:
  -- [
  --   {
  --     "points": [[x,y,pressure,tiltX,tiltY,ts], ...],
  --     "color": "#1a1a1a",
  --     "width": 2.5,
  --     "opacity": 1.0,
  --     "type": "pen",          -- pen | highlighter | eraser | line | arrow | rect | ellipse
  --     "transform": "matrix(...)"  -- post-edit affine transform (move/rotate/scale)
  --   },
  --   ...
  -- ]
  sort_order INTEGER NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,       -- layer ordering within canvas
  layer_id TEXT REFERENCES drawing_layers(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE drawing_canvases (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  page_id TEXT,                             -- for #11 Slides: which slide
  name TEXT DEFAULT 'Drawing',
  visible INTEGER DEFAULT 1,
  locked INTEGER DEFAULT 0,                 -- prevent edits
  blend_mode TEXT DEFAULT 'normal',         -- normal | multiply (for highlighter)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE drawing_layers (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL REFERENCES drawing_canvases(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Layer 1',
  visible INTEGER DEFAULT 1,
  locked INTEGER DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 0,
  opacity REAL DEFAULT 1.0,
  created_at INTEGER NOT NULL
);

-- Handwriting recognition cache
CREATE TABLE handwriting_cache (
  stroke_hash TEXT PRIMARY KEY,   -- SHA256 of concatenated SVG paths
  recognized_text TEXT NOT NULL,
  confidence REAL NOT NULL,
  model_version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Index for canvas queries
CREATE INDEX idx_drawing_strokes_canvas ON drawing_strokes(canvas_id, z_index, sort_order);
```

### Integration Points

- **#4 Spatial Canvas**: Drawing canvas can be embedded as a canvas node (`type: "drawing"`) on the spatial canvas. Drawings scale/rotate with the node. Draw on top of other canvas elements.
- **#11 Slides**: Each slide has an optional drawing overlay. Annotations persist per slide. Drawing toolbar appears in slides mode with "Pen" and "Laser pointer" (transient, no persistence) modes.
- **#45 Voice Notes**: Combined mode — record voice while drawing. Stroke timing (`ts` in point data) synchronized with audio waveform. Playback replays strokes in sync with audio. Export as video (stroke replay + audio).
- **#36 CRDT**: Stroke operations are CRDT-compatible — each point append is an operation. Concurrent drawing on the same canvas merges via interleaved stroke reconciliation (last-writer-wins per stroke ID).
- **#69 Export Engine**: Drawings exported as SVG (vector) or PNG (raster). Embedded in PDF export as flattened image or vector layer.
- **#38 Undo/Redo**: Stroke-level undo stack (add/delete/modify). Shape fitting is a single undoable action.

### Edge Cases

- **Non-stylus devices**: PointerEvents fallback to mouse/touch. Pressure always 0.5 (constant width). Show tooltip "Pressure sensitivity available with Apple Pencil / stylus".
- **Very high-resolution displays**: SVG stroke coordinates in CSS pixels. Canvas DPR scaling ensures sharp rendering on Retina.
- **Thousands of strokes**: Virtualize rendering — only strokes in viewport are added to SVG DOM. Batch commit to SQLite every 5s during active drawing.
- **Undo during handwriting recognition**: If user triggers handwriting-to-text and then undoes the insertion, the original strokes must be restored (not lost). Keep stroke data until user explicitly deletes the drawing canvas.
- **Highlighter on dark mode**: Invert highlighter blend mode (lighten instead of multiply) when the note background is dark. Detect via `prefers-color-scheme` or per-note theme override.
- **Eraser on grouped strokes**: Eraser gestures apply a clip-path. If clipping leaves a degenerate path (zero-area), delete the stroke entirely.
- **Accidental palm rejection**: On iPad/tablet, ignore touches within 50px of the bottom edge when stylus is detected (palm rejection heuristic). Configurable in Settings.

---

## 33. Tree Map (#13)

### What

A treemap visualization of the note hierarchy that shows folders, tags, notebooks, or custom groupings as nested rectangles. Rectangle area encodes note count; color encodes recency or status. Users navigate the hierarchy by clicking to drill down or zoom into subtrees.

### Architecture

- **Layout Algorithm**: Squarified Treemap (Bruls-Huizing-Van Wijk) — optimizes rectangle aspect ratios to approach 1:1, minimizing skinny slivers. Implemented via D3.js `d3.treemap()` with `tile: d3.treemapSquarify`.
  ```
  Input: Hierarchy { name, value, children? }
     ↓
  d3.hierarchy() → root.sum(n => n.value) → root.sort(...)
     ↓
  d3.treemap().size([width, height]).padding(2).paddingInner(2).paddingOuter(4)
     ↓
  Output: [{ x0, y0, x1, y1, data: { name, count, color, children? } }]
     ↓
  D3 renders <rect> + <text> per node
  ```
- **Data Pipeline**:
  ```
  ┌─────────────────┐     ┌────────────────┐     ┌──────────────┐
  │ tag_counts       │     │                │     │              │
  │ folder_counts    │────→│ Aggregate View  │────→│ D3 Treemap   │
  │ note_metadata    │     │ (computed on    │     │ Render       │
  │ (last_modified,  │     │  query/open)    │     │ (SVG/Canvas) │
  │  status, author) │     │                │     │              │
  └─────────────────┘     └────────────────┘     └──────────────┘
  ```
- **Aggregation SQL** (simplified):
  ```sql
  -- By tag: count notes per tag, get max last_modified
  SELECT t.name AS group_name, COUNT(n.id) AS note_count,
         MAX(n.updated_at) AS last_modified
  FROM tags t
  JOIN note_tags nt ON nt.tag_id = t.id
  JOIN notes n ON n.id = nt.note_id
  WHERE n.deleted = 0
  GROUP BY t.id;

  -- By folder: recursive CTE for subfolder counts
  WITH RECURSIVE folder_tree AS (
    SELECT id, parent_id, name, 1 AS depth
    FROM folders WHERE parent_id IS NULL
    UNION ALL
    SELECT f.id, f.parent_id, f.name, ft.depth + 1
    FROM folders f JOIN folder_tree ft ON f.parent_id = ft.id
  )
  SELECT ft.name, COUNT(n.id) AS note_count, MAX(n.updated_at) AS last_modified
  FROM folder_tree ft
  LEFT JOIN notes n ON n.folder_id = ft.id AND n.deleted = 0
  GROUP BY ft.id;
  ```
- **Reactivity**: Data recomputed on note-create/delete/tag-change (debounced 1s via reactive query). Treemap transition animated with D3 transitions (~300ms ease-quad).
- **Zoom/Drill-Down**: Click a rectangle → `d3.treemap()` re-runs with that node as root, zoomed to fill the viewport. Breadcrumb bar appears above the treemap showing the drill-down path. "Back" button returns to previous level.

### UI

```
┌──────────────────────────────────────────────┐
│  Tree Map  [≡ View options ▾]  [↻ Refresh]   │
├──────────────────────────────────────────────┤
│  📁 All Notes > 📂 Research > 🏷️ AI          │ ← breadcrumb
├──────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│ │ 📁 Dev   │ │ 📁 Ideas │ │ 📁 Research     │ │
│ │   142    │ │    89    │ │     203         │ │
│ │ ████████ │ │ ████░░░ │ │ ████████████░░░ │ │
│ │ 3d ago   │ │ 1w ago  │ │     today       │ │
│ ├──────────┤ ├──────────┤ ├────────────────┤ │
│ │ 📁 Docs  │ │ 📁……     │ │ 📁 Publications│ │
│ │    56    │ │          │ │        98       │ │
│ │ ██░░░░░░ │ │          │ │ ███████░░░░░░░░ │ │
│ │ 2w ago   │ │          │ │     5d ago      │ │
│ └──────────┘ └──────────┘ └────────────────┘ │
│                                               │
│ Color: ██ Recent  ██ 1-7d  ██ 7-30d  ██ Stale│ ← legend
│ Size: Note count (linear scale)               │
└──────────────────────────────────────────────┘
```

- **Tooltip on Hover**:
  ```
  ┌────────────────────────┐
  │  📁 Research            │
  │  203 notes              │
  │  Last modified: Today   │
  │  Subgroups: 5           │
  │  ─────────────────────  │
  │  Click to drill down    │
  │  Right-click → filter   │
  └────────────────────────┘
  ```
- **View Options** (dropdown):
  - **Group by**: Tags | Folders | Month created | Author | Status
  - **Color by**: Recency (default) | Count | Status | Custom palette
  - **Layout**: Squarified (default) | Slice-and-dice | Binary
- **Right-Click Menu**:
  - "Filter to this group" — shows only notes in this category in the main list
  - "Show as list" — opens a flat note list filtered to this group
  - "Pin to sidebar" — pins this group as a saved filter
- **Keyboard Navigation**: Arrow keys to move between rectangles, Enter to drill down, Backspace to go up, Esc to reset to top level.

### Data Model

No dedicated tables — treemap is a **computed view** over existing metadata:

```sql
-- Materialized cache (refreshed periodically or on change)
CREATE TABLE treemap_cache (
  group_by TEXT NOT NULL,           -- 'tag' | 'folder' | 'month' | 'author' | 'status'
  group_name TEXT NOT NULL,         -- e.g. "Research", "2026-07", "chad"
  parent_group TEXT,                -- for hierarchical groupings (folder tree)
  note_count INTEGER NOT NULL,
  last_modified INTEGER NOT NULL,
  avg_recency_score REAL,           -- 0.0 (stale) to 1.0 (today)
  color_value REAL,                 -- normalized value for color scale
  PRIMARY KEY (group_by, group_name)
);

-- Index for fast lookup
CREATE INDEX idx_treemap_cache_group ON treemap_cache(group_by, parent_group);

-- Refresh trigger (via application hook, not SQL trigger)
-- Refreshed when: note created/deleted, tag changed, folder moved, note updated
```

### Integration Points

- **#2 Tag System**: "Group by Tags" mode uses the tag hierarchy as the treemap tree. Tag nesting (parent/child tags) produces nested rectangles.
- **#5 Hierarchical Docs**: "Group by Folders" mode mirrors the folder tree. Folder depth maps to treemap nesting level.
- **#15 Doc Context Graph**: Alternative visualization mode — context graph shows network links, treemap shows hierarchical clusters. Switch between them via view toggle. Clicking a treemap cell highlights that note cluster in the context graph.
- **#40 Note Query Language**: NQL results can feed the treemap. `GROUP BY author ORDER BY count` produces the tree structure. User can type `vis:treemap group:author color:recency` to open the treemap with those parameters.
- **#1 Semantic Search**: Treemap acts as a visual filter. Click a rectangle → that group is added as a search filter (tag:Research sort:recency).
- **#3 Quick Open (Cmd+K)**: Treemap groups appear as searchable entries. Type "treemap:research" to jump to that group.
- **#69 Export Engine**: Treemap exported as SVG or PNG for reports. Data table export (CSV of group name, count, recency).

### Edge Cases

- **Single group**: If all notes are in one folder/tag, treemap shows one large rectangle with a "No subdivisions" note. Offer "Switch to group by [other dimension]" suggestion chip.
- **Zero notes in view**: Empty state — "No notes match this grouping. Create a note or change group-by setting."
- **Deep folder nesting** (>10 levels): Treemap flattens after depth 6. Deeper levels shown as a "+N sub-items" badge on the closest visible parent. Drill-down still works to full depth.
- **Very many rectangles** (>500): Aggregate small groups (<0.5% of total) into an "Other" catch-all rectangle. Show count in tooltip.
- **Extremely stale data**: If `last_modified` spans years, color scale saturates at 90 days (anything older is max-stale red). Prevent misleading color differentiation between 6-months and 2-years stale.
- **Zero-width/zero-height rectangles**: Squarified algorithm guarantees non-zero area for groups with count > 0. Guard: `MAX(count, 1)` ensures no division-by-zero.
- **Mobile viewport**: Treemap switches to scrollable single-column hierarchy (list with indentation) on screens <500px wide. Touch interactions: tap to drill-down, long-press for tooltip.
- **Accessibility**: Treemap data available as a sortable table (alternative view). Screen readers: each rectangle has `role="button"` with `aria-label="Research, 203 notes, last modified today"`. Keyboard navigation as described above.

---

## 34. Multi-View Database (#10)

### Trigger & Entry Points

- **`/database` slash command** inside the editor — creates a new database block inline
- **Cmd+Shift+D** — quick-create a database from selection (selected notes become rows)
- **Sidebar create menu** "New Database" — creates a standalone database page
- **Right-click note → "Convert to Database"** — promotes a flat note into a database definition (existing headings become columns, bullet children become rows)
- **Inline embed** `@db(name)` — embeds a database view inside any note

### Architecture / Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Database Engine                        │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ Schema   │──▶│ View Adapter │──▶│ Render Engine  │  │
│  │ Manager  │   │              │   │                │  │
│  │          │   │ • Table      │   │ • Column       │  │
│  │ • Cols   │   │ • Gallery    │   │   formatters   │  │
│  │ • Types  │   │ • Kanban     │   │ • Cell         │  │
│  │ • Opts   │   │ • Calendar   │   │   editors      │  │
│  │          │   │ • List       │   │ • Drag reorder │  │
│  └────┬─────┘   └──────┬───────┘   └───────┬────────┘  │
│       │                │                    │           │
│       ▼                ▼                    ▼           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              SQLite Query Layer                   │   │
│  │  SELECT, INSERT, UPDATE, DELETE, AGG, GROUP BY   │   │
│  └──────────────────────────────────────────────────┘   │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  db_definitions  │  db_rows  │  db_views         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

- **Schema Manager** holds column definitions with types, default values, and validation rules. Columns can be reordered, renamed, and type-changed (with migration).
- **View Adapter** translates the unified row set into a view-specific data structure — table groups nothing, kanban groups by a select column, calendar groups by a date column, gallery extracts a cover-image column.
- **Render Engine** draws the view in the main content area. Each cell has a type-specific inline editor (date picker, number spinner, checkbox toggle, select dropdown, relation lookup).
- **Query Layer** handles all reads/writes through parameterized SQL. Formula and rollup columns are computed at query time, not stored.
- **Bidirectional sync**: when a row links to a note, changes in the database cell propagate to the note's properties and vice versa. This is event-driven via the app's change-feed bus.

### UI

**Database Toolbar** (top of every database view):
```
┌────────────────────────────────────────────────────────────────┐
│  [TableView] [Gallery] [Kanban] [Calendar] [List]  │  + Add   │
│  ──────────────────────────────────────────────────────────    │
│  Filter: [column] [op] [value]  +Add filter    Sort: [col] ▼  │
│  Group by: [col ▼]    Hide: [☑ col1] [☐ col2] [☐ col3]       │
└────────────────────────────────────────────────────────────────┘
```

**Table View**:
```
┌──────┬──────────┬────────┬──────────┬──────────┬─────────┐
│  #   │ Title    │ Status │ Due Date │ Priority │ Tags   │
├──────┼──────────┼────────┼──────────┼──────────┼─────────┤
│ ⠿  1 │ Design   │ █ Done │  Jul 4   │ ★★★     │ #ux    │
│ ⠿  2 │ Build    │ █ In.. │  Jul 8   │ ★★☆     │ #dev   │
│ ⠿  3 │ Test     │ █ Ope..│ —        │ ★☆☆     │ #qa    │
│      │          │        │          │          │         │ ← inline add
└──────┴──────────┴────────┴──────────┴──────────┴─────────┘
```
- Column headers: click to sort asc/desc, drag to reorder, right-click to hide/rename/delete/duplicate
- Each cell is click-to-edit inline with the appropriate widget
- Row drag handle (⠿) on the left for reorder
- Bottom row: always-visible "quick add" with title autofocus
- Multi-select rows: shift-click to select range, then bulk edit/delete/move

**Gallery View**:
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────┐ │
│ │ 📷   │ │ │ │ 📷   │ │ │ │ 📷   │ │ │ │ 📷   │ │
│ └──────┘ │ │ └──────┘ │ │ └──────┘ │ │ └──────┘ │
│ Design   │ │ Build    │ │ Test     │ │ Deploy   │
│ #ux      │ │ #dev     │ │ #qa      │ │ #ops     │
│ Jul 4    │ │ Jul 8    │ │ —        │ │ Jul 10   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```
- Card shows cover image (first image column or first attachment), title, tags, subtitle field
- Grid is responsive (reflow on resize), configurable card width (small/medium/large)
- Click card to open row detail panel (right panel), double-click to open linked note

**Kanban View**:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  To Do       │  In Progress │  Review      │  Done        │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │
│ │ Design   │ │ │ Build    │ │ │ Review   │ │ │ Deploy   │ │
│ │ ★★★      │ │ │ ★★☆      │ │ │ ★☆☆      │ │ │ ★★★      │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └──────────┘ │
│ ┌──────────┐ │ ┌──────────┐ │              │              │
│ │ Wireframe│ │ │ API      │ │              │              │
│ │ ★★☆      │ │ │ ★★★      │ │              │              │
│ └──────────┘ │ └──────────┘ │              │              │
│              │              │              │              │
│  + Add card  │  + Add card  │  + Add card  │  + Add card  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```
- Swimlanes are created from a **select-type column**; each unique value becomes a column
- Drag cards between columns to update the select value
- Collapsible columns (hide empty columns option)
- Card count badge on each column header
- WIP limit optional: column turns red when count exceeds limit

**Calendar View**:
```
┌─────── July 2026 ────────┐
│  Mo  Tu  We  Th  Fr  Sa  Su│
│        1    2    3    4   5│
│           ┌────┐ ┌────┐   │
│           │    │ │    │   │
│   6   7   8   9  10  11  12│
│  ┌────┐           ┌────┐  │
│  │    │           │    │  │
│ 13  14  15  16  17  18  19│
│                              │
│  +──────── Legend ───────+  │
│  █ Due date  █ Start date   │
│  █ Range (multi-day)        │
└──────────────────────────────┘
```
- Date column determines placement (single date = dot, date range = bar spanning cells)
- Click a date to quick-add a row with that date pre-set
- Month/week/day toggle, "Today" button, jump-to-date picker
- Drag existing card to a new date to update its date column

**Row Detail Panel** (right panel when a row is selected):
```
┌────────────────────────────┐
│  ⚙ Row Detail          [×] │
├────────────────────────────┤
│  Title: ☐ Design spec      │
│  Status: [Done        ▼]   │
│  Due:    [2026-07-04   📅] │
│  Tags:   [#ux] [#design]   │
│  ─────────────────────────  │
│  Linked Note: "Design doc" │
│  [Open note] [Unlink]      │
│  ─────────────────────────  │
│  Activity: Created Jul 1   │
│            Updated Jul 3   │
└────────────────────────────┘
```

### Data Model

```sql
-- Database definition (one per database)
CREATE TABLE db_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                          -- emoji icon
  columns JSON NOT NULL,              -- [{id, name, type, options, width, hidden}]
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Row in a database
CREATE TABLE db_rows (
  id TEXT PRIMARY KEY,
  db_id TEXT NOT NULL REFERENCES db_definitions(id) ON DELETE CASCADE,
  note_id TEXT,                       -- nullable; if set, links to a note (bidirectional)
  cells JSON NOT NULL,                -- {column_id: value, ...}
  position INTEGER NOT NULL DEFAULT 0,  -- for drag reorder
  archived INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
);

CREATE INDEX idx_db_rows_db ON db_rows(db_id, position);
CREATE INDEX idx_db_rows_note ON db_rows(note_id) WHERE note_id IS NOT NULL;

-- Saved view configuration
CREATE TABLE db_views (
  id TEXT PRIMARY KEY,
  db_id TEXT NOT NULL REFERENCES db_definitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('table', 'gallery', 'kanban', 'calendar', 'list')),
  config JSON NOT NULL,              -- view-specific: sort, filter, group, column widths, etc.
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_db_views_db ON db_views(db_id);

-- Relation links between databases (for relation-type columns)
CREATE TABLE db_relations (
  id TEXT PRIMARY KEY,
  source_db_id TEXT NOT NULL REFERENCES db_definitions(id) ON DELETE CASCADE,
  source_column_id TEXT NOT NULL,
  target_db_id TEXT NOT NULL REFERENCES db_definitions(id) ON DELETE CASCADE,
  target_column_id TEXT NOT NULL,     -- reverse relation column (auto-created)
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_db_relations_source ON db_relations(source_db_id);
CREATE INDEX idx_db_relations_target ON db_relations(target_db_id);
```

**Formula Engine** — formulas are parsed into an AST and evaluated at query time:
- Supported functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `CONCAT`, `IF`, `NOW`, `DAYS_BETWEEN`, `REGEX_EXTRACT`
- Expression syntax: `{column_name}`, `"string"`, `123`, `true/false`, `+ - * /`
- Formula columns are stored in the `columns` JSON as `{type: "formula", formula: "..."}` and computed via the query layer.

**Rollup Engine** — rollups aggregate values from a related database:
- Configured as `{type: "rollup", relation_column: "col_id", target_column: "col_id", aggregate: "sum|count|avg|min|max"}`
- Computed at query time by joining through `db_relations`.

### Integration Points

- **#37 Task Management**: Kanban view is the primary task board UI. Task status/priority/assignee map directly to select/number/relation columns. A task database is the default template for new task boards. Task-specific actions (assign, set due date, mark done) are rendered as column-type-aware inline controls.
- **#39 Custom Properties**: Column type definitions are shared with the custom property system. A database column `text` maps to a property `text` on the linked note. When a row links to a note, the note's custom properties panel shows the database columns as read-write fields with the same type widgets. Property schema changes in either direction sync bidirectionally.
- **#40 Note Query Language**: `nql:db("Tasks")` returns the database as a queryable source. `nql:db("Tasks").filter(status="Done").groupBy(assignee)` feeds into aggregation views. NQL WHERE clauses translate to SQL WHERE on `db_rows.cells` via JSON extraction.
- **#14 Node Map Editor**: Database relations (linked rows across DBs) can be visualized as edges in the node map. Each row becomes a node, each relation a labeled edge. "Visualize as graph" button on any database opens a node map pre-populated with its rows and relations.
- **#47 Inline Table**: The `/database` slash command renders inline as a miniature table view within a note body — same engine, reduced chrome (no toolbar, click header to expand to full database page).
- **#1 Semantic Search**: Database rows are indexed alongside notes. Searching for a row title or cell value returns the database row as a result with the database name as breadcrumb context.

### Edge Cases

- **Column type migration**: Changing a column from `text` to `number` triggers a validation pass. Non-numeric values are set to null and flagged in a migration report (shown as a toast: "3 values couldn't be converted"). Type change from `select` to `multi-select` merges existing single values into arrays. `formula` columns cannot be changed to another type (must delete and recreate).
- **Empty database**: First-time state shows a single "Untitled" row with the title column focused. Guided onboarding chip: "Add columns to get started" opens the column editor.
- **Zero rows matching filter**: Message "No rows match this filter" with a "Clear filters" action button. The filter bar stays visible so the user can adjust criteria.
- **Relation cycles**: Two databases that each relation-point to the other are allowed (N:M with junction). The UI shows a small warning badge on the relation column header: "Circular relation". Formula evaluation detects cycles and aborts with `#CIRCULAR` error.
- **Very large databases (>10,000 rows)**: Virtual scrolling for table/list/kanban (render ~50 rows in DOM). Gallery view paginates (50 per page). Calendar view aggregates dots per cell with a count badge when a single date has >5 events. Formula/rollup columns show `#CALC` placeholder and compute asynchronously via Web Worker.
- **Concurrent edits**: Optimistic local update with background sync. If two users edit the same cell, last-write-wins with a conflict toast: "Cell updated by another user". The losing edit is reverted in-place (no prompt).
- **Linked note deleted**: When a row's `note_id` reference is deleted, the row becomes a standalone entry. Cells remain intact, the "Linked note" section in the row detail shows "Note deleted" in red. A "Create new note from row" action promotes the row back to a linked note.
- **Select option renamed**: All rows using the old option name are migrated immediately on save (UPDATE in a single transaction). A confirmation dialog shows affected row count.
- **Calendar view with no date column**: If the user switches to calendar view but no date-type column exists, show a prompt: "Calendar view requires a date column. Create one?" with a quick-create flow.
- **Kanban with non-select group column**: If the group-by column is not `select` or `multi-select`, kanban view groups by unique values (text = each unique string, number = bucketed ranges, date = day/month/year). Show a subtle info bar: "Grouping by [column name] — values are bucketed automatically."

---

## 35. Node Map Editor (#14)

### Trigger & Entry Points

- **Sidebar "Graph" tab** — click to open the node map workspace (full-page editor)
- **`/graph` slash command** — embeds a node map inline or opens the full editor
- **Cmd+Shift+G** — opens the node map with the current note's context pre-populated
- **Right-click note → "Show in Node Map"** — opens the map highlighting that note and its immediate neighbors
- **From database view**: "Visualize as Graph" button opens a node map populated with database rows as nodes and relations as edges
- **Auto Mind Map (feature #12)**: Multi-select notes → right-click → "Create Mind Map" feeds into this editor

### Architecture / Flow

```
┌────────────────────────────────────────────────────────────┐
│                   Node Map Editor                           │
│                                                            │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Graph     │  │  Layout      │  │  Interaction     │   │
│  │  Model     │  │  Engine      │  │  Layer            │   │
│  │            │  │              │  │                   │   │
│  │ • Nodes    │  │ • Force-     │  │ • Drag & drop    │   │
│  │ • Edges    │  │   directed   │  │ • Pan/zoom       │   │
│  │ • Groups   │  │ • Dagre      │  │ • Click/select   │   │
│  │ • Styles   │  │   (hier.)    │  │ • Hover tooltip  │   │
│  │            │  │ • Custom     │  │ • Edge creation  │   │
│  └─────┬──────┘  │   layout    │  └────────┬─────────┘   │
│        │         └──────┬───────┘          │               │
│        ▼                ▼                  ▼               │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Canvas Renderer (SVG + HTML overlay)       │    │
│  │   d3-zoom + d3-drag + d3-force                     │    │
│  └─────────────────────┬──────────────────────────────┘    │
│                        │                                   │
│                        ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Persistence Layer                                  │    │
│  │  node_maps │ map_nodes │ map_edges                  │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

- **Graph Model**: Immutable state tree (MobX or Zustand) holding nodes, edges, selection, viewport. All mutations go through actions that batch updates to the persistence layer.
- **Layout Engine**: d3-force-simulation runs in a requestAnimationFrame loop at 60fps. On each tick, node positions update reactively. Dagre layout runs synchronously in a Web Worker (may block for <200ms on graphs up to 500 nodes).
- **Interaction Layer**: d3-drag on nodes, d3-zoom on canvas. Edge creation uses a temporary "dragging edge" — a dashed line from source node to cursor position. Drop on another node commits the edge.
- **Canvas Renderer**: SVG for nodes and edges (scalable, accessible). HTML overlay divs for rich note previews (embedded markdown, images). The SVG layer handles all geometry; the HTML layer handles content-heavy elements that benefit from browser layout.

### UI

**Full Editor Layout**:
```
┌────────────────────────────────────────────────────────────┐
│  Node Map: "Research Graph"              [Auto] [Save] [×] │
├──────────┬─────────────────────────────────────────────────┤
│ Toolbar  │  ┌─────────────────────────────────────────┐    │
│ ──────── │  │                                         │    │
│ [+] Node │  │       ⬡───➤⬡                             │    │
│ [+] Edge │  │      /     \                             │    │
│ 🔍 Search│  │     ⬡       ⬡───⬡                        │    │
│ ──────── │  │      \     /                             │    │
│   Styles │  │       ⬡───➤⬡                             │    │
│ █▤ Colors │  │           │                             │    │
│ ──────── │  │           ⬡                              │    │
│ Layout:  │  │  ┌─────────────────┐                     │    │
│ ○ Force  │  │  │  +──────────+   │                     │    │
│ ○ Dagre  │  │  │  │ Note     │   │                     │    │
│ ──────── │  │  │  │ preview  │   │                     │    │
│ Minimap  │  │  │  │ ...      │   │                     │    │
│ ┌──────┐ │  │  │  +──────────+   │                     │    │
│ │  ⬡   │ │  │  └─────────────────┘                     │    │
│ │  ⬢   │ │  └─────────────────────────────────────────┘    │
│ │  ⬡   │ │                                                │
│ └──────┘ │                                                │
└──────────┴────────────────────────────────────────────────┘
```

**Left Toolbar**:
- **Add Node** — opens a dropdown: "Note node" (search/create note), "Tag node" (select tag), "Concept node" (text input), "Group node" (container)
- **Add Edge** — enters edge-drawing mode (cursor changes to crosshair), click source then target
- **Search** — filters visible nodes by name; matching nodes highlight, non-matching dim to 20% opacity
- **Styles panel** — color picker, size slider, icon selector for selected nodes; stroke color/width/label for selected edges
- **Layout toggle** — Force-directed / Dagre hierarchical. "Auto" button runs the selected layout. "Stop" button freezes the simulation.

**Canvas Area**:
- **Pan**: click-drag on empty canvas space or middle-mouse drag. Scroll to zoom (zoom range: 0.1x to 5x).
- **Select node**: single click. Shift+click to multi-select. Click-drag rectangle to lasso-select.
- **Drag node**: click and drag to reposition. Snap-to-grid when enabled (default 20px grid, toggle with Cmd+'). Dragged node position becomes pinned (immune to auto-layout until "Release pinned nodes" action).
- **Create edge**: hover a node reveals two connection ports (small circles on left/right edges of the node). Drag from a port to another node to create an edge. Release on empty space cancels.
- **Double-click node**: opens the linked note (note node), opens tag filter (tag node), opens rename prompt (concept node), toggles collapse (group node).
- **Right-click node**: context menu — Edit, Delete, Duplicate, "Open note", "Paste as child", "Center on node", Pin/Unpin position.
- **Group nodes**: drag a node onto a group node to nest it. Group shows a collapsible header bar. Collapsed group hides children and shows a count badge.
- **Minimap** (bottom-left corner): small overview of the entire graph with a viewport rectangle. Click-drag the rectangle to pan the main canvas.

**Node Visual Styles**:
```
Note node:     ⬡ Rectangle with rounded corners, shows title + first 2 lines of content
Tag node:      ⬢ Hexagon, colored by tag color, shows tag name
Concept node:  ◯ Circle, shows concept label, no link
Group node:    ⬡ Large rectangle with dashed border, header with collapse toggle
```

**Edge Visual Styles**:
```
Directed:     ────➤   Arrow at target end
Undirected:   ──────  No arrow
Labeled:      ────➤   Text label centered on edge
Dashed:       - - - - For inferred/weak relationships
```

### Data Model

```sql
-- Node map definition
CREATE TABLE node_maps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  layout_config JSON NOT NULL DEFAULT '{}',  -- {defaultLayout, snapToGrid, gridSize, zoom, pan}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Nodes in a map
CREATE TABLE map_nodes (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES node_maps(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK(node_type IN ('note', 'tag', 'concept', 'group')),
  note_id TEXT,                             -- set when node_type = 'note'
  tag_id TEXT,                              -- set when node_type = 'tag'
  label TEXT,                               -- set when node_type = 'concept' or override label for note/tag
  x REAL NOT NULL,
  y REAL NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,        -- 1 = immune to auto-layout
  collapsed INTEGER NOT NULL DEFAULT 0,     -- for group nodes: hide children
  parent_group_id TEXT REFERENCES map_nodes(id) ON DELETE CASCADE,
  style JSON NOT NULL DEFAULT '{}',         -- {color, size, icon, borderColor, borderWidth}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_map_nodes_map ON map_nodes(map_id);
CREATE INDEX idx_map_nodes_parent ON map_nodes(parent_group_id);
CREATE INDEX idx_map_nodes_note ON map_nodes(note_id) WHERE note_id IS NOT NULL;
CREATE INDEX idx_map_nodes_tag ON map_nodes(tag_id) WHERE tag_id IS NOT NULL;

-- Edges between nodes
CREATE TABLE map_edges (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES node_maps(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
  target_node_id TEXT NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'directed' CHECK(edge_type IN ('directed', 'undirected', 'dashed')),
  label TEXT,
  style JSON NOT NULL DEFAULT '{}',         -- {color, width, dashArray, labelOffset}
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_map_edges_map ON map_edges(map_id);
CREATE INDEX idx_map_edges_source ON map_edges(source_node_id);
CREATE INDEX idx_map_edges_target ON map_edges(target_node_id);

-- Auto-layout cache (computed, regenerated on layout trigger)
CREATE TABLE map_layout_cache (
  map_id TEXT PRIMARY KEY REFERENCES node_maps(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL,                -- 'force' or 'dagre'
  positions JSON NOT NULL,                  -- {node_id: {x, y}, ...}
  computed_at INTEGER NOT NULL
);
```

### Integration Points

- **#4 Spatial Canvas**: Node maps can be embedded as objects on the spatial canvas (drag from the node map onto the canvas). The embedded map auto-updates when the source map changes. Double-click an embedded map to "open full editor."
- **#12 Auto Mind Map**: Multi-select notes → "Create Mind Map" generates a node map with a tree layout (Dagre hierarchical). The leaf nodes are the selected notes; internal nodes are auto-created concept nodes based on common tags. The user then fine-tunes with the node map editor. The auto-layout button re-runs the hierarchical layout.
- **#15 Doc Context Graph**: Every note has a context graph (mini-map in the right panel showing that note + its immediate neighbors — backlinks, forward links, tags). This mini-map is a **filtered view** of the same `node_maps`/`map_nodes`/`map_edges` tables. Click "Expand" on the mini-map to open the full node map centered on that note. The context graph reuses the same rendering component with a smaller canvas and simplified toolbar (no add/delete, pan/zoom only).
- **#17 Drill-Down Graph**: Double-click a note node in the node map to "drill down" — the view transitions (animated zoom) to show that node's ego network (the node, its immediate neighbors, and edges one hop out). A breadcrumb bar at the top shows the drill path: `Research Graph > Machine Learning > Transformers`. Click a breadcrumb to zoom back out. This is implemented by applying a graph filter (keep only the ego subgraph) and re-running force layout constrained to the current viewport.
- **#10 Multi-View Database**: The "Visualize as Graph" button creates a node map from a database: each row becomes a note-type node (or concept node if no linked note), each relation column becomes an edge. The map is read-only by default but the user can "Unlink from DB" to make it a standalone editable map. Column values appear as edge labels or node properties in the tooltip.
- **#14 (this feature) Self-referential**: Node maps can contain nodes that link back to other node maps (as "map reference" nodes). Opening that node opens the referenced map inline (embedded view). This enables map-of-maps navigation for large knowledge bases.

### Edge Cases

- **Single node, no edges**: Editor opens with one node centered. Tooltip prompt: "Drag from the connection port to create edges." The canvas is empty but not dead — user can pan, zoom, add nodes.
- **Overlapping nodes on auto-layout**: Force-directed simulation includes collision detection (node bounding boxes repel each other). If overlap persists after 1000 ticks (unlikely but possible with heavy pinning), show badge: "N nodes overlap — run auto-layout to resolve." Dagre layout guarantees no overlap.
- **Very large graphs (>1,000 nodes)**: Force simulation runs with adaptive quality — uses Barnes-Hut approximation (theta=0.8) for performance. Nodes beyond 500 are rendered as simple dots (no label, no preview) until zoomed in. Virtual viewport culling: nodes outside the visible canvas + 50% margin are not rendered. Edges beyond 2,000 are not rendered by default; toggle "Show all edges" in toolbar.
- **Orphan nodes after edge deletion**: No special handling — standalone nodes are valid. A "Find isolated nodes" toolbar action highlights nodes with zero edges for possible cleanup.
- **Deleted note referenced by a note node**: The node remains on the map but turns grey with a "broken link" icon (⚠). Right-click → "Remove node" or "Re-link to another note." The node still displays the note's title (from the node's cached `label` field) with a strikethrough style.
- **Group with no children**: Collapse toggle is hidden. Group node renders as a regular-sized container with "Empty group" ghost text. Drag a node onto it to populate.
- **Snap-to-grid with rotated/diagonal edges**: Snapping applies only to node positions (x, y snapped to grid). Edge paths are unaffected — they remain geometric lines between snapped node centers. Dagre layout always produces orthogonal edges regardless of snap.
- **Edge source == target (self-loop)**: Not allowed — the edge-creation interaction prevents dragging onto the source node. If programmatic creation (via API/data import) produces a self-loop, it is silently dropped with a warning logged.
- **Accessibility**: Node map has a tab-order through all visible nodes. Enter activates a node, Space toggles selection, Tab/Shift+Tab cycles focus. Selected node shows a focus ring. A "Graph as List" toggle switches to an accessible tree/table view of nodes and edges with screen-reader-friendly labels. All drag operations have keyboard alternatives: arrow keys move selected node by 1px (or 10px with Shift), Ctrl+Arrow moves to the nearest node in that direction (snap-connect).
- **Mobile/touch**: Pinch-to-zoom, two-finger pan, tap to select, long-press to drag (with 300ms delay), double-tap to open/expand. The minimap is touch-draggable. Edge creation on mobile: long-press a node, then drag to target (visualized as a stretching rubber band). The toolbar collapses into a bottom sheet with icon buttons.

## 36. Doc Context Graph (#15)

**Priority:** High
**Status:** Draft
**Dependencies:** #3 (Graph DB / Edge Indexing), #18 (Edge Weight / Similarity Scoring)
**Inverse Dependencies:** #14 (Node Map Editor — shared renderer), #17 (Query Drill-Down — opens context scope), #24 (Briefing Panel — embeds context snapshot)

### What

A mini graph visualization in the right panel showing the currently active note and its surrounding connections within a 1–2 hop radius. The user sees at a glance which notes link to the current one, which it links to, and which are semantically similar — without leaving the editor.

### Architecture

The context graph is a lightweight instance of the same force-directed layout used by the Node Map Editor (#14), but scoped to a single pivot note.

**Computation Pipeline:**
```
Active note ID → fetch 1-hop edges (wiki-links + backlinks) →
              → fetch 2-hop edges (from 1-hop neighbors, capped) →
              → fetch auto-similar edges (from similarity index) →
              → merge, deduplicate, rank → run force simulation →
              → render to canvas
```

1. **Edge fetching** — Two parallel queries into the edge store:
   - Wiki-links + backlinks from `edges` table where `source_id = :note_id OR target_id = :note_id`
   - Auto-similar edges from the similarity index (cosine similarity on TF-IDF vectors above threshold 0.25)
2. **Radius control** — Default: 1 hop (immediate neighbors). 2-hop expansion is lazy: clicking "Expand" on a neighbor fetches that node's 1-hop context and merges it. Total visible nodes capped at 50.
3. **Force layout** — Uses d3-force with the current note pinned at center (fx/fy fixed). Connected nodes orbit with spring tension proportional to edge weight. Collision detection prevents overlap.
4. **Caching** — Results are written to `context_graph_cache` and invalidated on any edge change affecting the pivot note. Cache TTL: 30 minutes, or immediate invalidation via webhook on write.

### UI / Interaction

```
┌──────────────────────────────┐
│  Doc Context Graph    [⚙] [×] │
├──────────────────────────────┤
│                              │
│         ┌──────┐            │
│    ┌────┤ NoteC ├────┐       │
│    │    └──────┘    │       │
│  ┌─┴─┐            ┌─┴─┐    │
│  │ A │   ════    │ D │    │
│  └───┘  Current  └───┘    │
│   ║     ┌─────┐   ║       │
│   ║     │NoteB │   ║       │
│  ┌─┴─┐   └─────┘ ┌─┴─┐    │
│  │ E │           │ F │    │
│  └───┘           └───┘    │
│         [Expand ▾]         │
├────────────────────────────┤
│ Key: — wiki-link  - - backlink  ══ auto-similar │
└──────────────────────────────┘
```

- **Current node** — Centered, larger radius, bold title, subtle glow ring
- **Neighbor nodes** — Smaller, arranged radially, show truncated title (12ch max)
- **Edges** — Three styles: solid (wiki-link), dashed (backlink), dotted (auto-similar). Hover reveals tooltip with edge type + weight
- **Interactions:**
  - Click a neighbor node → navigate to that note (push to main editor)
  - Hover an edge → tooltip: `"wiki-link · weight: 0.8"`
  - Drag a node → temporary reposition (resets on next cache refresh)
  - "Expand" button on hover → loads that node's 1-hop context
  - "Focus mode" button → recenters the graph on the selected node
- **Toolbar** — Top-right: refresh, pin/unpin current, toggle auto-similar edges, export as PNG
- **Collapse/expand** — Panel can be hidden via right-panel tab bar; state persisted in user preferences

### Data Model

```sql
-- Cache for computed context graphs
CREATE TABLE context_graph_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id TEXT NOT NULL UNIQUE,
    graph_json TEXT NOT NULL,          -- Serialized { nodes: [], edges: [] }
    hop_count INTEGER NOT NULL DEFAULT 1,
    computed_at TEXT NOT NULL DEFAULT (datetime('now')),
    edge_hash TEXT,                    -- Hash of edge set for invalidation
    FOREIGN KEY (note_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX idx_cgc_note_id ON context_graph_cache(note_id);
CREATE INDEX idx_cgc_computed_at ON context_graph_cache(computed_at);

-- Edge weight metadata (shared with #18)
CREATE TABLE edge_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    edge_type TEXT NOT NULL CHECK(edge_type IN ('wiki_link', 'backlink', 'auto_similar')),
    weight REAL NOT NULL DEFAULT 1.0 CHECK(weight >= 0 AND weight <= 1),
    computed_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata JSON,                     -- { method: 'tfidf'|'embedding', source_snippet, ... }
    FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES nodes(id) ON DELETE CASCADE,
    UNIQUE(source_id, target_id, edge_type)
);

-- User preferences for the panel
CREATE TABLE context_graph_prefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    panel_visible INTEGER NOT NULL DEFAULT 1,
    auto_similar_visible INTEGER NOT NULL DEFAULT 1,
    default_hop_count INTEGER NOT NULL DEFAULT 1,
    max_visible_nodes INTEGER NOT NULL DEFAULT 50,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #3 | Edge store queries for wiki-links and backlinks; writes flow through the same indexing pipeline |
| #14 | Shared canvas renderer and force-simulation module; "Open in Node Map" opens current scope in full editor |
| #17 | "Expand on node" triggers a drill-down query scoped to that node's subgraph |
| #18 | Edge weights determine spring tension; auto-similar edges come from the similarity index |
| #24 | Briefing panel can embed a static snapshot (PNG) of the context graph for the active note |
| #32 | Dashboard stats includes "Avg context graph density" metric |

### Edge Cases

- **Note with zero connections**: Graph shows only the centered node with a muted message: "No connections yet. Start linking from the editor." A "+" button invites creating the first wiki-link.
- **2-hop explosion (>50 nodes)**: 1-hop neighbors are prioritized by edge weight; remaining nodes above the cap are collapsed into a "N more nodes" ghost node with a dotted border. Clicking it loads the next page.
- **Stale cache after bulk edit**: The `edge_hash` column stores an MD5 of the edge set; on any write to `edges` affecting this pivot, the cache row is invalidated synchronously.
- **Very long note titles (>12ch)**: Rendered with text-overflow ellipsis on the node label. Full title shown in the edge-hover tooltip and on click.
- **Circular 2-hop reference (A→B→A)**: Dedup logic removes the pivot note from its own neighbor set; it always remains the single center node.
- **Hidden auto-similar edges (privacy)**: Users can disable auto-similar edge rendering in preferences. Auto-similar edges are never computed for notes in private/restricted-access folders unless the current user has read permission on both endpoints.
- **Offline / no similarity index**: Context graph degrades gracefully — wiki-links and backlinks still render. A warning chip appears: "Similarity edges unavailable (index not loaded)."
- **Panel on mobile**: Context graph panel becomes a full-screen overlay triggered by a fab button. The canvas is zoomable/pannable. Edge hover becomes tap-to-inspect with a popover.

## 37. Doc Hierarchy Tree (#16)

**Priority:** High
**Status:** Draft
**Dependencies:** #5 (Sidebar Framework — panel slot + drag-drop), #42 (Inbox — shows inbox node count badge)
**Inverse Dependencies:** #32 (Dashboard — stats per folder), #40 (Smart Folders — rendered as tree nodes), #47 (Auto-Classification — highlights target folder)

### What

A traditional sidebar tree view showing the user's document and folder hierarchy — familiar from VS Code, Notion sidebar, or Obsidian file explorer. The primary navigation surface for browsing, opening, and organizing documents.

### Architecture

The tree is a virtualized, composable component with a pluggable node model. It serves as the primary navigation anchor for the entire app.

**Tree Model:**
```
TreeNode {
  id: string
  type: 'folder' | 'document' | 'tag_group' | 'smart_folder'
  label: string
  icon?: string
  children?: TreeNode[]
  badge?: { count: number, variant: 'unread' | 'dirty' | 'warning' }
  meta: { path: string, created_at: string, updated_at: string }
  collapsed: boolean
  draggable: boolean
  droppable: boolean
  contextMenu: MenuItem[]
}
```

**Rendering Pipeline:**
```
Workspace metadata → build tree from folder hierarchy + doc metadata →
                     inject tag groups and smart folders at configured depth →
                     sort (alphabetical / manual / by type) →
                     flatten into virtual list → render visible nodes
```

1. **Data source** — Tree is built from `sidebar_children` table for folder structure, with `nodes` table for leaf documents. Smart folders and tag groups are computed on-the-fly from saved queries and tag metadata.
2. **Virtualization** — Uses a virtual list (react-window or similar) that only renders visible nodes. For trees with >500 items, this is critical for scroll performance. Each row is ~32px with 16px indent per depth level.
3. **State management** — Tree state (expanded/collapsed IDs, scroll offset, search query) is persisted in `sidebar_tree_state` on every significant change (debounced 500ms).
4. **Drag-drop** — Uses HTML5 Drag and Drop API with a custom visual indicator (insertion line between nodes, highlight on hover-enter for folders). Cross-folder moves require confirmation. Undo is available via snackbar for 5 seconds.

### UI / Interaction

```
┌──────────────────────────────┐
│ 🔍 Search tree...    [⚙]    │
├──────────────────────────────┤
│ 📁 Workspace                 │
│  ├─ 📁 Inbox           (3)  │  ← badge: unread count
│  ├─ 📁 Projects              │
│  │  ├─ 📁 Project Alpha      │
│  │  │  ├─ 📄 Spec.md         │
│  │  │  ├─ 📄 Notes.md   ●   │  ← dirty indicator (unsaved)
│  │  │  └─ 📁 Research        │
│  │  └─ 📁 Project Beta       │
│  ├─ 🏷️ Tags                  │
│  │  ├─ 🔖 #meeting-notes     │
│  │  └─ 🔖 #architecture      │
│  ├─ ⚡ Smart Folders          │
│  │  ├─ ⚡ Recent              │
│  │  └─ ⚡ Need Review         │
│  └─ 🗑️ Trash                 │
└──────────────────────────────┘
```

- **Node icons** — Context-aware: 📁 for folders, 📄 for documents, 🏷️ for tag groups, ⚡ for smart folders, 🗑️ for trash
- **Expand/collapse** — Click chevron ▶/▼ to toggle. Double-click on folder label also toggles
- **Select** — Single click selects the node (highlights background). Selected node drives the main editor (#5)
- **Context menu** — Right-click on any node:
  - Folder: New Document, New Folder, Rename, Move, Delete, Copy Link
  - Document: Open, Rename, Move, Duplicate, Delete, Copy Link, Copy Path
  - Tag group: Expand All, Collapse All, Manage Tags
  - Smart folder: Edit Query, Refresh, Delete
- **Drag-drop** — Drag a node to reorder or move between folders. Visual insertion line appears between nodes. Dropping on a folder nests the item. Snackbar: "Moved to Projects" with Undo button (5s timeout)
- **Search** — Type in the search bar to filter tree in real-time. Matches against node labels and paths. Tree temporarily flattens to show only matching nodes with their parent chain highlighted.
- **Badges** — (3) for unread count on folders (from #42). ● for dirty/unsaved documents (from editor state). Warning icon for broken links.
- **Keyboard navigation** — Arrow Up/Down to move selection, Arrow Left/Right to collapse/expand, Enter to open, F2 to rename, Delete (with confirm) to delete, Ctrl+Shift+E to reveal current note in tree

### Data Model

```sql
-- Folder hierarchy (adjacency list)
CREATE TABLE sidebar_children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id TEXT,                      -- NULL for root-level items
    child_type TEXT NOT NULL CHECK(child_type IN ('folder', 'document', 'tag_group', 'smart_folder')),
    child_id TEXT NOT NULL,              -- References nodes.id, tags.id, or smart_folders.id
    sort_order REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_sc_parent ON sidebar_children(parent_id);
CREATE INDEX idx_sc_child ON sidebar_children(child_id, child_type);

-- Folder metadata
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_ghost INTEGER NOT NULL DEFAULT 0  -- System folder (Inbox, Trash)
);

-- Persisted tree view state per user
CREATE TABLE sidebar_tree_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    expanded_node_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array of expanded node IDs
    scroll_offset INTEGER NOT NULL DEFAULT 0,
    selected_node_id TEXT,
    search_query TEXT NOT NULL DEFAULT '',
    last_accessed TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- Smart folder definitions (see #40 for full schema)
CREATE TABLE smart_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    query JSON NOT NULL,                -- Saved search query object
    icon TEXT DEFAULT '⚡',
    auto_refresh INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #5 | Primary navigation surface — selecting a tree node loads the document in the main editor panel |
| #32 | Dashboard stats widget shows per-folder counts (total docs, avg size); tree provides the folder list |
| #40 | Smart folders appear as a collapsible section in the tree; saved queries drive their contents |
| #42 | Inbox node shows unread count badge; clicking opens the inbox view |
| #47 | Auto-classification highlights the suggested target folder with a pulsing glow when a document is ready to be moved |

### Edge Cases

- **Very deep nesting (>10 levels)**: Indentation caps at 8 levels visually (deeper levels all indent at the same max offset). A tooltip on hover shows the full path. Users are warned when creating a folder deeper than 6 levels: "Deep nesting may impact performance."
- **5000+ items in a single folder**: Virtual list renders only visible rows (~20-30). The folder is collapsed by default if it contains >200 children. A "Show all N items" prompt appears for the first expansion.
- **Drag-drop between pinned and lazy-loaded sections**: Tag groups and smart folders are not drop targets (no-op with visual rejection cursor 🚫). Cross-section drag (e.g., document into tag group) shows a clear visual error state.
- **Simultaneous drag by multiple users (collaborative)**: Optimistic UI update with server reconciliation. If another user moves the same node, the later write wins and a toast notifies: "Item was also moved by {user} — your move was overwritten."
- **Deleted parent folder with children**: Folder moves to Trash. Children remain in their folder; the trash shows "(N items)" in the folder name. Restoring the folder restores all children at their original positions. Permanently deleting a folder also deletes all children (with a confirmation dialog showing count).
- **Search while tree is collapsed**: Search auto-expands parent chains of matching nodes. When search is cleared, the tree returns to its previous collapsed state. Search results are sorted by relevance (exact title match > prefix > substring).
- **Stale smart folder results**: Smart folders are refreshed on tree open and on a 60-second interval when the panel is visible. A "Refreshing..." spinner appears for queries taking >2 seconds. Stale results are shown until the refresh completes.
- **Accidental drag-drop**: Every cross-folder move shows a confirmation dialog for the first move in a session (subsequent moves skip confirm). Undo snackbar appears for 5 seconds. Right-click → "Move History" shows the last 10 moves with one-click revert.
- **Folder with no read permission**: The folder appears in the tree but is greyed out with a lock icon (🔒). Clicking it shows a "Request access" dialog. Children of restricted folders are not enumerated until access is granted.
- **Empty state**: A workspace with no folders shows a single root node "Workspace (empty)" with a prompt: "Create your first folder or document" and a "+" button.
- **Mobile**: Tree becomes a slide-out drawer (bottom sheet on very small screens). Expand/collapse uses larger touch targets (44px). Drag-drop is replaced by a "Move to..." action in the context menu. Search is always visible when the drawer opens.

## 38. Drill-Down Graph (#17)

**Priority:** High
**Status:** Draft
**Dependencies:** #14 (Node Map), #15 (Context Graph), #18 (Connection Strength)
**Inverse Dependencies:** #16 (Doc Hierarchy Tree), #33 (Global Search)

### What

An interactive, animated graph visualization that lets users navigate through linked notes visually. Clicking a node smoothly re-centers the view on that node and its immediate neighbors, creating a drill-down navigation experience. Unlike the static Node Map, the Drill-Down Graph supports deep traversal through the link graph with fluid zoom/pan transitions and a breadcrumb trail for history-based navigation.

### Architecture

The Drill-Down Graph is a canvas-layer component powered by a force-directed layout engine (D3-force or @antv/g6) that renders a focused subgraph around the current "center" node.

**Core state machine:**

```
IDLE → (user clicks node) → ANIMATING → (transition completes) → FOCUSED → (user clicks another node) → ANIMATING → ...
                                                              → (user presses Back) → ANIMATING → FOCUSED (previous center)
                                                              → (user presses Esc) → IDLE (reset to initial view)
```

**Data flow:**

1. **Current focal node** stored in a reactive atom (`focalNodeId`).
2. When `focalNodeId` changes, the graph queries the link store for all edges from/to that node within a configurable depth (default: 1 hop).
3. A subgraph is built: center node + immediate neighbors + edges between them.
4. The layout engine runs force simulation on the subgraph (~100ms), then triggers a smooth zoom/pan transition (`d3.transition` with ease-in-out, ~400ms) to position the center node at the viewport midpoint.
5. Edge rendering reads `connection_strength` from the `connection_scores` table — thickness is proportional to strength (1–6px stroke-width).

**Animation pipeline:**

```
prev viewport → compute target bounding box of new subgraph → interpolate zoom/pan → render each frame
                                    ↑
                           (D3 zoom behavior)
```

Each animation frame invalidates the canvas and re-draws via `requestAnimationFrame`. Nodes are rendered as circles (or colored by tag). Text labels fade in after the transition settles (200ms delay).

### UI / Interaction

```
┌──────────────────────────────────────────────────────────────┐
│ [← Back]  [🔍 +] [🔍 -]  [⛶ Fullscreen]   Breadcrumb:     │
│                                               Notes > Dev >  │
│                                               Architecture   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │              ┌──────────┐                                │ │
│  │              │  Doc C   │                                │ │
│  │               ───┬───                                      │ │
│  │                  │                                        │ │
│  │    ┌──────────┐ ┌┴───────┐ ┌──────────┐                  │ │
│  │    │  Doc B   │ │  Doc A  │ │  Doc D   │                  │ │
│  │    │          │ │(center) │ │          │                  │ │
│  │    └──────────┘ └────────┘ └──────────┘                  │ │
│  │                  │                                        │ │
│  │               ┌──┴───────┐                                │ │
│  │               │  Doc E   │                                │ │
│  │               └──────────┘                                │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│  [Hovering Doc B: "Connection: 0.72 (Strong)"]   Zoom: 85%   │
└──────────────────────────────────────────────────────────────┘
```

- **Toolbar**: Back button, zoom controls (+/-), fullscreen toggle, breadcrumb trail (clickable to jump to previous focal nodes).
- **Canvas**: Force-directed graph. Center node is highlighted (larger radius, glow ring). Nodes are clickable. Hovering a node shows a tooltip with title, tag, and connection strength to center node.
- **Deep zoom**: When zoomed >3x, nodes that overlap significantly (>50% of viewport) auto-expand to show a document preview card (title, first 100 chars of content, creation date) as an overlay.
- **Presentation mode**: Full-screen canvas with hidden chrome. Enter via ⛶ button or `F11`. Exit via Esc or `F11`.
- **Context menu**: Right-click on a node → Open in editor, Open in Node Map, Copy link, Pin to graph.

### Data Model

No new tables. Reads from:
- `documents.id`, `documents.title` (node display)
- `links.source_id`, `links.target_id`, `links.link_type` (edges)
- `connection_scores.score` (edge thickness)
- `tags.id`, `tags.name` (node coloring)

### Integration Points

| Feature | Integration |
|---------|-------------|
| #14 | Initial node position and graph topology seeded from the Node Map's layout data; the Drill-Down Graph is a focused, interactive subset of the full Node Map |
| #15 | Context Graph provides the "halo" of related nodes beyond 1-hop neighbors — click a node's halo button to expand the subgraph depth |
| #18 | Connection strength drives edge thickness (width = strength × 5px + 1px base). Strong edges rendered as solid lines, moderate as dashed, weak as dotted. The tooltip shows the strength score and category |
| #33 | Search results include a "Show in Graph" action that opens the Drill-Down Graph centered on the result document |
| #28 | Daily Briefing "Top Connections" card links into the graph centered on the recommended note |

### Edge Cases

- **Node with >50 connected neighbors**: Force simulation throttles rendering — only top 30 edges (by connection strength) are shown initially. A "Show all N connections" button appears in the toolbar. Additional nodes stream in with a staggered animation (~50ms interval).
- **Orphan node (no links)**: Graph shows the single node with a subtle pulse animation and an empty-state helper: "This note has no connections yet. Try linking it to other notes." A "Suggest links" button triggers AI auto-suggest (#7).
- **Rapid clicking / navigation queue**: Each click enqueues a target focal node. If a new click arrives while animating, the current animation is interrupted (transition.abort()) and the queue is replaced with the latest target. No back-pressure buildup.
- **Malformed edge data**: If a link references a deleted document, the node is rendered as a grey "ghost" node with a dashed outline and a tooltip: "Deleted document — remove this link?"
- **Empty workspace**: Graph displays a centered message: "Create your first two linked notes to see the graph." with a "New Note" CTA.
- **Accessibility**: Keyboard navigation via Tab to focus the canvas, Arrow keys to move between adjacent nodes (nearest-neighbor walk based on viewport position), Enter to focus a node, Backspace to go back. Screen readers get an aria-live region announcing the current focal node and neighbor count.

## 39. Connection Strength (#18)

**Priority:** High
**Status:** Draft
**Dependencies:** #7 (AI Embedding), #10 (Block References & Backlinks), #28 (Daily Briefing), #31 (Auto-Suggest Backlinks)
**Inverse Dependencies:** #14 (Node Map), #17 (Drill-Down Graph), #33 (Global Search)

### What

An AI-powered relevance scoring system that computes a multi-factor connection strength between any two notes. Scores range from 0.0 (unrelated) to 1.0 (strongly related) and are surfaced throughout the app — as edge weights in graph views, as ranking signals in search, as daily briefing recommendations, and as auto-suggest backlink candidates. The score is cached in a dedicated table and recalculated incrementally when notes change.

### Architecture

**Scoring formula:**

```
connection_strength = w1·link_factor + w2·tag_overlap + w3·embedding_similarity + w4·ref_cooccurrence + w5·time_proximity
```

**Default weights:**

| Weight | Factor | Value | Rationale |
|--------|--------|-------|-----------|
| w1 | link_factor | 0.25 | Explicit links are strongest signal but sparse |
| w2 | tag_overlap | 0.20 | Shared taxonomy is a reliable structural signal |
| w3 | embedding_similarity | 0.30 | Semantic similarity catches implicit relationships |
| w4 | ref_cooccurrence | 0.15 | Being mentioned together signals topical clustering |
| w5 | time_proximity | 0.10 | Temporal proximity is weak but useful for recent notes |

**Factor definitions (all normalized to [0, 1]):**

1. **link_factor**: Based on `links.link_type` between note_a and note_b:
   - `wiki-link` → 1.0 (explicit `[[reference]]`)
   - `block-ref` → 0.9 (fine-grained reference)
   - `backlink` → 0.8 (implicit via reverse lookup)
   - No direct link → 0.0

2. **tag_overlap**: Jaccard similarity of tag sets:
   ```
   tag_overlap = |tags(A) ∩ tags(B)| / |tags(A) ∪ tags(B)|
   ```
   If both notes have zero tags, tag_overlap = 0.0.

3. **embedding_similarity**: Cosine similarity of embedding vectors (ollama/bge-small, 384-dim):
   ```
   embedding_similarity = (v_A · v_B) / (||v_A|| × ||v_B||)
   ```
   Values already in [-1, 1]; clamped to [0, 1] (negative → 0.0).

4. **ref_cooccurrence**: Both notes referenced in same third note:
   ```
   ref_cooccurrence = |R(A) ∩ R(B)| / |R(A) ∪ R(B)|
   ```
   Where R(X) is the set of note IDs that reference X. If neither is referenced, cooccurrence = 0.0.

5. **time_proximity**: Exponential decay based on creation time difference:
   ```
   time_proximity = exp(-|t_A - t_B| / λ)
   ```
   Where λ = 7 days (604,800 seconds). Two notes created on the same day score 1.0; one week apart ≈ 0.37; one month ≈ 0.01.

**Score categories:**

| Range | Category | Visual treatment |
|-------|----------|-----------------|
| > 0.7 | Strong | Bold edges (5-6px), green tint |
| 0.4 – 0.7 | Moderate | Medium edges (3-4px), blue tint |
| 0.1 – 0.4 | Weak | Thin edges (1-2px), grey tint, dashed |
| < 0.1 | None | Edge not rendered |

**Offline/fallback mode:**

When the AI embedding service (ollama) is unavailable:
1. Detect via embedding service health check (timeout 2s).
2. Fallback formula uses only available factors, renormalized:
   ```
   fallback = w1'·link_factor + w2'·tag_overlap + w5'·time_proximity
   ```
   Where `w_i' = w_i / (w1 + w2 + w5) = w_i / 0.55`.
3. `w3` and `w4` are dropped. A flag `ai_offline` is set on the row.
4. When the AI service recovers, a full recalculation is triggered for all rows with `ai_offline = TRUE`.

**Recalculation triggers:**

```
Note saved/created/restored
  ├─ AI embedding available? ─Yes→ Compute all 5 factors, upsert row
  └─ AI embedding offline?   ─No→ Compute fallback (w1, w2, w5), flag ai_offline=TRUE
                                      ↓
                              Background scheduler (daily batch):
                              ┌─ Query notes changed in last 24h
                              ├─ For each pair (changed_note, all_other_notes):
                              │    Recompute score, upsert connection_scores
                              └─ Handle deleted notes: DELETE rows WHERE note_a_id OR note_b_id = deleted_id
```

**Scheduler implementation:**

A cron-style background job (runs every 24h at 02:00 via `node-cron` or equivalent):
1. Query: `SELECT id FROM documents WHERE updated_at > NOW() - INTERVAL '24 hours'`.
2. For each `changed_id`, compute scores against every other document.
3. Upsert into `connection_scores`.
4. Clean up orphaned rows (deleted documents).
5. If any row has `ai_offline = TRUE`, attempt a single embedding service ping. If back online, recalculate those rows with full formula.

**Scoring is symmetric**: Always stored as `note_a_id < note_b_id` (lexicographic ordering on UUIDs) to deduplicate pairs. Queries read both directions via `WHERE note_a_id = X OR note_b_id = X`.

### UI / Interaction

Connection strength is never shown directly to the user. It drives:

| Surface | How strength is used |
|---------|---------------------|
| Drill-Down Graph (#17) | Edge thickness = strength × 5px + 1px base. Tooltip shows "Connection: 0.72 (Strong)" |
| Node Map (#14) | Edges filtered by minimum strength (configurable slider: Show connections ≥ 0.0 / 0.1 / 0.4 / 0.7) |
| Global Search (#33) | Result ranking boosted by +0.3 × avg_strength_to_query_terms |
| Daily Briefing (#28) | "Top Connections" card recommends notes with highest aggregate strength to recently viewed/edited notes |
| Auto-Suggest Backlinks (#31) | Suggested backlinks ranked by connection strength to the current note; only suggestions with strength ≥ 0.2 are shown |
| Context Graph (#15) | Halo radius is clamped to the top 10 connections by strength |

No direct UI for connection strength — it is a backend signal consumed by other features.

### Data Model

n+1) `connection_scores` table

```sql
CREATE TABLE connection_scores (
    note_a_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    note_b_id    UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    score        DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    link_factor  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tag_overlap  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    embedding_similarity DOUBLE PRECISION DEFAULT NULL,
    ref_cooccurrence     DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    time_proximity       DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ai_offline   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (note_a_id, note_b_id),
    CONSTRAINT note_a_lt_note_b CHECK (note_a_id < note_b_id),
    CONSTRAINT score_range CHECK (score >= 0.0 AND score <= 1.0)
);

CREATE INDEX idx_connection_scores_note_a ON connection_scores(note_a_id);
CREATE INDEX idx_connection_scores_note_b ON connection_scores(note_b_id);
CREATE INDEX idx_connection_scores_updated ON connection_scores(updated_at) WHERE ai_offline = TRUE;
```

n+2) Index for neighbor queries:

```sql
CREATE INDEX idx_connection_scores_high_strength
    ON connection_scores(note_a_id, score DESC)
    WHERE score > 0.4;
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #7 | `embedding_similarity` factor calls the ollama/bge-small embedding API. The `ai_offline` flag tracks embedding service health. Recalculation triggers when new embeddings are generated |
| #10 | `link_factor` reads `links.link_type`. `ref_cooccurrence` reads block reference edges from the link store |
| #14 | Node Map filters displayed edges by configurable minimum strength. Edge color gradient mapped from score |
| #15 | Context Graph halo uses connection strength to rank which related notes to show in the radial "surround" layer |
| #17 | Edge width mapped from score. Tooltips display the strength category. Strong edges are animated with a subtle pulse |
| #28 | Daily Briefing aggregates top-N strongest connections across recently active notes |
| #31 | Auto-suggest backlinks filtered to candidates with strength ≥ 0.2, ranked descending |
| #33 | Search ranking receives a `connection_boost` modifier: `score += 0.3 * avg(connection_scores.score)` for all results that have a connection to the querying context |

### Edge Cases

- **Pair computation explosion**: In a workspace with 100,000 notes, computing all pairs (5e9 combinations) is infeasible. Solution: only compute pairs where at least one note has changed in the last 24h. New notes compute against all existing notes (batch of 500 at a time with a 1s pause between batches to avoid saturating the DB). The scheduler's 24h window ensures every pair is eventually scored within 48h of the second note's creation.
- **Embedding service timeout (>5s)**: Mark pair as `ai_offline = TRUE` using the fallback formula. The scheduler retries with full formula on the next cycle. A circuit breaker prevents repeated timeouts: after 3 consecutive failures, the embedding service is marked down for 5 minutes.
- **Deleted notes**: CASCADE deletes from `documents` clean up `connection_scores` rows. The scheduler's orphan cleanup runs nightly as a safety net: `DELETE FROM connection_scores WHERE NOT EXISTS (SELECT 1 FROM documents WHERE id = note_a_id) OR NOT EXISTS (SELECT 1 FROM documents WHERE id = note_b_id)`.
- **Same note pair**: Constraint `note_a_id < note_b_id` plus application-layer guard — the scoring engine skips pairs where `note_a_id = note_b_id`.
- **Tag overlap with zero-tag notes**: If both notes have zero tags, Jaccard division by zero is avoided by the rule: `if |A ∪ B| = 0 then tag_overlap = 0.0`.
- **Connection strength for trashed notes**: Trashed notes are excluded from all pair computations. If a note is restored, it is treated as "changed in the last 24h" and queued for full recalculation.
- **Weight configuration**: Default weights are stored in a config table (`app_config(key, value)`). Users can override weights via Settings → Connections → "Adjust scoring weights" (advanced). Custom weights are stored per-user in `user_preferences`.
- **Score staleness**: The `updated_at` timestamp allows consumers to detect stale scores. Search ranking gives a 10% penalty to rows with `updated_at > 7 days ago` to favor freshly computed scores.

## 40. Slides / Presentation Mode (#11)

**Priority:** High
**Status:** Draft
**Dependencies:** #4 (Spatial Canvas — slide source), #20 (Export — PDF pipeline)
**Inverse Dependencies:** #24 (Daily Briefing — auto-slides)

### What

Convert any document or collection of notes into a slide deck. Each heading level defines slide boundaries: h1 starts a new section, h2+ are content slides within that section. Supports three layouts (Title+Body, Two-Column, Image Full) and a full-screen presenter mode with notes overlay, timer, and next-slide preview. Export to PDF or self-contained HTML.

### Architecture

```
Client request (doc ID or collection ID)
  ├─ Slide Engine (server-side)
  │   ├─ Parse document AST into slide tree
  │   │   └─ h1 → section break (new section slide)
  │   │   └─ h2–h6 → content slides within current section
  │   │   └─ Body text → slides filled until overflow heuristic
  │   │   └─ <!-- split --> → two-column boundary
  │   │   └─ <!-- note: --> → presenter notes (stripped from rendered slide)
  │   ├─ Apply layout: Title+Body / Two-Column / Image Full
  │   ├─ Theme engine: light / dark / high-contrast / custom CSS
  │   └─ Output: JSON AST (client) or HTML (export)
  ├─ Client Presenter
  │   ├─ FullScreen API (document.documentElement.requestFullscreen)
  │   ├─ Keyboard: ArrowRight/ArrowLeft/Space/Backspace / N+G (jump)
  │   ├─ Presenter overlay: notes, timer, next-slide thumbnail
  │   └─ 2-slide pre-render buffer (current + next)
  └─ Export Pipeline
      ├─ WeasyPrint (PDF): render slide deck to A4 landscape, one slide per page
      └─ Static HTML: self-contained single file with inline CSS + JS
```

**Slide tree construction:**
1. Parse document markdown -> AST (remark-like parser).
2. Walk AST: find h1 nodes → section boundaries. All content after an h1 until the next h1 belongs to that section.
3. Within a section, split at every h2+ heading — each subtree becomes a slide.
4. If a subtree exceeds a heuristic content threshold (e.g. >600px rendered height at 16px base font), it overflows into a continuation slide with the same heading and a "(cont.)" suffix. Max 3 continuations before truncation with a "View full note" link.
5. Deep nesting (h4 inside h3 inside h2) flattens to 3 levels max: the heading hierarchy is preserved for breadcrumbs but the slide treats h2+ as equivalent content slides.
6. Apply layout per slide:
   - **Title+Body (default)**: Heading at top, remaining content in a scrollable body region.
   - **Two-Column**: Content before `<!-- split -->` in left column, content after in right column. If no split marker exists, content is divided 50/50 by character count (at word boundary).
   - **Image Full**: Single image fills the slide; if multiple images exist, only the first is used; caption rendered as an overlay at the bottom.

**Presenter overlay data flow:**
```
Presenter state (client-side):
  slide_index, section_index, total_slides, elapsed_seconds
        │
        ├─ HTML overlay (position: fixed, bottom-right, 320px × 240px)
        │   ├─ Notes panel: render <!-- note: --> content for current slide
        │   ├─ Timer: MM:SS since presentation start (pausable via P key)
        │   └─ Next-slide thumbnail: scaled-down canvas or HTML snapshot
        │
        └─ Broadcast channel (SharedWorker or BroadcastChannel API)
            └─ Allows external controller (phone/tablet) via companion URL
```

### UI / Interaction

```
┌─────────────────────────────────────────────────────────────┐
│  [⛶ Present] [PDF ↓] [HTML ↓]   Theme: Light ▼   Layout    │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │            Project Architecture Overview                 ││
│  │            ═══════════════════════════════               ││
│  │                                                          ││
│  │  Section 1: Core Design                                 ││
│  │  • Event-driven data flow                                ││
│  │  • Plugin architecture                                    ││
│  │  • Offline-first sync                                    ││
│  │                                                          ││
│  │  Section 2: Data Layer                                   ││
│  │  • SQLite with FTS5                                      ││
│  │  • Document store                                        ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│  ◀  Slide 4 of 27  ▶     ⏱ 02:34           👁 Notes [5]    │
└─────────────────────────────────────────────────────────────┘

(Full-screen Presenter Mode):
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│              ┌─── FULL SCREEN SLIDE ───┐                     │
│              │                         │                     │
│              │  (content fills screen)  │                     │
│              │                         │                     │
│              └─────────────────────────┘                     │
│                                                              │
│  ┌────────────────────────────────────────┐   ┌───────────┐ │
│  │  Notes: Emphasize the event bus        │   │  Next:    │ │
│  │  architecture. Ask about error          │   │  Data    │ │
│  │  handling strategy.                     │   │  Layer   │ │
│  │                         ⏱ 05:12        │   │           │ │
│  └────────────────────────────────────────┘   └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- **Slide viewport**: Centered, max-width 1024px, responsive down to 360px. Aspect ratio maintained at 16:9 for Presenter Mode.
- **Toolbar**: Present button (full-screen), Export dropdown (PDF/HTML), Theme selector, Layout override per slide.
- **Navigation**: Arrow keys, Space (forward), Shift+Space (back), N+G to jump to slide N, Esc to exit presentation. Progress bar at bottom.
- **Presenter overlay**: Semi-transparent panel shown at bottom-right of the full-screen view. Auto-hides after 3s of inactivity; re-appears on mouse move. Notes support markdown (bold, italic, lists, links).
- **Companion controller**: A secondary device can open a controller URL (QR code shown at start) to navigate slides, see notes, and view timer.

### Data Model

n+3) `slides_sessions` table

```sql
CREATE TABLE slides_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('document', 'collection')),
    source_id   UUID NOT NULL,                       -- documents.id or collections.id
    theme       VARCHAR(20) NOT NULL DEFAULT 'light',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_slides_sessions_source ON slides_sessions(source_type, source_id);
```

n+4) `slides` table

```sql
CREATE TABLE slides (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     UUID NOT NULL REFERENCES slides_sessions(id) ON DELETE CASCADE,
    slide_index    INTEGER NOT NULL,
    section_index  INTEGER NOT NULL,
    heading_text   TEXT,
    heading_level  SMALLINT NOT NULL DEFAULT 2,
    layout         VARCHAR(20) NOT NULL DEFAULT 'title_body'
                        CHECK (layout IN ('title_body', 'two_column', 'image_full')),
    content_html   TEXT NOT NULL,                    -- server-rendered HTML for this slide
    presenter_notes TEXT,                            -- extracted from <!-- note: --> blocks
    is_continuation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (session_id, slide_index)
);
CREATE INDEX idx_slides_session ON slides(session_id, slide_index);
```

n+5) `slide_themes` table

```sql
CREATE TABLE slide_themes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,         -- 'light', 'dark', 'high-contrast'
    css_variables JSONB NOT NULL,                    -- { "--bg": "#fff", "--text": "#333", ... }
    is_builtin  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Built-in themes seeded on app init
INSERT INTO slide_themes (name, css_variables, is_builtin) VALUES
('light', '{"--bg":"#ffffff","--text":"#1a1a1a","--heading":"#2c3e50","--accent":"#3498db","--code-bg":"#f5f5f5","--border":"#e0e0e0","--note-bg":"#fef9e7"}', TRUE),
('dark', '{"--bg":"#1e1e2e","--text":"#cdd6f4","--heading":"#89b4fa","--accent":"#89b4fa","--code-bg":"#313244","--border":"#45475a","--note-bg":"#2a2a3e"}', TRUE),
('high-contrast', '{"--bg":"#000000","--text":"#ffffff","--heading":"#ffff00","--accent":"#00ffff","--code-bg":"#222222","--border":"#ffffff","--note-bg":"#111111"}', TRUE);
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #4 | Canvas nodes can be selected as slide sources — a canvas note group becomes a slide section, with each canvas note card rendered as a slide. The "Slide Deck" action is available from the canvas toolbar |
| #20 | Export to PDF uses the same WeasyPrint pipeline. Export to HTML generates a self-contained file with inline theme CSS and presenter JS. Both run server-side via a queue worker |
| #24 | Daily Briefing auto-generates a 3-slide summary deck from the top notes of the day. The "Open Slides" action on the briefing card starts a slides_session with source_type='collection' for the daily-briefing dynamic collection |

### Edge Cases

- **Deep heading nesting (h6 under h3)**: Flattened to 3 levels max. Slides treat h2+ as content slides; the heading hierarchy is accessible via a thin breadcrumb bar at the top of each slide. If a document has no h1, the entire document is treated as one section with an auto-generated "Document" section title.
- **Missing images**: The slide engine checks image URLs at render time. If an image is unreachable (404 or timeout >3s), a placeholder icon is shown with the alt text. In Image Full layout, the slide falls back to Title+Body layout.
- **Very long code blocks**: Code blocks exceeding 20 lines are rendered inside a scrollable `<pre><code>` container with max-height 400px and a "Expand" button. The code block font size scales down to 0.8em for blocks >40 lines. Syntax highlighting is pre-rendered server-side (highlight.js or equivalent) and included in content_html.
- **Presenter notes syntax**: Inline `<!-- note: -->` comments are stripped from rendered content and stored in `slides.presenter_notes`. Notes can span multiple lines: `<!-- note: This is a long note that spans multiple lines -->`. Block-level `<!-- note: -->` before a heading attaches to the following slide; inline notes after content attach to the current slide.
- **Empty slide**: If a section boundary (h1) is immediately followed by another h1 with no content between them, the first section gets a title slide with just the heading. A completely empty document generates a single slide with "This document is empty."
- **Collection with 100+ notes**: Slides are generated lazily — only the first 50 slides are rendered initially. A "Load more" button triggers the next batch (server-side pagination). The presenter overlay shows total slide count once fully loaded.
- **PDF overflow**: WeasyPrint renders one slide per page. If a slide's content overflows the A4 landscape page (297×210mm), a `page-break-before: always` is inserted mid-slide with a "(cont.)" suffix on the continuation page. The PDF generation runs in a background worker with a 60s timeout; large decks (>100 slides) show a progress indicator.
- **Accessibility**: Slides are navigable via Tab (focus next slide), Enter (enter presentation), Esc (exit). Screen readers get `role="region"` with `aria-label="Slide N of M"`. Presenter notes are exposed via `aria-describedby`. High-contrast theme meets WCAG 2.1 AA for all text/background combinations.
- **Companion controller disconnection**: If the companion device disconnects (WebSocket drop), slides continue unaffected. The controller shows a "Reconnect" button. After 30s of inactivity, the QR code is re-displayed on the main screen.

## 41. Focus Mode (#43)

**Priority:** Medium
**Status:** Draft
**Dependencies:** #1 (Note Taking), #4 (Spatial Canvas), #5 (Hierarchical Docs)
**Inverse Dependencies:** (none)

### What

A distraction-free writing and reading mode that hides all chrome (sidebar, toolbar, footer) and leaves only the editor/content area visible. Three sub-modes: Typewriter (cursor vertically centered, auto-scroll), Line Focus (dim all lines except the active paragraph at 40% opacity), and Reading (page-like margins, section page breaks, book-style typography). Toggle via Ctrl+Shift+F / Cmd+Shift+F, Esc exits.

### Architecture

```
Toggle (Ctrl+Shift+F or Cmd+Shift+F)
  ├─ Read user_preferences (key: focus_mode.defaults)
  ├─ Apply CSS class to <body>: .focus-mode
  │   └─ CSS transitions: all chrome display:none with 300ms ease-out
  ├─ Sub-mode class: .focus-typewriter / .focus-line / .focus-reading
  │
  ├─ Typewriter sub-mode:
  │   ├─ On every content change/scroll:
  │   │   └─ Compute cursor position relative to viewport
  │   │   └─ If cursor.y < viewport.height * 0.4 or > viewport.height * 0.6:
  │   │       └─ scrollBy(0, delta) to center cursor at 50% viewport height
  │   ├─ Uses IntersectionObserver on cursor + smooth scrollIntoView({block: 'center'})
  │   └─ Debounced at 50ms to avoid jank
  │
  ├─ Line Focus sub-mode:
  │   ├─ Overlay all lines with rgba(128,128,128,0.4) via CSS pseudo-layer
  │   ├─ Active line (determined by cursor line) gets opacity: 1.0
  │   ├─ Uses CSS .line-focus-dim { opacity: 0.4; transition: opacity 200ms; }
  │   │          .line-focus-active { opacity: 1.0; }
  │   └─ Screen reader detection: check window.speechSynthesis or prefersReducedMotion
  │       └─ If detected → auto-disable Line Focus, fall back to Typewriter
  │
  └─ Reading sub-mode:
      ├─ max-width: 720px centered, font-size: 1.25rem (book scale)
      ├─ Section page breaks: horizontal rule with ~60px whitespace between h1 sections
      ├─ Serif font (Georgia / ET Book) for prose, monospace for code
      ├─ Hides editor chrome (toolbar, floating buttons, line numbers)
      └─ Pointer events: clicking outside editor does nothing (no accidental navigation)
```

**State machine:**

```
IDLE ──Ctrl+Shift+F──→ FOCUS_MODE
                          │
                          ├─ Tab (cycle sub-mode) ──→ TYPEWRITER / LINE_FOCUS / READING
                          │
                          ├─ Ctrl+Shift+F ──→ return to IDLE (restore chrome)
                          └─ Esc ──→ IDLE (restore chrome, clear sub-mode)
```

**Focus status payload stored in `user_preferences`:**
```json
{
  "focus_mode": {
    "default_sub_mode": "typewriter",
    "line_focus_opacity": 0.4,
    "reading_font_size": 1.25,
    "reading_font_serif": true
  }
}
```

### UI / Interaction

```
Normal Mode:
┌─────────────────────────────────────────────────────────────┐
│ [☰ Sidebar]  [✏️ Edit]  [🔍 Search]  [⚙️ Settings]  ...    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │                  Editor Content                         ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  Footer:  Words: 342  |  Last saved: 1m ago                 │
└─────────────────────────────────────────────────────────────┘

Focus Mode (Typewriter):
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│              ┌──────────────────────────────┐                │
│              │  ┌─ cursor vertically ──┐   │                │
│              │  │   centered at 50%     │   │                │
│              │  │   (auto-scrolls)      │   │                │
│              │  └───────────────────────┘   │                │
│              └──────────────────────────────┘                │
│                                                              │
│  [Ctrl+Shift+F or Esc to exit]                    [Tab: LF]  │
└─────────────────────────────────────────────────────────────┘

Focus Mode (Line Focus):
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│      (dimmed) Line above the active paragraph ...            │
│                                                              │
│      (dimmed) Another dimmed line ...                        │
│                                                              │
│      This is the active paragraph — full opacity.            │
│      All other lines are dimmed to 40% opacity.              │
│                                                              │
│      (dimmed) Line below the active paragraph ...            │
│                                                              │
│  [Ctrl+Shift+F or Esc to exit]                    [Tab: RD]  │
└─────────────────────────────────────────────────────────────┘

Focus Mode (Reading):
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                                                              │
│           ┌──────────────────────────────────┐               │
│           │  720px centered column            │               │
│           │  Book-style typography            │               │
│           │  Serif font, 1.25rem base         │               │
│           │                                  │               │
│           │  Section ——— break —————          │               │
│           │                                  │               │
│           │  Next section starts here ...     │               │
│           └──────────────────────────────────┘               │
│                                                              │
│  [Ctrl+Shift+F or Esc to exit]                    [Tab: TW]  │
└─────────────────────────────────────────────────────────────┘
```

- **Toggle**: Ctrl+Shift+F (Windows/Linux) / Cmd+Shift+F (macOS). Initial activation enters Focus Mode with the user's default sub-mode (from preferences).
- **Cycle**: Tab key cycles between sub-modes (Typewriter → Line Focus → Reading → Typewriter). Shift+Tab reverses.
- **Exit**: Esc or Ctrl+Shift+F restores all chrome. Both exit paths play the same 300ms ease-out transition (chrome fades in, content reflows).
- **Status indicator**: A small floating badge at the top-center shows the active sub-mode icon (TW / LF / RD). Clicking the badge cycles sub-modes. Auto-hides after 3s; appears on mouse move.
- **Transition animation**: On enter — chrome elements get `opacity: 0; visibility: hidden; transition: opacity 300ms ease-out, visibility 300ms;`. On exit — reversed. The editor/content area smoothly expands into the vacated space.
- **Accessibility banner**: When Focus Mode is active, a live `aria-live="polite"` region announces "Focus mode enabled. [Sub-mode]." on enter and "Focus mode disabled." on exit.

### Data Model

No new tables. Focus mode state is stored in `user_preferences`:

```sql
-- JSON key: focus_mode within user_preferences.preferences
-- Example value:
-- {
--   "default_sub_mode": "typewriter",
--   "line_focus_opacity": 0.4,
--   "reading_font_size": 1.25,
--   "reading_font_serif": true
-- }
```

The active sub-mode is session-only (in-memory React state) and is not persisted across sessions. Only the default sub-mode and visual preferences are stored.

### Integration Points

| Feature | Integration |
|---------|-------------|
| #1 | Focus Mode works in the note editor — hides the note sidebar, toolbar, and footer. The editor pane expands to full width. Line Focus dims non-active lines in the editor |
| #4 | Spatial Canvas enters Focus Mode with the canvas toolbar hidden. The canvas itself remains interactive (pan, zoom, click nodes). Line Focus is not available in canvas mode (no text lines); defaults to Typewriter (center on focused node) or Reading (maximized canvas view) |
| #5 | Hierarchical docs (outline, breadcrumbs, document tree) are hidden in Focus Mode. The editor-only area expands. Typewriter mode respects the document's scroll position at all nesting levels |

### Edge Cases

- **Screen reader detected**: Use `window.matchMedia('(prefers-reduced-data: reduce)')` and check for active `aria-hidden` usage heuristics. Line Focus is automatically disabled (fallback to Typewriter) because dimming interferes with screen reader linear navigation. An `aria-live` announcement notifies: "Line Focus is not available with screen readers. Switched to Typewriter mode."
- **Embedded iframes / interactive blocks**: Line Focus dimming is implemented via a CSS overlay pseudo-element that does NOT capture pointer events (`pointer-events: none`). This ensures embedded iframes, videos, Mermaid diagrams, and interactive code blocks remain fully interactive. The overlay only affects visual opacity.
- **Keyboard navigation in Focus Mode**: All keyboard shortcuts remain active. Ctrl+Shift+F toggles mode. Tab cycles sub-modes. Arrow keys, Enter, and editor-specific shortcuts continue to work. The Esc key exit is disabled when an embedded iframe is focused (to allow iframe-native Escape behavior); Focus Mode exit requires Ctrl+Shift+F from an iframe.
- **Line Focus contrast on light/dark themes**: The dimming overlay uses 40% opacity grey. On light themes, the grey-on-white contrast must remain ≥ 3:1 against the background per WCAG 2.1 SC 1.4.3 (AA) for the dimmed text. On dark themes, the opacity is reduced to 35% to maintain readability. The `line_focus_opacity` preference allows user override between 0.2 and 0.6.
- **Very long documents (>10,000 lines)**: Typewriter centering is debounced (50ms) to avoid layout thrashing. The IntersectionObserver only observes the cursor element, not all lines. Reading mode uses `column-width: 720px; column-gap: 60px` for CSS-based pagination — the browser handles performance natively.
- **Mobile / touch devices**: Focus Mode is available on mobile. The toolbar hides; the editor fills the viewport. Typewriter centering works with the virtual keyboard open (uses `visualViewport` API). Line Focus is not available on screens <600px width (too little content visible). Reading mode uses 90vw width instead of 720px to adapt to small screens.
- **Accessibility (contrast in line-focus dimming)**: Users with low vision can configure `line_focus_opacity` in settings. Minimum floor of 0.2 ensures text remains legible. The high-contrast system theme (`prefers-contrast: high`) disables Line Focus dimming entirely (all lines at full opacity, only chrome is hidden).
- **Exiting from embedded context**: If the user opens a linked note embed (`[[embed]]`) within Focus Mode, the embed opens in the same focus session. Esc navigates back from the embed to the parent note before exiting Focus Mode entirely. A breadcrumb-like "focus stack" tracks depth.
## 42. Template System (#19)

**Priority:** High
**Status:** Draft
**Dependencies:** #2 (Tag System), #5 (Hierarchical Nested Docs), #47 (Auto-Classify), #50 (Auto-Template Matching)
**Inverse Dependencies:** #10 (Block References & Backlinks), #28 (Daily Briefing)

### What

Structured templates for creating new notes with predefined content, metadata, tags, and layout. Users can instantiate templates from a library dialog, save any note as a template, define custom variables for substitution, and set default templates per folder. Pre-installed templates (Meeting Notes, Daily Journal, Project Proposal, Book Notes, Recipe) get users started immediately.

### Architecture

**Template storage:**

Templates are stored as standard markdown files in a `templates/` folder at the workspace root, distinguished from regular notes by `template: true` in the YAML frontmatter:

```yaml
---
title: "Meeting Notes"
tags: [meeting, template]
icon: 📅
template: true
variables: [project, date, attendees]
category: productivity
extends: "Base Note"
---
```

**Template discovery:**

On app startup and when the `templates/` directory is modified, a scanner indexes all `.md` files with `template: true` in frontmatter into a `templates` in-memory registry (backed by a lightweight SQLite cache table for fast grid rendering). Pre-installed templates ship as embedded assets in the app bundle and are copied into `templates/` on first launch.

**Instantiation flow:**

```
User selects template from library
  └→ Parse frontmatter, extract variables list
  └→ Present variable form dialog (if variables exist)
       └→ Pre-fill {{date}}, {{time}}, {{title}}, {{author}} automatically
       └→ Custom variables rendered as labeled input fields
  └→ User fills variables → "Create"
  └→ Perform variable substitution on template body:
       └─ Iterate all {{variable}} occurrences
       └─ Replace with user-provided value (or empty string if omitted)
       └─ Pre-defined variables substituted from system context
  └→ Apply frontmatter fields to new note:
       └─ title → note title
       └─ tags → applied via Tag System (#2)
       └─ icon → note icon
  └→ If template has child structure (Hierarchical Nested Docs #5):
       └─ Parse child template definitions
       └─ Create nested document hierarchy
  └→ Save note, open in editor
```

**Template inheritance:**

A template can extend another via `extends: parent_template_name` in frontmatter. At scan/index time:
1. Resolve inheritance chain up to max depth of 5.
2. Detect circular inheritance (see Edge Cases).
3. Merge frontmatter: child fields override parent fields.
4. Concatenate body content: parent body first, then child body.
5. Flatten variable list: union of parent and child variables.
6. Cache the resolved template (re-resolve on file change).

**"Save as Template" action:**

Any open note can be saved as a template via File → Save as Template. This:
1. Copies the note content into `templates/<title>-template.md`.
2. Adds/updates frontmatter: `template: true`, preserves existing `tags` and `icon`.
3. Prompts user to define custom `variables` (optional).
4. Opens the new template file in the editor.

**Default template assignment:**

Per-folder default templates are stored in `user_preferences.default_templates` as a JSON map:

```json
{
  "folder_id_1": "Meeting Notes",
  "folder_id_2": "Daily Journal"
}
```

When creating a new note in a folder with a default template, the template library dialog pre-selects that template. "Quick Create" (Ctrl+Alt+N) uses the folder's default template with no dialog.

### UI / Interaction

```
┌───────────────────────────────────────────────────────────────┐
│  📋 Template Library                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [Search templates...]      Category: All ▼  Sort: Name ▼ │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ 📅       │  │ 📓       │  │ 📋       │  │ 📖       │ │  │
│  │  │ Meeting  │  │ Daily    │  │ Project  │  │ Book     │ │  │
│  │  │ Notes    │  │ Journal  │  │ Proposal │  │ Notes    │ │  │
│  │  │          │  │          │  │          │  │          │ │  │
│  │  │ meeting  │  │ journal  │  │ project  │  │ reading  │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  | 🍳       │  │ 🧪       │  │ 🗺️       │  │ ✍️        │ │  │
│  │  │ Recipe   │  │ Lab Note │  │ Travel   │  │ Weekly   │ │  │
│  │  │          │  │          │  │ Planner  │  │ Review   │ │  │
│  │  │ cooking  │  │ science  │  │ travel   │  │ periodic │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│  [Preview] [Set as Default for Folder ▼] [Close]               │
└───────────────────────────────────────────────────────────────┘
```

- **Template library dialog**: Opened via File → New from Template (Ctrl+Shift+N) or "New" button dropdown. Grid of template cards showing icon, title, tags, and category badge. Search bar filters by title/tag. Category dropdown filters by `category` field. Sort by name, usage count, or recently used.
- **Variable input dialog**: On template selection, if `variables` is non-empty, a modal dialog presents labeled input fields:

  ```
  ┌──────────────────────────────────┐
  │  Create: Meeting Notes           │
  │                                  │
  │  Project:  [________________]    │
  │  Date:     [2026-07-04    ] 📅   │
  │  Attendees:[________________]    │
  │                                  │
  │  [Cancel]  [Create Note]         │
  └──────────────────────────────────┘
  ```

  Pre-defined variables (`{{date}}`, `{{time}}`, `{{title}}`, `{{author}}`) are pre-filled automatically. Date inputs get a date picker widget. `{{title}}` becomes the note's title field and is required.
- **Template editor**: When editing a template file directly, the editor shows a subtle "This is a template — changes affect all future notes created from it" banner. The frontmatter is syntax-highlighted YAML in a collapsible section.
- **Default template indicator**: In the folder tree, folders with a default template show a small template icon badge on the folder icon. Hovering shows "Default template: Meeting Notes".

### Data Model

n+1) Template registry cache table (for fast library queries):

```sql
CREATE TABLE templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name   TEXT NOT NULL UNIQUE,
    file_path       TEXT NOT NULL,
    icon            TEXT,
    category        TEXT,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    variables       TEXT[] NOT NULL DEFAULT '{}',
    extends         TEXT REFERENCES templates(template_name) ON DELETE SET NULL,
    usage_count     INTEGER NOT NULL DEFAULT 0,
    is_builtin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
```

n+2) Default template preferences (extends `user_preferences`):

```sql
ALTER TABLE user_preferences ADD COLUMN default_templates JSONB NOT NULL DEFAULT '{}';
-- JSON structure: {"folder_id": "template_name", ...}
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #2 | Template-defined tags (`tags` frontmatter) are auto-applied to instantiated notes. Template system provides a new surface for tag assignment at creation time |
| #5 | Template frontmatter can define child document structure via `children` block (nested template references). On instantiation, the full document tree is created recursively |
| #10 | Template bodies can contain block references to stable anchor points. Instantiation preserves block reference targets |
| #28 | Daily Briefing can be created from the "Daily Journal" template automatically when the briefing is generated |
| #47 | When Auto-Classify runs and suggests a category, the system can recommend the corresponding template: "Notes in 'science' category often use the 'Lab Note' template — use it?" |
| #50 | Auto-Template Matching analyzes note content and suggests the best-matching template from the library. Template selection becomes an AI-assisted action rather than manual browsing |

### Edge Cases

- **Circular inheritance**: When a template is saved/updated, the scanner resolves the `extends` chain. If a cycle is detected (template A → B → C → A), the save is rejected with an error message: "Circular template inheritance detected: A → B → C → A." The scanner caches the dependency graph in memory during the scan pass for O(n) cycle detection via DFS with visited-set tracking.
- **Deleted template**: Notes already instantiated from a template are unaffected — they are plain notes with no runtime dependency on the template file. The template's `usage_count` is informational only. If a deleted template is referenced by another template's `extends`, the extending template's inheritance chain is broken: the scanner logs a warning and treats the template as a root (no parent).
- **Renamed/moved template file**: The `templates` table stores `file_path`. The file watcher detects renames via `IN_MOVED_FROM`/`IN_MOVED_TO` events and updates the path. If a rename is undetectable (e.g., external editor), the next scan indexes the new file and marks the old path as orphaned (removed after 24h if no matching file appears).
- **Forward-compatible variable renames**: If a template is updated and a variable is renamed, old instances are unaffected (they store the substituted values, not the template variable names). New instantiations use the new variable names. The scanner detects renamed variables heuristically: if a variable is removed and a new one is added within the same edit session, a warning suggests "Variable 'project_name' was renamed to 'project'. Old notes using 'project_name' are unaffected."
- **Pre-defined variable conflicts**: If a template defines a custom variable named `date`, the pre-defined `{{date}}` takes precedence. The scanner warns on save: "Custom variable 'date' shadows a pre-defined variable. Rename your variable to avoid ambiguity."
- **Large template libraries (>100 templates)**: The grid view virtualizes rows (react-window or equivalent, 40px card height). The search index uses a trie for sub-100ms autocomplete. Category filtering is a simple O(n) filter over the cached array.
- **Template frontmatter parse errors**: If a template file has invalid YAML frontmatter, the scanner logs the error to a validation report and skips the file. The library dialog shows a "2 templates with errors" warning badge with a link to the validation report.
- **Missing `extends` target**: If `extends: NonExistent`, the scanner logs a warning, treats the template as a root, and sets `extends = NULL` in the cache. The warning persists until the target template is created.

## 43. Export (#20)

**Priority:** Medium
**Status:** Draft
**Dependencies:** #4 (Spatial Canvas), #8 (Versioning), #11 (Slides), #21 (Daily Briefing)
**Inverse Dependencies:** #18 (Connection Strength), #28 (Daily Briefing)

### What

Export notes and collections to multiple formats including Markdown, PDF, HTML, Plain Text, DOCX, LaTeX, and OPML. Supports single-note export, bulk/folder export as ZIP archives, and queued async export for large jobs. An export settings dialog lets the user configure format-specific options before generating.

### Architecture

**Format pipeline:**

```
User selects scope + format
  └→ Scope resolver: single note / selection / folder / collection
       └→ Collect document IDs into an ordered list
  └→ If single note: direct conversion via format renderer
  └→ If multiple notes (>1):
       └→ If ≤50 files: synchronous batch, return ZIP
       └→ If >50 files: enqueue async job, return job ID with progress notification
  └→ Format renderer resolves the export chain:
       └─ Markdown renderer (native, minimal processing)
            └→ Add YAML frontmatter (title, date, tags, source URL)
            └→ Convert internal links: [[Note Title]] → relative path Note-Title.md
            └→ Embed images: local path → copy to export dir or base64-inline
       └─ HTML renderer: markdown → HTML → inline CSS stylesheet → base64-encode images
       └─ PDF renderer: markdown → HTML → WeasyPrint → PDF
       └─ Plain Text renderer: strip all markdown formatting, ASCII separators for structure
       └─ DOCX renderer: markdown → pandoc-style conversion via python-docx (sidecar)
       └─ LaTeX renderer: markdown → LaTeX (math env, tabular, figure, includegraphics)
       └─ OPML renderer: document tree → OPML 2.0 XML (outline elements)
```

**Bulk export (ZIP archive structure):**

```
export-2026-07-04.zip
├── Notes/
│   ├── 2026-07-04-Meeting-Notes.md
│   ├── Project-Proposal-2026.md
│   └── ...
├── Attachments/
│   ├── images/
│   │   ├── diagram-01.png
│   │   └── photo-2026.jpg
│   └── files/
│       └── budget.xlsx
├── Canvas/
│   └── spatial-board.svg
└── metadata.json
```

`metadata.json` contains export timestamp, format version, note count, and a manifest linking filenames to original note IDs.

**Export queue for large jobs:**

When the scope exceeds 50 files, an async export job is created:

```
POST /api/export
  └→ Validate scope and format
  └→ Create export_jobs row (status: queued)
  └→ Return job_id to client
  └→ Background worker picks up job:
       ├─ status → processing
       ├─ Process documents in batches of 20 (stream progress updates)
       ├─ Build ZIP archive
       └─ status → completed OR failed
  └→ Client polls GET /api/export/jobs/:id for status
  └→ On completion, client downloads via GET /api/export/jobs/:id/download
  └→ Job artifacts are cleaned up after 24h
```

**Format-specific rendering notes:**

| Format | Engine | Special handling |
|--------|--------|-----------------|
| Markdown | Native | Minimal processing: add frontmatter, convert internal links, embed images by copy |
| PDF | WeasyPrint | CSS print stylesheet: `@page { size: A4; margin: 2cm }`, page breaks before `##` headings, page numbers in footer via CSS counters |
| HTML | Native | Single self-contained file: images base64-encoded (`<img src="data:...">`), CSS in `<style>` block, no external dependencies |
| Plain Text | Native | `markdown-it` → strip tokens: headings become `===` underlined, lists become `- `, code blocks framed by `---code---`, tables as `| cell | cell |` |
| DOCX | python-docx | Sidecar process: send JSON of parsed markdown AST → receives .docx buffer. Runs via subprocess with 30s timeout |
| LaTeX | Native | Math blocks: `$$...$$` → `\[...\]` / `$...$` → `\(...\)`. Tables: markdown → `tabular`. Images: `![alt](path)` → `\includegraphics`. Figures wrapped in `\begin{figure}` |
| OPML | Native | Tree walk of document hierarchy. Each heading level becomes `<outline text="..." />`. Block refs become `type="link"` attributes |

**Unsupported block fallbacks:**

When a block type in the source note has no representation in the target format:

| Source block | Markdown | HTML | PDF | Plain Text | DOCX | LaTeX |
|---|---|---|---|---|---|---|
| Callout | Blockquote | `<div class="callout">` | Blockquote | `> ` prefix | Blockquote | `\textbf{}` |
| Mermaid diagram | Code block ```` ```mermaid ```` | `<pre class="mermaid">` | SVG rendered (chromium snapshot) | `[Diagram]` placeholder | Image placeholder | `\includegraphics` |
| Block reference | `[ref](#block-id)` | `<a href="#block-id">` | `[ref]` | `[ref]` | Hyperlink | `\ref{}` |
| Canvas/Spatial | SVG attachment note | `<img src="canvas.svg">` | SVG embedded | `[Canvas]` placeholder | Image placeholder | `\includegraphics` |
| Audio recording | File link | `<audio src="...">` | `[Audio]` placeholder | `[Audio]` placeholder | File link | File link |

### UI / Interaction

```
┌──────────────────────────────────────────────────────────────┐
│  📤 Export                                                    │
│                                                               │
│  Scope:                                                       │
│  ● Current note ── "Meeting Notes (Jul 4)"                    │
│  ○ Selection ── 3 notes selected                              │
│  ○ Folder ── "Project Alpha" ▼                                │
│  ○ Collection ── "Weekly Review" ▼                            │
│                                                               │
│  Format: [ Markdown ▼ ]                                       │
│                                                               │
│  Options:                                                     │
│  ☑ Include tags                                               │
│  ☑ Include attachments                                        │
│  ☑ Include metadata frontmatter                               │
│  ☐ Include version history (creates snapshot)                 │
│                                                               │
│  [Cancel]  [Export]                                           │
└──────────────────────────────────────────────────────────────┘
```

- **Export entry points**: File → Export (Ctrl+E), context menu in notebook tree ("Export folder"), toolbar button in search results ("Export all results").
- **Progress notification**: For async jobs, a toast notification appears: "Exporting 150 notes... 45% complete" with a progress bar. Clicking the toast opens the download manager. On completion: "Export ready — download Export-2026-07-04.zip". Failed exports show "Export failed: [reason] — retry".
- **Download manager**: An in-app downloads panel (Ctrl+J) lists recent exports with status, file size, and download/delete actions. Artifacts auto-expire after 24h with a countdown indicator.
- **Format-specific preview**: Before finalizing, a "Preview" button shows a sample of the first page/section rendered in the target format (Markdown: rendered preview; PDF: thumbnail of first page via PDF.js; HTML: inline iframe).

### Data Model

n+1) Export jobs table (async exports):

```sql
CREATE TABLE export_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scope_type      TEXT NOT NULL CHECK (scope_type IN ('note', 'selection', 'folder', 'collection')),
    scope_id        UUID, -- note/folder/collection ID, NULL for arbitrary selection
    document_ids    UUID[] NOT NULL, -- resolved list of document IDs at job creation time
    format          TEXT NOT NULL CHECK (format IN ('markdown', 'pdf', 'html', 'txt', 'docx', 'latex', 'opml')),
    options         JSONB NOT NULL DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_count     INTEGER NOT NULL,
    file_path       TEXT, -- path to exported ZIP/artifact on completion
    file_size_bytes BIGINT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_export_jobs_user ON export_jobs(user_id, created_at DESC);
CREATE INDEX idx_export_jobs_expires ON export_jobs(expires_at) WHERE status = 'completed';
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #4 | Canvas/Spatial boards exported as SVG with hyperlink annotations. The export dialog includes a "Canvas export format" sub-option: SVG (vector), PNG (raster screenshot), or Linked (HTML with canvas iframe) |
| #8 | Before export, a version snapshot can be created (optional). The export includes the snapshot ID in metadata.json. "Include version history" option snapshots the current state before locking content for export |
| #11 | Slides can be exported directly to PDF (slide deck) via the same PDF pipeline. The export scope includes "Current slide deck" as a preset. PDF print styles include `page-break-before: always` on each slide |
| #21 | Daily Briefing supports auto-export digest: a scheduled export job runs daily (configurable time, default 07:00) and delivers the digest as PDF or Markdown to a configured target (local folder, S3 bucket, or email via SMTP) |
| #18 | Connection strength data is not directly exported, but when exporting a collection, a `connections.json` manifest can be optionally included, listing top-5 connections per note with their strength scores |

### Edge Cases

- **Large exports (>500MB attachments)**: The export pipeline scans attachment sizes before processing. If total exceeds 500MB, a warning dialog appears: "This export includes ~850MB of attachments. Large exports may take several minutes." Options: "Include all" (proceed), "Skip attachments" (export text only), "Include compressed" (images re-encoded to JPEG q80, files ZIP-compressed). The warning threshold is configurable in Settings → Export.
- **Unsupported blocks in target format**: Each format renderer maintains a fallback table (see Architecture above). If a block has no valid fallback, a warning is appended to the export: `[Unsupported block: audio recording — excluded from DOCX export]`. The warnings are collected into an `export-warnings.txt` file included in the ZIP.
- **Image embedding strategy**: Images are handled based on their source and the target format:
  - Local files (`file://` or relative path): Copied to the export directory (ZIP) or base64-encoded (single-file HTML). For PDF, WeasyPrint resolves local paths directly.
  - External URLs (`https://...`): Downloaded at export time (5s timeout per image, 3 retries). If unreachable, a placeholder `[Image: alt text]` is inserted.
  - Embedded base64 (in note content): Passed through as-is in HTML/PDF. For other formats, extracted and written as a separate file in the attachments folder.
- **Export cancellation**: The export job checks a cancellation flag before processing each batch of 20 documents. If the user clicks "Cancel" in the download manager, `export_jobs.canceled` is set (requires adding a `canceled` status to the CHECK constraint). In-progress ZIP writes are aborted and the partial file is deleted. The cancellation flag is checked in the worker loop: `IF job.canceled THEN CLEANUP AND RETURN`.
- **Non-Latin filenames**: Export filenames are sanitized: non-ASCII characters are NFKD-normalized, then URL-encoded for safe filesystem storage. The `metadata.json` manifest stores the original title and the sanitized filename. ZIP archives use UTF-8 filenames (bit 11 of general-purpose bit flag in the ZIP header).
- **Empty scope**: If the selected scope contains no documents (e.g., empty folder), the export button is disabled with a tooltip: "This folder is empty — nothing to export." If documents are deleted between opening the dialog and clicking Export, a toast warns: "3 notes were deleted since you opened this dialog. Exporting remaining 12 notes."
- **DOCX sidecar timeout**: The python-docx subprocess has a 30s timeout. If it exceeds this, the process is killed and the export falls back to a simpler OOXML generator (basic XML template with content injection). A warning is added to the export manifest.
- **Concurrent exports**: The worker pool allows up to 3 concurrent export jobs. If a fourth is queued, it waits. The queue is FIFO. Users see status "Queued — position 2 of 3" in the download manager.
- **Export of version history**: When "Include version history" is checked, the export pipeline snapshots each document at the time of export (#8) and includes the snapshot ID in `metadata.json`. If versioning is disabled for the workspace, the option is greyed out with a tooltip: "Enable Versioning in workspace settings to include version snapshots."
- **OPML with deeply nested documents (>10 levels)**: OPML 2.0 has no nesting limit, but some outliners crash at >20 levels. The exporter truncates nesting at level 20 and adds a warning: "Document hierarchy truncated at 20 levels — some OPML readers may not support deeper nesting."

## 44. Note Taking (#1)

**Priority:** P0 (core)
**Status:** Draft
**Dependencies:** None (foundational feature)
**Inverse Dependencies:** #5 (Hierarchical Nested Docs), #6 (Block References & Backlinks), #7 (Clone Notes), #8 (Versioning), #9 (Drawing / Handwriting), #21 (Daily Briefing)

### What

The primary note-taking editor — a rich text editing experience with markdown support, slash commands, keyboard shortcuts, math (KaTeX), code blocks with syntax highlighting, embeds (images, video, audio), and auto-save. This is the central surface where users spend the majority of their time composing, formatting, and organizing knowledge. The editor supports both inline formatting (bold, italic, strikethrough, code, links, highlights) and block-level structures (headings, lists, callouts, code blocks, math blocks, horizontal rules, embeds).

### Architecture

**Editor component stack:**

```
┌──────────────────────────────────────────────────────────┐
│  Top-Level Components                                      │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  EditorContainer                                      │ │
│  │  ├─ Toolbar (formatting controls, undo/redo, insert) │ │
│  │  ├─ EditorView (ProseMirror view instance)           │ │
│  │  ├─ SlashMenu (block insertion popover)              │ │
│  │  ├─ LinkTooltip (edit/remove link popover)           │ │
│  │  └─ StatusBar (word count, save status, sync icon)   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ProseMirror / TipTap Core                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Schema (nodes + marks)                               │ │
│  │  Plugins: InputRules, Keymap, Placeholder, History    │ │
│  │  Commands: chainable transaction builders             │ │
│  │  Extensions: TextStyle, FontFamily, Color, Highlight  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Custom Plugins & Extensions                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  • SlashMenuPlugin (triggers on "/" keystroke)       │ │
│  │  • KaTeXPlugin (renders $...$ and $$...$$ live)      │ │
│  │  • CodeBlockHighlightPlugin (Prism.js / Shiki)       │ │
│  │  • EmbedPlugin (image/video/audio iframe insertion)  │ │
│  │  • AutoFormatPlugin (markdown shortcuts → rich text) │ │
│  │  • DragHandlePlugin (block drag-and-drop reorder)    │ │
│  │  • PlaceholderPlugin ("Type / for commands...")      │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**Input handling pipeline:**

```
User keystroke (keydown/keypress)
  └→ InputRules plugin: check markdown shortcuts (e.g., "## " → h2)
  └→ Keymap plugin: check registered shortcuts (e.g., Cmd+B → toggle bold)
  └→ SlashMenu plugin: if "/" typed → show menu, capture selection
  └→ Dispatch transaction (tr) to ProseMirror state
       └→ Apply schema rules (validate node/mark placement)
       └→ Run plugins (update decorations, recompute marks)
       └→ Update DOM (ProseMirror view applies steps)
       └→ Fire onUpdate callback:
            ├─ Trigger auto-save debounce
            ├─ Update Yjs CRDT document (if collaboration active)
            └─ Update word count in status bar
```

**Auto-save flow:**

```
Content change detected (onUpdate callback)
  └→ Debounce timer: 1500ms (configurable in Settings → Editor → Auto-save interval)
       └→ If user is still typing → reset timer
       └→ If timer expires:
            ├─ Serialize ProseMirror state to JSON (doc.toJSON())
            ├─ Prepare delta: {blocks: [...], version, timestamp}
            ├─ If offline → queue to IndexedDB outbox (Yjs pending updates)
            └─ If online:
                 ├─ Apply Yjs CRDT merge (sync with server)
                 └─ HTTP PUT /api/notes/:id/content — send JSON delta
                      └─ Server applies, returns {ok: true, version: v+1}
                      └─ Update status bar: "Saved" with timestamp
                            └─ On error: show "Save failed — offline mode" in status bar
```

**Attachment upload flow:**

```
User drops/pastes image file (or uses Insert → Image)
  └→ File type validation: allowed types [jpg, png, gif, webp, svg, mp4, mp3, wav, pdf]
       └─ Max file size: 20MB (configurable per workspace)
       └─ If invalid/rejected → toast: "File type not supported: .exe"
  └→ Generate file hash (SHA-256) for deduplication (skip upload if identical hash exists)
  └→ Show progress placeholder: [Uploading... ████████░░ 68%]
  └→ Upload to /api/upload:
       ├─ Multipart POST with metadata: {note_id, block_id, file_hash}
       └─ Response: {url, thumbnail_url, width, height, mime_type}
  └→ Insert embed node into ProseMirror document:
       └─ Image: <img src={url} alt={filename}>
       └─ Video: <video src={url} controls>
       └─ Audio: <audio src={url} controls>
       └─ File: <a href={url}>{filename}</a>
  └→ Replace placeholder with final embed
  └→ Auto-save triggers (content changed)
```

### UI / Interaction

```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]  [✏️ Editors Collab Indicator]  [📅 2026-07-04]  │
├──────────────────────────────────────────────────────────────┤
│  [B] [I] [S] [H1▼] [• List] [❝ Quote] [🔗 Link] [Σ Math]  │
│  [+ Insert ▼]  [Undo] [Redo]  [🔍 Search in doc]            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Note Title (editable heading)                                │
│  ───────────────────────────────────────────────              │
│                                                               │
│  Content area — blocks stacked vertically:                    │
│                                                               │
│  ┌ Paragraph block ─────────────────────────────────────────┐ │
│  │  This is a normal paragraph with **bold**, *italic*,     │ │
│  │  `inline code`, and a [link](https://example.com).       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌ Heading 2 block ─────────────────────────────────────────┐ │
│  │  ## Architecture Overview                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌ Code block (syntax highlighted) ─────────────────────────┐ │
│  │  const greeting = "Hello, World!";   ▲ language: js      │ │
│  │  console.log(greeting);                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌ KaTeX block ─────────────────────────────────────────────┐ │
│  │  $$ E = mc^2 $$   (rendered as LaTeX)                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌ Image embed ─────────────────────────────────────────────┐ │
│  │  [  🖼️ architecture-diagram.png  ]  640×480              │ │
│  │  Caption: System architecture overview                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌ Drag handle ··· ─────────────────────────────────────────┐ │
│  │  (blocks can be reordered by dragging the ⠿ handle)       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  /                                                            │
│  ┌─ Slash Menu ────────────────────────────────────────────┐ │
│  │  /heading    /image    /math    /code    /quote    /todo │ │
│  │  /callout    /divider  /embed   /drawing  /template /... │ │
│  └──────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Words: 342  |  Last saved: 1m ago  |  🔵 Synced             │
└──────────────────────────────────────────────────────────────┘
```

- **Slash menu**: Activated by typing `/` at the beginning of an empty block or after a space. Displays a categorized list of block types with icons, search-filterable. Keyboard navigable (↑↓ arrows, Enter to insert, Esc to dismiss).
- **Markdown shortcuts**: Typing markdown syntax auto-converts: `# ` → h1, `## ` → h2, `* ` → bullet list, `1. ` → numbered list, `> ` → blockquote, ` ``` ` → code block, `$$` → math block, `---` → horizontal rule.
- **Block drag handle**: A `⠿` icon appears on hover at the left edge of each block. Drag to reorder, click to select the block, right-click for block actions (duplicate, copy, delete, insert above/below, turn into...).
- **Link tooltip**: Hovering over a link shows a floating tooltip with link URL, edit icon (opens inline URL editor), and remove link button. Cmd+click to follow link.
- **Status bar**: Shows word count, character count, reading time, last saved timestamp, and sync status indicator (🔵 synced / 🟡 syncing / 🔴 offline).
- **Keyboard shortcuts**:

| Shortcut | Action |
|----------|--------|
| Cmd+B | Bold |
| Cmd+I | Italic |
| Cmd+U | Underline |
| Cmd+Shift+S | Strikethrough |
| Cmd+K | Insert link |
| Cmd+Shift+E | Inline code |
| Cmd+Shift+M | Insert math (inline $...$) |
| Cmd+Alt+C | Code block |
| Cmd+Shift+7 | Numbered list |
| Cmd+Shift+8 | Bullet list |
| Cmd+Shift+9 | Todo list |
| Cmd+Enter | Soft newline within block |
| Cmd+Option+↑/↓ | Move block up/down |
| Cmd+Shift+] | Indent (increase nesting) |
| Cmd+Shift+[ | Outdent (decrease nesting) |
| Cmd+Z / Cmd+Shift+Z | Undo / Redo |
| Cmd+S | Force save |
| Cmd+Shift+F | Focus mode (#41) |

### Data Model

n+1) Note content storage — `doc_blocks` table:

```sql
CREATE TABLE doc_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id          UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES doc_blocks(id) ON DELETE CASCADE, -- for nesting (#5)
    block_type      TEXT NOT NULL CHECK (block_type IN (
                        'paragraph', 'heading', 'list_item', 'todo_item',
                        'code', 'math', 'embed', 'callout', 'divider',
                        'quote', 'drawing', 'table'
                    )),
    content         JSONB NOT NULL DEFAULT '{}', -- type-specific structure
    position        REAL NOT NULL DEFAULT 0, -- fractional index for ordering
    heading_level   INTEGER CHECK (heading_level BETWEEN 1 AND 6), -- NULL if not heading
    language        TEXT, -- for code blocks (e.g., 'javascript', 'python')
    embed_type      TEXT CHECK (embed_type IN ('image', 'video', 'audio', 'file', 'link')),
    embed_url       TEXT,
    embed_width     INTEGER,
    embed_height    INTEGER,
    collapsed       BOOLEAN NOT NULL DEFAULT FALSE, -- for collapsible callouts/details
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_blocks_doc ON doc_blocks(doc_id, position);
CREATE INDEX idx_doc_blocks_parent ON doc_blocks(parent_id);
CREATE INDEX idx_doc_blocks_type ON doc_blocks(doc_id, block_type);
```

n+2) Attachment metadata table:

```sql
CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id          UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    block_id        UUID REFERENCES doc_blocks(id) ON DELETE SET NULL,
    file_hash       TEXT NOT NULL, -- SHA-256 for deduplication
    file_name       TEXT NOT NULL,
    file_size       BIGINT NOT NULL,
    mime_type       TEXT NOT NULL,
    storage_path    TEXT NOT NULL, -- path in object storage / local filesystem
    thumbnail_path  TEXT, -- path to auto-generated thumbnail
    width           INTEGER, -- for images/video
    height          INTEGER,
    duration_secs   INTEGER, -- for video/audio
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_attachments_hash ON attachments(file_hash) WHERE doc_id IS NULL; -- workspace-level dedup
CREATE INDEX idx_attachments_doc ON attachments(doc_id);
```

n+3) Auto-save state tracking:

```sql
ALTER TABLE docs ADD COLUMN IF NOT EXISTS
    content_version    INTEGER NOT NULL DEFAULT 1,
    last_saved_at      TIMESTAMPTZ,
    last_modified_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pending_changes    BOOLEAN NOT NULL DEFAULT FALSE,
    yjs_state_vector   BYTEA; -- CRDT state for sync reconciliation
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #5 | Parent-child block nesting allows hierarchical document structure. Blocks with `parent_id` set form a tree. The editor renders nested blocks with indentation and collapse/expand controls |
| #6 | Each block has a UUID — other documents can reference it via `[[block:id]]` or `(ref: block_id)`. Block references render as inline previews with backlink tracking |
| #7 | Clone notes are implemented by copying the `doc_blocks` tree under a new `doc_id`. The cloning process deep-copies blocks while preserving attachment references |
| #8 | Each content change increments `content_version` and can trigger a snapshot. Version diffs are computed from the `doc_blocks` JSONB content at the block level |
| #9 | Drawing blocks (`block_type = 'drawing'`) store SVG/vector data in `content.drawing_svg`. The editor renders a canvas overlay within the block when selected |
| #21 | Daily Briefing (Auto-Compile) reads blocks from notes created/modified in the current day and compiles them into a digest document using block references |

### Edge Cases

- **Offline editing**: When the user loses connectivity, the editor continues to function with all features available. Content changes are:
  1. Applied to the local ProseMirror state normally.
  2. Queued in IndexedDB as pending Yjs updates (deltas, not full document copies).
  3. Displayed with an "Offline — changes saved locally" banner in the status bar.
  4. On reconnect, Yjs syncs the pending updates with the server using CRDT merge (no conflicts — Yjs ensures eventual consistency via causal ordering). If a server conflict is detected (rare with CRDT), the last-write-wins strategy is applied at the block level.
  5. Auto-save debounce is disabled while offline — changes are persisted to IndexedDB immediately on each edit.

- **Very large documents (1000+ blocks)**: The editor implements virtual scrolling for the block list:
  - Only ~50 blocks around the viewport are rendered as DOM nodes.
  - Blocks outside the viewport are unloaded and recreated on scroll (react-window pattern).
  - The ProseMirror document is always fully loaded in memory (the JS object, not the DOM) — this keeps the state machine consistent without DOM overhead.
  - Block heights are estimated at 40px and corrected after render via `ResizeObserver`.
  - Search in document (Cmd+F) searches the in-memory ProseMirror document, not the DOM.

- **Concurrent editing (CRDT merge conflicts)**: Yjs uses a last-write-wins strategy with undo support:
  - Each user's edits are interleaved by their causal timestamps.
  - If two users edit the same block simultaneously, the result is a merged document with concurrent insertions interleaved (Yjs preserves intent).
  - If the result is semantically broken (e.g., one user deletes a word while another formats it), the undo history allows either user to undo their own changes without affecting the other's.

- **Paste from web (HTML sanitization)**:
  1. On paste event, intercept the clipboard data.
  2. Parse HTML with DOMParser.
  3. Run through sanitization pipeline:
     - Strip `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`.
     - Strip all `on*` event handlers, `javascript:` URLs, `data:` URLs (except for images).
     - Allowlist tags: `p`, `h1`-`h6`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `strong`, `em`, `a`, `img`, `br`, `hr`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `span`, `div`.
     - Allowlist attributes: `href`, `src`, `alt`, `title`, `width`, `height`, `class`, `colspan`, `rowspan`.
     - Normalize `class` attributes: only allow known safe values (e.g., language hint for code blocks).
  4. Convert sanitized HTML to ProseMirror nodes via the HTML parser.
  5. If the pasted content is plain text (no HTML), wrap each line in a paragraph block.

- **Mobile input**:
  - On mobile/touch devices, the slash menu is triggered by a floating "+" button rather than "/" typing (avoiding accidental triggers).
  - Toolbar collapses to a compact row with the most-used formatting options (B, I, H, List, Image) plus a "more" overflow menu.
  - Block drag handles enlarge to 44×44px touch targets.
  - The editor viewport scrolls to keep the cursor in the visible area when the virtual keyboard opens (`visualViewport` API).
  - Attachments use the native file picker (accept="image/*,video/*,audio/*") with compression for large images (client-side resize to max 2048px on the longest edge, JPEG q85).

## 45. Tag System (#2)

**Priority:** P0 (core)
**Status:** Draft
**Dependencies:** None (foundational feature)
**Inverse Dependencies:** #1 (Note Taking), #3 (Semantic Search), #15 (Doc Context Graph), #22 (Agentic Chat — RAG), #23 (Wiki Synthesis), #31 (Auto Mind Map), #35 (Node Map Editor)

### What

A hierarchical tag system that supports parent/child tag relationships, color-coded labels, auto-tagging rules, tag-based collections, a tag graph visualization, and tag renaming with propagation across all documents. Tags serve as the primary organizational axis for notes — they power search filtering, context graph connections, mind maps, and chat context scoping.

### Architecture

**Tag registry (flat + hierarchy):**

```
Tag Registry (in-memory cache, backed by DB)
  ┌──────────────────────────────────────────────────────┐
  │  Flat index: tag_id → {name, color, parent_id, ...}  │
  │  Tree index: parent_id → [child_tag_ids]             │
  │  Path cache: tag_id → ["Work", "Projects", "Active"] │
  │                                                       │
  │  Operations:                                          │
  │  • getTag(id) — O(1) flat lookup                      │
  │  • getChildren(id) — O(1) tree lookup                 │
  │  • getPath(id) — O(depth) ancestor chain              │
  │  • getAllDescendants(id) — BFS over tree              │
  │  • validate(parent_id) — cycle check on insert/update │
  └──────────────────────────────────────────────────────┘
```

**Tag propagation on rename/delete:**

```
Tag renamed (name change)
  └→ Update tags table: SET name = new_name WHERE id = :tag_id
  └→ Update tag_rules table: SET conditions JSON (find-replace tag name in rule conditions)
  └→ No change to doc_tags rows (they reference tag_id, not name)
  └→ Invalidate tag registry cache
  └→ Reindex search: update tag names in search index (Elasticsearch / Meilisearch)
  └→ Emit event: tag:renamed {old_name, new_name, tag_id}
       └─ AI panel: if tag name changed semantically, suggest re-classification
       └─ Context graph: update edge labels if tag was used as an edge property

Tag deleted
  └→ DELETE FROM tags WHERE id = :tag_id (CASCADE deletes doc_tags rows)
  └→ Remove from tag registry cache
  └→ Reassign orphaned children:
       └─ For each child of deleted tag:
            └─ SET parent_id = deleted_tag.parent_id (promote to grandparent)
       └─ If deleted tag was root (parent_id IS NULL) → children become root tags
  └→ Cascade to tag_rules:
       └─ For each rule referencing deleted tag in conditions:
            └─ Remove that condition clause
            └─ If rule has no remaining conditions → delete rule
            └─ Log: "Rule 'Auto-tag invoices' had all conditions referencing deleted tag 'invoices' — rule deleted"
  └→ Reindex search: remove tag from search indices
  └→ Emit event: tag:deleted {tag_id, name, affected_doc_count}
```

**Auto-tagging pipeline:**

```
┌────────────────────────────────────────────────────────────┐
│  Auto-Tagging Pipeline                                      │
│                                                              │
│  Trigger: note created / note updated / manual "Run rules"   │
│                                                              │
│  1. Rule-based tagging (synchronous, deterministic):         │
│     ┌────────────────────────────────────────────────────┐  │
│     │  For each enabled tag_rule (ordered by priority):   │  │
│     │   ├─ Evaluate conditions against note content +     │  │
│     │   │   metadata (title, tags, block types, regex)    │  │
│     │   ├─ If all conditions match:                       │  │
│     │   │   ├─ Apply tag with applied_by = 'rule'         │  │
│     │   │   └─ If auto_apply = false → suggest tag        │  │
│     │   │      in a banner: "Apply tag 'invoices'?"       │  │
│     │   └─ If no rules match → proceed to step 2          │  │
│     └────────────────────────────────────────────────────┘  │
│                                                              │
│  2. AI-suggested tagging (async, model-dependent):           │
│     ┌────────────────────────────────────────────────────┐  │
│     │  ┌─ Feature extraction:                              │  │
│     │  │  • Extract keywords (TF-IDF on note content)     │  │
│     │  │  • Extract entities (NER: people, places, orgs)  │  │
│     │  │  • Extract topics (LDA / BERT topic model)       │  │
│     │  ├─ Match against existing tags:                    │  │
│     │  │  • Cosine similarity: tag name/desc embedding    │  │
│     │  │    vs. note embedding                            │  │
│     │  │  • Top-3 suggestions with confidence scores       │  │
│     │  ├─ If confidence > 0.85 → auto-apply               │  │
│     │  │  (applied_by = 'auto')                            │  │
│     │  └─ If 0.5 < confidence < 0.85 → show suggestion    │  │
│     │     bar: "Suggested tags: #research (82%)"           │  │
│     └────────────────────────────────────────────────────┘  │
│                                                              │
│  3. Tag suggestion persistence:                              │
│     └─ Pending suggestions stored in tag_suggestions table   │
│        └─ User can accept/reject in the tag editor panel     │
│        └─ Rejected suggestions suppress re-suggestion        │
│           (stored in tag_suggestion_rejections table)        │
└────────────────────────────────────────────────────────────┘
```

**Tag indexing for search:**

```
Tag index (in-memory trie + DB-backed):
  ┌──────────────────────────────────────────────────────┐
  │  Prefix trie: "wor" → ["work", "work/personal",      │
│  │                       "work/meeting", "wordpress"]   │  │
  │  Search query: tag:work → find all docs with tag      │
  │  Search query: tag:work/* → find all docs under       │
  │                      tag "work" and its descendants   │
  │                                                       │
  │  Autocomplete: "ta" → "tag:task", "tag:tax", ...     │
  │  (used in search bar for @tag: completions)           │
  └──────────────────────────────────────────────────────┘
```

### UI / Interaction

```
┌──────────────────────────────────────────────────────────────┐
│  Left Sidebar — Tags Section                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🏷️  Tags                                  [+ Add tag]  │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │  🔍 Filter tags...                                 │  │  │
│  │  ├───────────────────────────────────────────────────┤  │  │
│  │  │  📁 Work                          ○ 12 notes  🔴  │  │  │
│  │  │  ├─ 📁 Projects                    ○ 8 notes      │  │  │
│  │  │  │  ├─ 🏷️ Active                  ○ 5 notes  🟢  │  │  │
│  │  │  │  └─ 🏷️ Archived               ○ 3 notes  ⚪  │  │  │
│  │  │  ├─ 🏷️ Meetings                   ○ 4 notes  🔵  │  │  │
│  │  │  └─ 🏷️ Standup                   ○ 2 notes  🟡  │  │  │
│  │  │  📁 Personal                      ○ 7 notes  🟣  │  │  │
│  │  │  ├─ 🏷️ Health                    ○ 3 notes      │  │  │
│  │  │  └─ 🏷️ Finance                   ○ 4 notes  🟠  │  │  │
│  │  │  📁 Uncategorized                 ○ 2 notes      │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                          [View as list]  │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Tag color legend:  🟢 = green, 🔵 = blue, 🟡 = yellow, 🟠 = orange,
                   🔴 = red, 🟣 = purple, ⚪ = grey

Tag Editor Dialog (right-click on tag → Edit):
┌──────────────────────────────────────────────┐
│  Edit Tag                                      │
│                                               │
│  Name:  [Work / Projects / Active___________] │
│                                               │
│  Color:  ○ 🔴  ● 🟢  ○ 🔵  ○ 🟡  ○ 🟣  ○ ⚪ │
│                                               │
│  Parent tag: [Work / Projects ___________▼]  │
│                                               │
│  Auto-tag rules: (2) [Manage rules...]        │
│                                               │
│  [Delete tag]  [Cancel]  [Save]               │
└──────────────────────────────────────────────┘

Tag Picker (in editor, click tag area):
┌──────────────────────────────────────────────┐
│  Add tags... [search or select_____________] │
│                                               │
│  ┌─ Frequently used ───────────────────────┐ │
│  │  #work      #personal     #health       │ │
│  │  #projects  #meetings     #finance      │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  ┌─ All tags ───────────────────────────────┐ │
│  │  #work                                     │ │
│  │  #work/projects                            │ │
│  │  #work/projects/active                     │ │
│  │  #work/projects/archived                   │ │
│  │  #work/meetings                            │ │
│  │  #work/standup                             │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  [Create new tag: "new-tag"]                  │
└──────────────────────────────────────────────┘

Auto-tag Rules Manager:
┌──────────────────────────────────────────────────────────────┐
│  Auto-Tag Rules                               [+ New Rule]   │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Rule: "Technical notes"  🟢 Enabled                      ││
│  │  Conditions: title contains "API" OR content matches      ││
│  │  regex /(code snippet|function|class)/i                   ││
│  │  Action: Apply tag #dev/code — Auto-apply: ✅             ││
│  │  Last triggered: 2m ago (12 notes)                        ││
│  ├──────────────────────────────────────────────────────────┤│
│  │  Rule: "Meeting notes"  🟢 Enabled                        ││
│  │  Conditions: title contains "Meeting" OR block type       ││
│  │  "callout" AND content matches /agenda|attendees/i        ││
│  │  Action: Suggest tag #work/meetings — Auto-apply: ❌      ││
│  │  Last triggered: 1h ago (8 notes)                         ││
│  └──────────────────────────────────────────────────────────┘│
│  [Run all rules now]  [Export rules]  [Import rules]         │
└──────────────────────────────────────────────────────────────┘
```

- **Tag tree sidebar**: Left sidebar section displaying tags hierarchically. Expand/collapse parent tags. Click a tag to filter notes by that tag (and optionally its descendants). Right-click for context menu: Edit, Rename, Change Color, Add Child Tag, Delete, Copy Tag ID.
- **Tag color indicator**: Each tag shows a colored dot next to its name. Color is inherited from the closest ancestor with an explicit color (if not set, defaults to grey).
- **Tag drag-and-drop**: Drag a tag onto another tag to set it as a child. Drag a tag onto a note card to apply it. Drag a tag to the tag tree root area to make it a root tag.
- **Inline tag editing**: In the note editor, clicking a tag pill opens an inline editor to change color or remove the tag. Typing `#` starts autocomplete for existing tags. New tag names are created on the fly.
- **Tag count badge**: Next to each tag in the sidebar, a subtle count shows the number of notes with that tag (including descendant tags — configurable toggle).
- **Tag graph icon**: Bottom of the tags panel — clicking opens a full-screen tag graph visualization showing tag relationships as a connected graph (nodes = tags, edges = parent-child relationships, node size = note count).
- **Bulk tag editor**: A dedicated view accessible from the tag context menu → "Edit all notes with this tag" shows a data-table of all tagged notes with batch actions: add tag, remove tag, replace tag, rename tag across all notes.

### Data Model

n+1) Tags table:

```sql
CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    color           TEXT CHECK (color IN ('red', 'green', 'blue', 'yellow',
                              'purple', 'orange', 'grey', 'teal', 'pink')),
    parent_id       UUID REFERENCES tags(id) ON DELETE SET NULL,
    description     TEXT,
    icon            TEXT, -- optional emoji override of color dot
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce unique name within the same parent (siblings must have unique names)
CREATE UNIQUE INDEX idx_tags_sibling_name ON tags(parent_id, name)
    WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX idx_tags_root_name ON tags(name)
    WHERE parent_id IS NULL;

-- Path index for recursive queries
CREATE INDEX idx_tags_parent ON tags(parent_id);
```

n+2) Doc-tag assignments:

```sql
CREATE TABLE doc_tags (
    doc_id          UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    applied_by      TEXT NOT NULL DEFAULT 'manual'
                        CHECK (applied_by IN ('manual', 'auto', 'rule')),
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (doc_id, tag_id)
);

CREATE INDEX idx_doc_tags_tag ON doc_tags(tag_id);
CREATE INDEX idx_doc_tags_doc ON doc_tags(doc_id);
CREATE INDEX idx_doc_tags_applied ON doc_tags(applied_by, applied_at);
```

n+3) Auto-tag rules:

```sql
CREATE TABLE tag_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    conditions      JSONB NOT NULL, -- see structure below
    match_mode      TEXT NOT NULL DEFAULT 'all'
                        CHECK (match_mode IN ('all', 'any')),
    auto_apply      BOOLEAN NOT NULL DEFAULT TRUE,
    priority        INTEGER NOT NULL DEFAULT 0,
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tag_rules_tag ON tag_rules(tag_id);
CREATE INDEX idx_tag_rules_enabled ON tag_rules(is_enabled, priority);

-- Conditions JSON structure:
-- {
--   "clauses": [
--     { "field": "title", "op": "contains", "value": "API" },
--     { "field": "content", "op": "regex", "value": "(code snippet|function)" },
--     { "field": "block_type", "op": "equals", "value": "callout" },
--     { "field": "tag", "op": "has", "value": "work" },
--     { "field": "has_attachment", "op": "equals", "value": true }
--   ]
-- }
-- Supported fields: title, content, block_type, tag, has_attachment, word_count, created_at
-- Supported ops: contains, equals, regex, gt, lt, has
```

n+4) Tag suggestions (AI-generated, pending user review):

```sql
CREATE TABLE tag_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id          UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    confidence      REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    source          TEXT NOT NULL CHECK (source IN ('ai', 'rule')),
    is_accepted     BOOLEAN, -- NULL = pending, TRUE = accepted, FALSE = rejected
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX idx_tag_suggestions_doc ON tag_suggestions(doc_id);
CREATE INDEX idx_tag_suggestions_pending ON tag_suggestions(doc_id, tag_id)
    WHERE is_accepted IS NULL;

-- Rejection tracking (to avoid re-suggesting rejected tags):
CREATE TABLE tag_suggestion_rejections (
    doc_id          UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    rejected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (doc_id, tag_id)
);
```

n+5) Materialized path helper for recursive tag queries:

```sql
-- Recursive CTE to get all descendant tags (for search filtering)
-- Example: Find all notes under tag 'work' and its descendants:
--
-- WITH RECURSIVE descendant_tags AS (
--     SELECT id FROM tags WHERE id = :tag_id
--     UNION ALL
--     SELECT t.id FROM tags t
--     INNER JOIN descendant_tags dt ON t.parent_id = dt.id
-- )
-- SELECT dt.doc_id FROM doc_tags dt
-- WHERE dt.tag_id IN (SELECT id FROM descendant_tags);
```

### Integration Points

| Feature | Integration |
|---------|-------------|
| #1 | Tags are assigned to notes via the tag picker in the editor. Tag pills render inline below the note title. The `doc_tags` join table links the tag system to the editor |
| #3 | Search uses tags as a filter dimension (`tag:work` or `tag:work/*` for descendant-inclusive). Tag names are indexed in the search engine for prefix autocomplete. Search results show tag pills as metadata |
| #15 | Tags form the backbone of the context graph — notes sharing tags create implicit edges. Tag hierarchy maps to graph clusters. Edges are filtered by tag for focused graph views |
| #22 | Chat context can be scoped by tag: "Answer questions based on notes tagged #work/projects". The AI retrieves notes from the tag's descendant set as its knowledge base |
| #23 | Wiki pages can be organized by tag. The Wiki Synthesis agent can auto-group articles by their tag hierarchy and generate a table of contents from the tag tree |
| #31 | Mind maps can be generated from tag structure. The root tag becomes the central node, child tags become branches, and notes under each tag become leaf nodes with previews |
| #35 | The Node Map editor uses tags as a primary grouping mechanism. Tags define "swimlanes" or "clusters" in the visual layout. Nodes are color-coded by their dominant tag |

### Edge Cases

- **Circular parent references (validation on insert)**: Before inserting or updating a tag's `parent_id`, the system validates the proposed parent chain:
  1. Walk ancestors from the proposed parent up to the root.
  2. If the tag being updated appears in the ancestor chain, reject with: "Cannot set 'Active' as a child of 'Projects' — 'Active' is an ancestor of 'Projects' (circular reference detected)."
  3. The validation is done in a DB transaction with a `WITH RECURSIVE` query for consistency under concurrent access.
  4. Max ancestor chain depth is 10 (see performance note below). If a cycle would exceed depth 10, it is assumed circular and rejected.

- **Bulk tag rename on 1000+ docs**: When a tag is renamed (e.g., "work/projects" → "work/engagements"):
  1. The `tags.name` update is instant (single row UPDATE).
  2. No `doc_tags` rows are affected (they reference `tag_id`).
  3. However, the search index (Elasticsearch/Meilisearch) needs a bulk re-index for all docs with that tag:
     - Enqueue a background job: `reindex_tag_docs(tag_id, old_name, new_name)`.
     - The job batches doc IDs in groups of 100 and sends bulk update requests to the search index.
     - Progress is tracked in a `background_jobs` table with estimated total count and completed count.
     - The tag editor shows a progress indicator: "Updating search index... 450/1200 documents reindexed."
     - If the job fails mid-way, it resumes from the last checkpoint (batch-level idempotency).
  4. UI is immediately consistent (tag registry in-memory cache invalidated on rename) — the search index may lag by a few seconds for large renames.

- **Tag deletion cascading**: Deleting a tag (`DELETE FROM tags WHERE id = :id`) automatically cascades:
  1. `doc_tags` rows referencing the tag are deleted (ON DELETE CASCADE).
  2. Child tags are promoted: their `parent_id` is set to the deleted tag's parent (ON DELETE SET NULL on `tags.parent_id`, but we handle promotion in application logic before the delete — see Architecture: Tag propagation on rename/delete).
  3. `tag_rules` referencing the tag are deleted (ON DELETE CASCADE).
  4. `tag_suggestions` and `tag_suggestion_rejections` rows are cleaned up.
  5. A confirmation dialog shows the impact: "Delete 'Projects'? This will: remove the tag from 12 notes, promote 3 child tags to 'Work', delete 1 auto-tag rule. [Cancel] [Delete]".
  6. The operation is wrapped in a transaction. If any step fails, the entire delete is rolled back.

- **Nested tag query performance (recursive CTE)**: Querying all descendants of a deep hierarchy can be slow with recursive CTEs:
  - For the common case (depth < 5, < 100 tags), the recursive CTE completes in < 5ms.
  - For deep hierarchies (depth up to 10, 1000+ tags), the CTE is optimized with:
    - An index on `tags.parent_id` (already defined).
    - A materialized tag path table (optional, see Data Model n+5) that stores precomputed ancestor paths. This is updated via triggers on `tags.parent_id` changes and rebuilt nightly.
    - The search index stores the full tag path (e.g., "Work/Projects/Active") for each document, so ancestor queries can be served from the search engine without DB recursion.
  - Max tag hierarchy depth is enforced at 10 levels. Inserts that would exceed depth 10 are rejected: "Tag hierarchy depth limit (10) exceeded. Consider reorganizing your tags."

- **Tag color contrast accessibility**:
  - Tag colors are displayed as filled pill backgrounds with white text. Each color has a defined dark and light variant:
    - `red`: bg #E53E3E (dark), #FC8181 (light), text always white.
    - `green`: bg #38A169 (dark), #68D391 (light), text always white.
    - `blue`: bg #3182CE (dark), #63B3ED (light), text always white.
    - `yellow`: bg #D69E2E (dark), #F6E05E (light), text always #1A202C (dark).
    - `purple`: bg #805AD5 (dark), #B794F4 (light), text always white.
    - `orange`: bg #DD6B20 (dark), #F6AD55 (light), text always #1A202C (dark).
    - `grey`: bg #718096 (dark), #A0AEC0 (light), text always white.
    - `teal`: bg #319795 (dark), #4FD1C5 (light), text always white.
    - `pink`: bg #D53F8C (dark), #F687B3 (light), text always white.
  - All color combinations meet WCAG AA contrast ratio (>4.5:1 for body text, >3:1 for large text).
  - Custom tag colors (future feature) must pass an on-the-fly contrast check before being accepted. If the background is too light, text is automatically switched to dark (#1A202C).
  - A "High contrast mode" option in Settings → Appearance forces all tag pills to use dark backgrounds with white text regardless of the selected color.

- **Concurrent tag operations**:
  - Rename and delete operations are wrapped in `SELECT ... FOR UPDATE` on the `tags` row to prevent race conditions.
  - If two users rename the same tag simultaneously, the second writer waits for the first transaction to complete, then re-evaluates the operation on the updated state.
  - If a tag is deleted while being used in an auto-tag rule evaluation (running in a background job), the job's read of the tag returns NULL, and the rule condition referencing that tag is skipped and logged.

- **Tag name collision on rename**: If a rename would create a duplicate sibling name, the rename is rejected with a suggestion: "A tag named 'Projects' already exists under 'Work'. Rename to 'Projects-2' or choose a different name."



## 46. Hierarchical Nested Docs (#5)

**Priority**: P0 (core)  
**Dependencies**: #1 (Note Taking)

**What**: Document tree with infinite nesting — any doc can be a parent of other docs. Breadcrumb navigation, collapse/expand, drag-and-drop reorganize, docket/undocket (inline vs reference).

**Architecture**:
The tree uses a dual storage strategy: a `parent_id` column on the `docs` table for O(1) direct parent lookup, and a closure table (`doc_tree`) for efficient subtree queries.

```
                     ┌─────────────────────┐
                     │    Tree Operations   │
                     │  Service Layer        │
                     └──────┬──────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                   ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  docs table  │  │  doc_tree    │  │  tree_cache  │
  │  (adjacency) │──│  (closure)   │  │  (LRU, 500)  │
  │  parent_id   │  │  ancestor /  │  │  path cache  │
  │  sort_order  │  │  descendant  │  │              │
  └──────────────┘  └──────────────┘  └──────────────┘
```

**Tree Operations**:
- **Move subtree**: Validate no cycle (target cannot be in source's descendants) → UPDATE parent_id → delete and re-insert closure table rows for the moved subtree
- **Reorder siblings**: Fractional indexing (sort_order = mid-point between prev/next siblings) to avoid renumbering
- **Path resolution**: Cached path string (e.g. `root/projects/active/knot`) stored in tree_cache, invalidated on move
- **Docket (inline embed)**: Renders child content directly inside parent document without a separate editor view
- **Undocket (linked reference)**: Shows child title as a reference link; click opens the child document

**Data Model**:
```sql
-- Add to existing docs table
ALTER TABLE docs ADD COLUMN parent_id TEXT REFERENCES docs(id);
ALTER TABLE docs ADD COLUMN sort_order TEXT NOT NULL DEFAULT 'a0';

-- Closure table for subtree queries
CREATE TABLE doc_tree (
  ancestor_id TEXT NOT NULL REFERENCES docs(id),
  descendant_id TEXT NOT NULL REFERENCES docs(id),
  depth INTEGER NOT NULL CHECK(depth >= 0),
  PRIMARY KEY (ancestor_id, descendant_id)
);
CREATE INDEX idx_doc_tree_descendant ON doc_tree(descendant_id);
```

**Integration Points**:
| Feature | Integration |
|---------|-------------|
| #1 | Editor shows breadcrumb and parent backlink |
| #7 | Clone inherits tree position from source |
| #8 | Version snapshots include parent_id and sort_order |
| #14 | Node Map renders tree structure visually |
| #16 | Sidebar tree uses parent_id for hierarchy |
| #37 | Kanban groups by parent doc |

**Edge Cases**:
- **Deep nesting**: Hard limit of 64 levels. Warning shown at 50+ levels.
- **Circular parent**: Validated on update with a check: "Is target already a descendant of source?"
- **Mass move**: Moving 1000+ children runs as background job with progress indicator
- **Deleted parent**: Children promoted to root level (parent_id → NULL), not cascade-deleted
- **Cross-workspace drag**: Not allowed. Shows "Create a cross-workspace link instead?"

---

## 47. Block References (#6)

**Priority**: P0 (core)  
**Dependencies**: #1 (Note Taking)

**What**: Reference any block by unique ID. Syntax: `((block-id))`. Two types: **link** (clickable preview on hover) and **embed** (live-synced inline content). Reference sidebar shows backlinks and forward links.

**Architecture**:
```
Reference Resolution Pipeline
  Input: ((abc-123))
     │
     ▼
  ┌─────────────┐
  │  Parser     │  Extract block ID from `((...))` syntax
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Resolver   │  Look up block in doc_blocks table
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Renderer   │  link → tooltip preview | embed → inline content
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Indexer    │  Write to block_refs table + update search index
  └─────────────┘
```

**Embed sync**: Embedded blocks use Yjs sub-documents. When the source block changes, all embed instances receive the update via the shared Yjs document. If Yjs is not available (offline-first sync pending), content hash comparison is used: embeds display a "Click to refresh" banner when source hash differs.

**Data Model**:
```sql
CREATE TABLE block_refs (
  id TEXT PRIMARY KEY,
  source_doc_id TEXT NOT NULL REFERENCES docs(id),
  source_block_id TEXT NOT NULL,
  target_doc_id TEXT NOT NULL REFERENCES docs(id),
  target_block_id TEXT NOT NULL,
  ref_type TEXT NOT NULL CHECK(ref_type IN ('link', 'embed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(source_block_id, target_block_id, ref_type)
);
CREATE INDEX idx_block_refs_target ON block_refs(target_doc_id, target_block_id);
CREATE INDEX idx_block_refs_source ON block_refs(source_doc_id, source_block_id);
```

**Integration Points**:
| Feature | Integration |
|---------|-------------|
| #1 | Slash command "/ref" to insert block reference |
| #3 | Block ref content indexed for full-text search |
| #5 | Ref across document hierarchy |
| #7 | Clone creates new block IDs but preserves refs |
| #8 | Version snapshots include block_refs table state |
| #15 | Context graph uses block_refs as edge source |

**Edge Cases**:
- **Circular embed**: A embeds B embeds A. Render limit: 5 levels, then show "Max embed depth reached"
- **Deleted block**: Broken link indicator with "Reconnect?" button that suggests similar blocks
- **1000+ refs to one block**: Lazy count in UI ("1.2K refs"), background update of ref count
- **Source block renamed**: Optional prompt "Update all 12 embeds to match new content? This will replace the current content in embeds with the updated source."
- **Cross-workspace ref**: Not supported. Shows "Create a link to this document in another workspace instead?"
- **Encrypted target**: Ref resolved only if user has decryption key; otherwise shown as "🔒 Block in encrypted document"



## 48. Clone Notes (#7)

**Priority**: P1  
**Dependencies**: #1 (Note Taking), #5 (Hierarchical Nested Docs)

**What**: Create a linked or independent copy of any document. Linked clones stay in sync (changes propagate bidirectionally), independent clones are snapshots at clone time. Clone indicator badge, "Go to original" navigation, clone tree visualization.

**Architecture**:
```
Clone Resolution
  User clicks "Clone"
     │
     ├── Linked Clone ──► Yjs sub-doc sync ──► bidirectional sync
     │
     └── Independent Clone ──► Deep copy blocks ──► frozen relation
                              │
                              ▼
                    clone_origins table
                    (source_id → clone_id)
```

Linked clones share the same Yjs document underneath. Independent clones get a full block copy with a `clone_origins` record for provenance.

**Data Model**:
```sql
CREATE TABLE clone_origins (
  clone_id TEXT PRIMARY KEY REFERENCES docs(id),
  source_id TEXT NOT NULL REFERENCES docs(id),
  clone_type TEXT NOT NULL CHECK(clone_type IN ('linked', 'independent')),
  cloned_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT  -- NULL for independent, updated on sync for linked
);
CREATE INDEX idx_clone_origins_source ON clone_origins(source_id);
```

**Integration Points**:
| Feature | Integration |
|---------|-------------|
| #5 | Clone inherits tree position from source |
| #6 | Block references preserved in clones (new block IDs for independent) |
| #8 | Version snapshot before clone operation |
| #15 | Context graph shows clone relationship edges |

**Edge Cases**:
- **Clone of clone**: Linked clone chain (A → B → C). Updating A propagates to all linked descendants.
- **Break link**: Convert linked clone to independent: deep-copy blocks, remove Yjs shared doc, keep clone_origins history
- **Delete source with linked clones**: Warning "This document has 5 linked clones. Break links and keep clones as independent documents?"

---

## 49. Versioning (#8)

**Priority**: P1  
**Dependencies**: #1 (Note Taking)

**What**: Time-based snapshots of document state. Manual savepoints, auto-savepoints on significant edits, version diff (side-by-side or inline), version compare, restore to previous version, retention policy (keep hourly for 24h, daily for 30d, weekly for 6mo).

**Architecture**:
```
Version Pipeline
  Trigger (manual / auto / timer)
     │
     ▼
  ┌──────────────┐
  │  Snapshot    │  Serialize doc blocks → JSON blob
  │  Engine      │  + metadata (title, tags, tree position, block refs)
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │  Storage     │  Write to versions table + blob store
  │  Manager     │  Retention: delete expired versions
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │  Diff Engine │  JSON diff between two versions → patch
  └──────────────┘
```

Diff engine uses JSON Patch (RFC 6902) to compute structural deltas between versions. The patch is stored alongside full snapshots for efficient "What changed?" queries.

**Data Model**:
```sql
CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES docs(id),
  version_type TEXT NOT NULL CHECK(version_type IN ('manual', 'auto', 'timer')),
  snapshot_path TEXT NOT NULL,  -- path in blob store
  patch_path TEXT,  -- JSON patch from previous version (NULL for first)
  parent_version_id TEXT REFERENCES versions(id),
  
  -- Metadata at snapshot time
  title_snapshot TEXT NOT NULL,
  tag_ids TEXT,  -- JSON array, frozen at snapshot
  tree_parent_id TEXT,
  block_count INTEGER NOT NULL,
  char_count INTEGER NOT NULL,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL  -- computed from retention policy
);
CREATE INDEX idx_versions_doc ON versions(doc_id, created_at DESC);
```

**Integration Points**:
| Feature | Integration |
|---------|-------------|
| #1 | Editor shows version history in a right panel |
| #5 | Tree position (parent_id, sort_order) captured in version metadata |
| #6 | Block reference graph state captured at version time |

**Edge Cases**:
- **Large document diff**: For 10K+ block changes, diff computation runs as background job. UI shows "Computing diff..." progress.
- **Storage quota**: Version storage is capped at 500MB per workspace. Oldest versions are auto-deleted when quota is reached, regardless of retention policy.
- **Conflicting restore**: If user A restores while user B is editing, B sees "This document has been restored to a previous version. Reload to see the restored version." Yjs merge with versioned state.
- **Binary content in blocks**: Images/attachments within blocks are referenced by blob hash in the version snapshot, not duplicated. The blob store retains referenced blobs even if the current version deletes them.



## 50. Auto-Classify (#47)

**Priority**: P1 • **Dependencies**: #21 (Auto-Tagging)

**What**: Automatically categorize notes as they're created or imported using ML classification. Suggests tags, folders, and document type based on content analysis.

**Architecture**: Three-tier pipeline — (1) **Lightweight**: keyword/tf-idf classifier runs client-side for instant suggestions. (2) **Model**: ONNX-runtime local model (distilbert-based) for richer classification, runs in background. (3) **Cloud**: Ollama API call when available, async with fallback.

```
Content → [Tokenizer] → [Tier-1: TF-IDF] ➔ instant tags
                    ↘ [Tier-2: ONNX Model] ➔ enriched tags (async)
                        ↘ [Tier-3: Ollama] ➔ full classification (if AI enabled)
```

**Data Model**:
```sql
CREATE TABLE auto_classify_rules (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,        -- keyword/regex
  target_type TEXT NOT NULL,    -- 'tag' | 'folder' | 'type'
  target_id TEXT NOT NULL,      -- tag_id or folder_id
  confidence FLOAT DEFAULT 0.7, -- min confidence to auto-apply
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Integration**: #2 (tag suggestions), #3 (search index enrichment), #48 (folder suggestions uses same pipeline), #51 (link discovery triggered after classification)

**Edge Cases**: Low-confidence documents → queue for review; model updates → re-classify only docs modified since last update; multi-language content → language detection before routing to model.

---

## 51. Auto-Folder Suggest (#48)

**Priority**: P1 • **Dependencies**: #5 (Hierarchical Nested Docs), #47 (Auto-Classify)

**What**: Suggests a target folder when saving/moving a note. Learns from user's past placement decisions.

**Architecture**: Hybrid approach — content-based (from #47 classification) + behavior-based (logistic regression over user's folder assignment history). Trainer runs weekly on background.

```
Note → [Content Vector] ─┐
                          ├──► [Scorer] → [Ranked Folder List]
User History → [Features] ┘
```

**Data Model**:
```sql
CREATE TABLE folder_suggestions_log (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES docs(id),
  suggested_folder_id TEXT REFERENCES docs(id),
  accepted BOOLEAN,
  presented_at TEXT NOT NULL,
  decided_at TEXT
);
```

**Integration**: #5 (folder tree), #16 (sidebar highlights suggested folder), #47 (classification pipeline shared)

**Edge Cases**: No history → content-only mode; folder deleted after suggestion → retry; user always rejects → model cools off that folder; new workspace → cold start with content-only.

---

## 52. Auto-Link Discovery (#49)

**Priority**: P2 • **Dependencies**: #3 (Semantic Search), #47 (Auto-Classify)

**What**: Automatically discovers and suggests links between notes based on content similarity, co-occurring tags, and reference patterns.

**Architecture**: Periodic background job runs embedding comparison across notes. Any pair with cosine similarity > 0.75 triggers a link suggestion. Interactive: "Link these notes?" toast. Auto-link threshold (0.90+) creates link silently with low weight in #18.

```
[Content Embeddings] → [Cosine Similarity Matrix] → [Threshold Filter]
    ↕ (weekly refresh)                                   │
  [Ollama/Voyager]                                  ┌────┴────┐
                                               [0.90+]   [0.75-0.90]
                                                  │          │
                                            auto-link     suggest
                                            (silent)      (toast)
```

**Data Model**:
```sql
CREATE TABLE link_suggestions (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES docs(id),
  target_id TEXT NOT NULL REFERENCES docs(id),
  similarity FLOAT NOT NULL,
  method TEXT NOT NULL CHECK(method IN ('embedding', 'tag_overlap', 'ref_pattern')),
  auto_applied BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source_id, target_id, method)
);
```

**Integration**: #3 (search feeds candidates), #15 (context graph reads suggestions), #18 (connection strength weighted), #47 (classification enriches embeddings)

**Edge Cases**: 10K+ docs (similarity matrix is O(n²) — batch by weekly refresh, incremental for new/modified docs); user dismisses suggestion repeatedly → cool-off period (30 days); deleted doc in suggestion → prune on refresh.

---

## 53. Auto-Template Matching (#50)

**Priority**: P2 • **Dependencies**: #19 (Template System), #47 (Auto-Classify)

**What**: Automatically suggests and applies a template when creating a new note based on content cues (title keywords, source URL domain, import format).

**Architecture**: Rule-based matcher (fast) + LLM-based matcher (rich, async). When creating a note, the system checks title keywords against template rules. If rule matches, template is pre-applied. If LLM suggests a different template, a notification offers to switch.

```
New Note → [Title/URL] → [Rule Matcher] → match → apply template
                              ↓ no match
                       [LLM Matcher] → suggestion → user decides
```

**Data Model**: Reuses #19 template_rules. Add:
```sql
ALTER TABLE template_rules ADD COLUMN auto_match_priority INTEGER DEFAULT 0;
ALTER TABLE template_rules ADD COLUMN auto_match_keywords TEXT;  -- JSON array
```

**Integration**: #19 (template storage), #47 (classification provides note type hint), #32 (daily notes auto-template based on day of week)

**Edge Cases**: Two rules match equally → higher priority wins, show others as alternatives; template deleted after rule created → deactivate rule; user always rejects → learn and lower auto_match_priority.

CREATE TABLE folder_suggestions_log (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES docs(id),
  suggested_folder_id TEXT REFERENCES docs(id),
  accepted BOOLEAN,


## 54. Auto-Merge Duplicates (#51)

**Priority**: P2 • **Dependencies**: #3 (Semantic Search), #49 (Auto-Link Discovery)

**What**: Detects and merges duplicate or near-duplicate notes. Comparison by title similarity, content overlap, and URL source.

**Architecture**: Pipeline runs weekly (or on-demand). Candidates from embedding similarity (>0.95) → content hash comparison → merge preview. Merge operation: combine blocks, preserve both creation dates, add alias to merged doc.

```
Doc Pair → [Similarity > 0.95] → [Content Hash Match] → [Merge Preview]
                                                              │
                                                    ┌─────────┴─────────┐
                                                    │                   │
                                               auto-merge        suggest merge
                                            (identical hash)     (similar only)
```

**Data Model**:
```sql
CREATE TABLE merge_candidates (
  id TEXT PRIMARY KEY,
  keep_id TEXT NOT NULL REFERENCES docs(id),
  merge_id TEXT NOT NULL REFERENCES docs(id),
  similarity FLOAT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','merged')),
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Integration**: #6 (block references updated after merge), #8 (version snapshot before merge), #49 (link discovery feeds candidates), #18 (connection strength updated)

**Edge Cases**: Conflict (both docs have different content for same block) → keep both versions as sibling blocks with annotation; merge of merged doc → cascade; user rejects → add to exclusion list for 90 days.

---

## 55. Notification System (#52)

**Priority**: P2 • **Dependencies**: None

**What**: In-app notification center + optional push via web push API / desktop native. Notification types: mention, comment, suggestion, system, reminder.

**Architecture**: Event-driven — any feature can emit a notification event. The notification service de-duplicates by type+doc_id+user_id within 5min window.

```
[Feature Events] → [Notification Service] → [De-dup (5min)] → [DB]
                                    ↕                                ↕
                              [Web Push] ← [User Preferences] → [Polling UI]
```

**Data Model**:
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('mention','comment','suggestion','system','reminder')),
  title TEXT NOT NULL,
  body TEXT,
  doc_id TEXT REFERENCES docs(id),
  actor_id TEXT,               -- who triggered this
  read BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
```

**Integration**: #22 (agentic chat sends suggestion notification), #23 (wiki update notification), #24 (daily briefing delivered as notification), #29 (AI insights), #50 (template suggestion notification), #49 (link suggestion notification), #54 (reminders)

**Edge Cases**: Batch mode (user offline → 50 notifications at once → group by type); notification overload (>100/day) → rate-limit: max 5 same-type per hour; user clears all → soft delete (keep for audit, don't show); web push permissions revoked → graceful fallback to in-app only.

  presented_at TEXT NOT NULL,
  decided_at TEXT
);
```

**Integration**: #5 (folder tree), #16 (sidebar highlights suggested folder), #47 (classification pipeline shared)

**Edge Cases**: No history → content-only mode; folder deleted after suggestion → retry; user always rejects → model cools off that folder; new workspace → cold start with content-only.



## 56. Location-Based Suggestions (#53)

**Priority**: P3  
**Dependencies**: #1 (Note Taking), #2 (Tag System)

**What**: When the user opens Knot at a known location (geofence), suggest relevant notes. Uses GPS/WiFi positioning on mobile, manual location tags on desktop. Location profile stores frequently visited places with associated tags and note patterns.

**Architecture**:
```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│ Location     │────►│ Location       │────►│ Suggestion       │
│ Provider     │     │ Matcher        │     │ Engine           │
│ (GPS/WiFi)   │     │ (geofence DB)  │     │ (tag + recency)  │
└──────────────┘     └────────────────┘     └──────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │ Notification     │
                                            │ Center           │
                                            └──────────────────┘
```

- **Privacy-first**: Location data stored locally only. No cloud sync of location history unless user opts in.
- **Geofence**: 100m radius circles. Trigger on enter, debounced (15min cooldown).
- **Suggestions**: "Notes tagged with 'cafe' near this location from last 30 days" → top 5 by recency × visit frequency.

**Data Model**:
```sql
CREATE TABLE location_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  tags TEXT NOT NULL DEFAULT '[]',  -- JSON array of tag names
  last_visited_at TEXT,
  visit_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_location_profiles_coords ON location_profiles(latitude, longitude);
```

**Integration Points**: #1 (suggestion banner at top of editor), #2 (tag-filtered suggestions)

**Edge Cases**: Location permissions denied (graceful fallback — no suggestions, no errors), GPS drift (hysteresis: 150m exit radius vs 100m enter radius), multiple overlapping geofences (show merged suggestions, deduplicated)

---

## 57. Task/Work Reminders (#54)

**Priority**: P3  
**Dependencies**: #1 (Note Taking)

**What**: Reminders tied to notes — time-based (absolute date, relative: "in 2 hours"), location-based (remind when at grocery store), and recurrence (daily, weekly, custom cron). Reminder notification via desktop push, mobile notification, or email.

**Architecture**:
```
Reminder Pipeline
  User creates reminder
       │
       ▼
  ┌──────────────┐     ┌──────────────────┐
  │ Reminder      │────►│ Scheduler        │
  │ Registry      │     │ (cron-like)      │
  └──────────────┘     └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Deliverer        │
                    │ (push / email)   │
                    └──────────────────┘
```

- **Scheduler**: In-memory timer wheel for active reminders (next 24h), persisted in `reminders` table. On restart, load all pending reminders into the wheel.
- **Recurrence**: Cron expression stored in `recurrence_rule`. Next occurrence computed from cron, stored in `next_remind_at` for efficient indexing.
- **Delivery**: Tries push (via browser Notification API or Tauri notification) first, falls back to email if push not available or if the app was closed at remind time.

**Data Model**:
```sql
CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES docs(id),
  type TEXT NOT NULL CHECK(type IN ('time', 'location', 'recurring')),
  remind_at TEXT,  -- ISO 8601, for time-based
  recurrence_rule TEXT,  -- cron expression, for recurring
  location_id TEXT REFERENCES location_profiles(id),  -- for location-based
  notified BOOLEAN NOT NULL DEFAULT 0,
  next_remind_at TEXT,  -- computed from recurrence_rule
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reminders_pending ON reminders(next_remind_at) WHERE notified = 0;
```

**Integration Points**: #1 (editor /remind command, clock badge on note), #5 (reminder badge propagates to parent in tree)

**Edge Cases**: Timezone changes (recompute next_remind_at on timezone change event), recurring reminder misses occurrence (missed flag, delivers on next check), reminder on deleted note (delete cascading), daylight saving time (cron handles via UTC storage, convert to local for display)



## 58. MCP Server + HTTP API for External AI Agents (#55)

**Priority**: P1  
**Dependencies**: Core Services (Auth, Notes, Tags)

**What**: A unified MCP (Model Context Protocol) server and HTTP REST API that exposes Knot's full feature surface to external AI agents — notes CRUD, semantic search, tags, AI features (chat, wiki, auto-tag, briefing), canvas graph, organization tools (classify, suggest_folder, find_links, duplicates), reminders, and system status. Both transports share the same port (:8767), differentiated by the `Content-Type` header (MCP over SSE vs JSON REST). The server is local-only by default; remote access requires API key authentication.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    External AI Agent                         │
└──────────────────┬──────────────────────────┬────────────────┘
                   │ MCP (stdio/SSE)          │ HTTP REST
                   ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                Knot MCP/HTTP Server (:8767)                  │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Request       │  │ Auth Middleware│  │ Rate Limiter    │  │
│  │ Router        │  │ (API key /    │  │ (100 req/min    │  │
│  │ (Content-Type │  │  local skip)  │  │  per key)       │  │
│  │  dispatch)    │  │               │  │                 │  │
│  └───────┬───────┘  └───────────────┘  └─────────────────┘  │
│          │                                                    │
│          ▼                                                    │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Service Layer                             │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐ │   │
│  │  │ Notes  │ │ Semantic │ │ Tags   │ │ AI Features  │ │   │
│  │  │ Service│ │ Search   │ │ Service│ │ (chat, wiki, │ │   │
│  │  │        │ │ Service  │ │        │ │  auto-tag)   │ │   │
│  │  └────────┘ └──────────┘ └────────┘ └──────────────┘ │   │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐ │   │
│  │  │ Canvas │ │Organiz.  │ │Reminder│ │ System       │ │   │
│  │  │ Graph  │ │Classify  │ │Service │ │ Status       │ │   │
│  │  └────────┘ └──────────┘ └────────┘ └──────────────┘ │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Request Routing**: Incoming connection on :8767 — if `Content-Type: application/json` and path starts with `/api/v1/`, route as REST; if `Upgrade: websocket` or SSE handshake, route as MCP; if stdio detected, route as MCP.
- **OpenAPI 3.0 spec** served at `GET /api/v1/openapi.json` — auto-generated from the service layer routes.
- **Rate Limiting**: Token bucket with 100 req/min per API key. Burst allowance of 20 requests. Exceeded returns `429 Too Many Requests` with `Retry-After` header.
- **Auth**: Local connections (127.0.0.1, Unix socket) skip auth. Remote connections require `X-API-Key` header validated against `api_keys` table.

**Data Model**:
```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,       -- bcrypt hash of the raw key
  permissions TEXT NOT NULL DEFAULT '["notes:read"]',  -- JSON array of permission scopes
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  expires_at TEXT,              -- nullable; NULL = never expires
  revoked BOOLEAN NOT NULL DEFAULT 0
);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked = 0;
```

**Integration Points**: All core services (notes, tags, AI, canvas, reminders, org), auth service, rate limiter middleware

**Edge Cases**: Port conflict on :8767 (fallback to :8768, log warning), API key rotation prompt on 401 (transparent retry for MCP stdio clients), concurrent SSE + REST on same connection (reject with 400), OpenAPI spec drift from implementation (auto-generate from route registry on every startup, cache until next route change)

---

## 59. Plugin Manifest & Loader (#56)

**Priority**: P1  
**Dependencies**: #55 (MCP Server), Filesystem Service

**What**: A plugin discovery and lifecycle system that scans `~/.knot/plugins/*/knot-plugin.json` for manifests, validates them against a JSON schema, and manages the full plugin lifecycle: installed → enabled → active → disabled → uninstalled. The loader supports hot-reload via filesystem watchers, dependency resolution with cycle detection, and graceful error handling that disables failing plugins without crashing the host.

**Architecture**:
```
┌───────────────────────────────────────────────────────┐
│                 Plugin Loader                          │
│                                                        │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ File Watcher  │───►│ Manifest     │                  │
│  │ (chokidar)    │    │ Validator    │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                             │                           │
│                             ▼                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Dependency Resolver                    │  │
│  │  (topological sort, cycle detection, version     │  │
│  │   constraint satisfaction)                       │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Lifecycle Manager                      │  │
│  │  installed → enabled → active → disabled → uninst │  │
│  │  State transitions with before/after hooks        │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

- **Manifest Schema**: Validated against `knot-plugin-schema.json`. Required fields: `id` (reverse-domain), `name`, `version` (semver), `min_knot_version`, `entry` (relative JS path), `permissions[]`, `hooks[]`, `dependencies{}`.
- **Hot Reload**: `chokidar` watches `~/.knot/plugins/*/knot-plugin.json` and `entry` files. On change: re-validate manifest, if valid → deactivate old, activate new. On delete: disable plugin.
- **Error Boundary**: Each plugin loads in a try/catch at manifest parse, entry eval, and hook invocation. Failure at any step → status = `error`, error message stored in `plugins.error`, user notified via notification center.

**Data Model**:
```sql
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,                           -- reverse-domain: com.example.myplugin
  manifest_json TEXT NOT NULL,                   -- full manifest as JSON blob
  status TEXT NOT NULL DEFAULT 'installed' CHECK(
    status IN ('installed','enabled','active','disabled','error','uninstalled')
  ),
  error TEXT,                                    -- last error message, NULL if clean
  loaded_at TEXT,                                -- last successful activation timestamp
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Integration Points**: #55 (MCP exposes plugin status via system tools), filesystem watcher service, notification center

**Edge Cases**: Circular dependency between plugins (detect at install time, reject with cycle path in error), manifest has `entry` pointing to missing file (set status=error, notify, do not crash host), version downgrade (block unless `--force` flag, prevent data corruption), plugin deletion while active (graceful deactivate → set disabled → then delete), multiple plugins with same id (last-installed wins, warn on conflict)

---

## 60. Extension Points (Hook System) (#57)

**Priority**: P1  
**Dependencies**: #56 (Plugin Manifest & Loader)

**What**: A comprehensive hook/event system that lets plugins intercept and extend Knot's behavior at every layer — lifecycle, data operations, AI processing, and UI. Hooks form a pipeline where each handler can skip, modify, or delegate to the next handler. An internal event bus supports pub/sub for cross-plugin and plugin-to-core communication.

**Architecture**:
```
┌────────────────────────────────────────────────────────────┐
│                    Hook Registry                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Lifecycle    │  │ Data Hooks   │  │ AI Hooks         │  │
│  │ on_activate  │  │ before_note  │  │ on_classify      │  │
│  │ on_deactivate│  │ _save        │  │ on_summarize     │  │
│  │ on_config    │  │ after_note   │  │ on_embed         │  │
│  │ _change      │  │ _delete      │  │ on_chat          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌────────────────────────────────────┐  │
│  │ UI Hooks     │  │ Event Bus                           │  │
│  │ register_cmd │  │ plugin.publish('note:created')      │  │
│  │ register_    │  │ plugin.subscribe('tag:deleted')     │  │
│  │ panel        │  │ channel-based, async delivery       │  │
│  └──────────────┘  └────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

Hook Pipeline:
  Before Hook A ──► Before Hook B ──► Core Op ──► After Hook B ──► After Hook A
       │                  │                         │                  │
       ▼                  ▼                         ▼                  ▼
   skip()?           modify()?                 modify()?          skip()?
   → next            → mutated                 → mutated          → done
                     data                      result
```

- **Hook Pipeline**: Each hook point registers handlers in priority order (lower number = higher priority). Handler receives context object and can call `skip()` (stop processing this handler group), `modify(field, value)` (mutate context for downstream), or `delegate()` (let next handler decide).
- **Event Bus**: In-process pub/sub with string channels (e.g. `note:created`, `tag:deleted`, `plugin:state_change`). Delivery is async via microtask queue. Events carry a payload object and metadata (source plugin id, timestamp).
- **Handler Indexing**: The `hooks` table maps plugin + hook name to an ordered index. Core queries `SELECT handler_index FROM hooks WHERE hook_name = ? ORDER BY handler_index` at hook point invocation time.

**Data Model**:
```sql
CREATE TABLE hook_points (
  id TEXT PRIMARY KEY,
  hook_name TEXT NOT NULL UNIQUE,         -- e.g. 'before_note_save'
  description TEXT,
  category TEXT NOT NULL CHECK(
    category IN ('lifecycle','data','ai','ui')
  )
);

CREATE TABLE hook_handlers (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  hook_name TEXT NOT NULL REFERENCES hook_points(hook_name),
  handler_index INTEGER NOT NULL DEFAULT 1000,  -- lower = higher priority
  handler_code TEXT NOT NULL,                   -- serialized function source
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(plugin_id, hook_name)
);
CREATE INDEX idx_hook_handlers_lookup ON hook_handlers(hook_name, handler_index);
```

**Integration Points**: #56 (plugged into lifecycle manager), #59 (sandbox evaluates handler_code), #62 (AI hooks), #64 (UI hooks)

**Edge Cases**: Infinite loop (plugin's before_save hook triggers another save — detect re-entrancy per plugin via recursion counter, cut at depth 3), handler throws exception (catch, log, skip that handler, continue pipeline with warning), dead plugin with registered hooks (skip all handlers from errored plugins at pipeline time), race condition on concurrent data hooks (serialize per-note via per-doc mutex)

---

## 61. Plugin Manager UI (#58)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #60 (Hook System)

**What**: A full-featured plugin management interface within Knot's settings/preferences pane. It provides a table view of all plugins with status indicators (installed/enabled/active/error), action buttons (enable/disable/uninstall/update), a detail panel showing manifest, permissions, hooks, and per-plugin config UI, an install flow (local file, URL, or store), and a dependency graph visualizer.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                    Plugin Manager UI                          │
│                                                               │
│  ┌─────────────────┐    ┌────────────────────────────────┐   │
│  │ Plugin List      │    │ Detail Panel                   │   │
│  │ ┌──────────────┐ │    │ ┌──────────────────────────┐  │   │
│  │ │ Name  Status  │ │    │ │ Manifest (rendered JSON) │  │   │
│  │ │ Foo   ● Active│ │    │ │ Permissions (badge list) │  │   │
│  │ │ Bar   ○ Disab │ │    │ │ Hooks (table)            │  │   │
│  │ │ Baz   ✕ Error │ │    │ │ Config UI (dynamic form) │  │   │
│  │ └──────────────┘ │    │ └──────────────────────────┘  │   │
│  │ [Enable] [Uninst] │    │ [Enable] [Disable] [Uninstall]│   │
│  └─────────────────┘    └────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Install Bar    [▼ Local File] [▼ URL] [▼ Store]        │   │
│  │ + Drop zone for .knot-plugin files                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Dependency Graph (D3.js force-directed)                 │   │
│  │   [Plugin A] ──► [Plugin B] ──► [Plugin C]             │   │
│  │        │                              │                 │   │
│  │        └──────► [Plugin D] ◄──────────┘                 │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- **List View**: Columns — name, version, status (colored dot + text), author. Sortable by any column. Filterable by status: all/active/disabled/error.
- **Detail Panel**: Opens on click. Tabs — Overview (manifest summary, description, version, author, homepage), Permissions (checklist of granted scopes), Hooks (which hook points the plugin registers, with handler_index), Config (auto-generated form from the plugin's `config_schema` in manifest, saved to plugin-local config), Error Log (timestamped error history).
- **Dependency Graph**: D3.js force-directed graph showing plugin → dependency edges. Color-coded by status (green=active, yellow=enabled, red=error, grey=disabled). Click a node to open that plugin's detail panel.

**Data Model**: Uses the `plugins` table from #56. Error log stored in a separate table:

```sql
CREATE TABLE plugin_error_logs (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context_json TEXT,    -- snapshot of state at error time
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_plugin_errors ON plugin_error_logs(plugin_id, occurred_at DESC);

CREATE TABLE plugin_configs (
  plugin_id TEXT PRIMARY KEY REFERENCES plugins(id) ON DELETE CASCADE,
  config_json TEXT NOT NULL DEFAULT '{}'
);
```

**Integration Points**: #56 (lifecycle actions: enable/disable/uninstall), #57 (hook listing), #60 (store install flow), #55 (plugin package download over HTTP)

**Edge Cases**: Plugin uninstall with active hooks (auto-remove all handlers, cascade delete from hook_handlers), corrupt manifest on install from URL (validate before saving, reject with parse error details, show in UI), dependency graph with >100 plugins (virtualized rendering, LOD — hide labels on zoom out, show only edges), plugin enables itself after being disabled by user (honor user's disabled status — add `user_disabled` flag in plugins table that overrides programmatic enable)

---

## 62. Plugin Sandbox (#59)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #60 (Hook System)

**What**: A JavaScript sandbox that executes plugin code in an isolated runtime (QuickJS or Boa engine) with configurable resource limits — 64MB memory cap, CPU time quota, network access control, and filesystem scoping. Permissions from the plugin manifest are enforced at the sandbox boundary. If the JS engine is unavailable, the system falls back to restricted mode where only data hooks can execute (no UI, no network, no filesystem).

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                    Plugin Sandbox                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              QuickJS / Boa Runtime                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ JS Interpreter│  │ Memory       │  │ CPU Watchdog │  │  │
│  │  │ (isolated     │  │ Monitor      │  │ (interrupt   │  │  │
│  │  │  globalThis)  │  │ (64MB cap)   │  │  after 5s)   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Capability Bridge                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Notes    │ │ Network  │ │ Filesys  │ │ Settings │  │  │
│  │  │ API      │ │ Filter   │ │ Scoper   │ │ Bridge   │  │  │
│  │  │ (read/   │ │ (allow-  │ │ (~/.knot/ │ │ (read/   │  │  │
│  │  │  write)  │ │  list)   │ │  plugins/ │ │  write)  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Fallback Path:                                               │
│  JS engine not available ↓                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Restricted Mode — same process, no isolation            │  │
│  │ Only data hooks allowed. No UI, no network, no FS.     │  │
│  │ Log warning to plugin error log.                        │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- **Memory Limit**: 64MB heap via `Q JS_SetMemoryLimit` (QuickJS) or runtime heap cap (Boa). Exceeded → sandbox throws `SandboxMemoryError`, plugin set to error state.
- **CPU Quota**: 5 seconds of JS execution per hook invocation. Implemented via platform interrupt timer (`setTimeout` polyfill replaced with interrupt). Exceeded → `SandboxCpuError`, plugin suspended for 30s cooldown.
- **Network Filter**: If manifest allows network, sandbox provides a wrapped `fetch()` that only connects to URLs on the plugin's allowed-origins list (`permissions.network.origins[]` in manifest). All other domains blocked with `NetworkBlockedError`.
- **Filesystem Scoping**: `fs` API exposed only within `~/.knot/plugins/<plugin_id>/` directory. Writes outside this path return `PermissionDenied`. Read-only access to Knot data directory controlled by `notes:read` permission.

**Data Model**:
```sql
CREATE TABLE sandbox_policies (
  plugin_id TEXT PRIMARY KEY REFERENCES plugins(id) ON DELETE CASCADE,
  mem_limit_mb INTEGER NOT NULL DEFAULT 64,
  cpu_quota_ms INTEGER NOT NULL DEFAULT 5000,
  net_allowed BOOLEAN NOT NULL DEFAULT 0,
  net_allowed_origins TEXT NOT NULL DEFAULT '[]',  -- JSON array of origin patterns
  fs_allowed BOOLEAN NOT NULL DEFAULT 0,
  fs_allowed_paths TEXT NOT NULL DEFAULT '[]',     -- JSON array of allowed path prefixes
  sandbox_version TEXT NOT NULL DEFAULT 'quickjs-2024-01-13',
  fallback_restricted BOOLEAN NOT NULL DEFAULT 0  -- 1 = currently in fallback mode
);
```

**Integration Points**: #56 (loader invokes sandbox for `entry` execution), #57 (sandbox evaluates `handler_code` for hooks), #64 (UI sandbox for iframe panels), #60 (network access for store installs)

**Edge Cases**: Plugin allocates memory in a tight loop (heap grows — memory monitor catches it at 64MB, throws, plugin disabled), 64MB not enough for legitimate plugin (configurable per-plugin via `mem_limit` in manifest, max 256MB), sandbox crash takes down host (impossible in QuickJS — separate context, but if Boa panics → catch the Rust panic boundary, log, disable plugin), network filter bypass via DNS rebinding (validate resolved IP against allowed origins, not just domain), fallback mode performance (data hooks only — no sandbox overhead, but no safety guarantees; log prominently to plugin error log)

---

## 63. Plugin Store / Marketplace (#60)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #58 (Plugin Manager UI)

**What**: A browsable plugin marketplace accessible from within Knot's Plugin Manager UI. The store indexes plugins from a community GitHub repository (`knot-plugins/index.json`) and individual GitHub releases. Users can browse by category, search, sort by downloads or rating, install with one click (download → validate → dependency check → confirm → install), and receive update notifications with one-click upgrade.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                   Plugin Store / Marketplace                  │
│                                                               │
│  ┌──────────────────────┐    ┌─────────────────────────────┐ │
│  │ Community Registry   │    │ GitHub Releases             │ │
│  │ knot-plugins/index   │    │ per-plugin release artifacts│ │
│  │ (JSON index on       │    │ (.knot-plugin packages)     │ │
│  │  github.com/knot-    │    │                             │ │
│  │  plugins/knot-       │    │                             │ │
│  │  plugins)            │    │                             │ │
│  └──────────┬───────────┘    └──────────────┬──────────────┘ │
│             │                                │                │
│             ▼                                ▼                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Store Service (cached & indexed)            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │  │ Search   │  │ Category │  │Download/ │  │Update  │ │ │
│  │  │ (FTS5)   │  │ Filter   │  │ Rating   │  │Checker │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │ │
│  └──────────────────────────┬──────────────────────────────┘ │
│                             │                                  │
│                             ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Install Pipeline                             │ │
│  │  Download → Validate Manifest → Check Dependencies →    │ │
│  │  Show Permissions → Confirm → Copy to plugins dir →     │ │
│  │  Activate                                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

- **Registry**: `github.com/knot-plugins/knot-plugins` hosts `index.json` containing every listing: id, name, description, author, version, category, downloads, rating, manifest_url, changelog_url. Updated via community PRs with CI validation.
- **Discovery**: Search uses FTS5 on the cached `store_cache` table. Categories include: AI, Import/Export, UI, Tools, Themes, Source Sync. Sort by relevance, downloads (all-time), downloads (weekly), rating, newly added.
- **Install Flow**: 6 steps — (1) Download `.knot-plugin` archive from GitHub release, (2) Validate manifest against schema + hash integrity check, (3) Resolve dependencies recursively (fail with missing dep list if any), (4) Show permission summary to user with accept/deny, (5) Extract to `~/.knot/plugins/<id>/`, (6) Activate via #56 loader.

**Data Model**:
```sql
CREATE TABLE store_cache (
  plugin_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  author TEXT,
  category TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating REAL NOT NULL DEFAULT 0.0 CHECK(rating >= 0 AND rating <= 5),
  manifest_url TEXT NOT NULL,
  changelog_url TEXT,
  source_url TEXT,
  license TEXT,
  tags TEXT NOT NULL DEFAULT '[]',       -- JSON array
  indexed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE VIRTUAL TABLE store_cache_fts USING fts5(
  name, description, tags, content='store_cache', content_rowid='rowid'
);
```

**Integration Points**: #56 (activate after install), #58 (UI for browse/install/update), #55 (HTTP download of packages), GitHub API (index fetch, release listing)

**Edge Cases**: Store index fetch fails (serve from last cached version, show "last updated X ago" banner, retry button), dependency has incompatible `min_knot_version` (block install, show version requirement chain), plugin package hash mismatch (reject install, log warning, suggest retry), malicious plugin submission (validation CI checks manifest permissions against actual code — heuristic, not guaranteed; add manual review queue for flagged submissions), update breaks existing data (store `last_good_version` in store_cache, offer rollback)

---

## 64. Source Plugin API (#61)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #57 (Hook System)

**What**: An API contract for source plugins that import data from external services into Knot. Each source plugin implements three primitives — `fetch()` to pull raw data from the external API, `transform()` to convert raw data into Knot notes/tags/canvas nodes, and `sync()` to manage incremental updates. Roadmap sources include Notion, Google Keep, Apple Notes, GitHub Issues, Confluence, Obsidian, Email, and Pocket. Sync modes support one-time import, periodic polling, and webhooks.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    Source Plugin Pipeline                     │
│                                                               │
│  Source (external)         Plugin                     Knot   │
│                                                               │
│  ┌──────────┐     ┌──────────────────┐     ┌──────────────┐ │
│  │ Notion   │────►│ fetch()          │────►│ Notes        │ │
│  │ API      │     │ (paginated HTTP, │     │ Service      │ │
│  └──────────┘     │  cursor/offset)  │     └──────────────┘ │
│                   │                  │                       │
│  ┌──────────┐     │ transform()      │     ┌──────────────┐ │
│  │ GitHub   │────►│ (raw → Note      │────►│ Tags         │ │
│  │ Issues   │     │  schema mapping) │     │ Service      │ │
│  └──────────┘     │                  │     └──────────────┘ │
│                   │ sync()           │                       │
│  ┌──────────┐     │ (cursor tracking,│     ┌──────────────┐ │
│  │ Obsidian │────►│  incremental)    │────►│ Canvas       │ │
│  │ Vault    │     └──────────────────┘     │ Graph        │ │
│  └──────────┘                               └──────────────┘ │
│                                                               │
│  Sync Scheduler:                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                 │
│  │ One-Time │   │ Periodic │   │ Webhook  │                 │
│  │ (manual) │   │ (cron)   │   │ (callback│                 │
│  │          │   │          │   │  URL)    │                 │
│  └──────────┘   └──────────┘   └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

- **fetch()**: Receives `{ cursor: string | null, config: object }`. Returns `{ items: RawItem[], next_cursor: string | null, has_more: bool }`. Plugin handles pagination internally (offset, cursor, or page-based). The framework manages retry with exponential backoff (3 attempts, 1s/4s/16s).
- **transform()**: Receives a `RawItem` and returns `{ title, content_md, tags, parent_id?, properties? }`. The framework handles deduplication by external ID (`source_item_id` in `source_syncs`). Conflicts resolved via LWW (last-writer-wins) with optional keep-both + diff mode.
- **sync()**: Framework manages cursor/checkpoint. Stores `last_cursor` and `last_sync_at` in `source_syncs`. Periodic sync uses a cron-like scheduler. Webhook sync receives a POST with the source's webhook payload, extracts the changed item IDs, and triggers incremental fetch.

**Data Model**:
```sql
CREATE TABLE source_syncs (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,             -- e.g. 'notion', 'github_issues'
  config_json TEXT NOT NULL DEFAULT '{}', -- auth tokens, workspace IDs, etc.
  last_cursor TEXT,                      -- opaque cursor from fetch()
  last_sync_at TEXT,                     -- ISO 8601
  status TEXT NOT NULL DEFAULT 'idle' CHECK(
    status IN ('idle','syncing','error','paused')
  ),
  error TEXT,
  sync_mode TEXT NOT NULL DEFAULT 'periodic' CHECK(
    sync_mode IN ('manual','periodic','webhook')
  ),
  cron_expression TEXT,                  -- for periodic mode, NULL if manual/webhook
  webhook_url TEXT,                      -- for webhook mode
  conflict_strategy TEXT NOT NULL DEFAULT 'lww' CHECK(
    conflict_strategy IN ('lww', 'keep_both')
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_source_syncs_status ON source_syncs(status);

CREATE TABLE source_sync_items (
  id TEXT PRIMARY KEY,
  sync_id TEXT NOT NULL REFERENCES source_syncs(id) ON DELETE CASCADE,
  source_item_id TEXT NOT NULL,          -- external ID from the source
  doc_id TEXT REFERENCES docs(id),       -- created Knot document ID
  last_modified TEXT NOT NULL,           -- from source system
  hash TEXT,                             -- content hash for change detection
  UNIQUE(sync_id, source_item_id)
);
```

**Integration Points**: #56 (plugin lifecycle manages start/stop of sync scheduler), #57 (after_note_import hook fires for each imported note), #1 (notes created by sync appear in the note tree), #55 (MCP tool to trigger manual sync)

**Edge Cases**: Source API rate limiting (exponential backoff + jitter, pause sync for that source's rate-limit window, log warning), webhook arrives before initial sync completes (queue webhook payload, process after initial sync finishes), user revokes OAuth token (set status=error, clear config, notify user to re-authorize), massive initial import (batch: 50 items per write, SSE progress update via #55, cancellable), conflict between two sources writing to same note (LWW: last sync time wins; keep_both: appends source suffix to title, creates both)

---

## 65. AI Provider Plugin (#62)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #57 (Hook System, AI hooks)

**What**: A plugin API for AI provider integrations that standardizes the interface for chat, embedding, and classification across different LLM backends. Built-in roadmap includes OpenAI, Anthropic Claude, Google Gemini, Groq, Together AI, vLLM, and llama.cpp. The system supports model routing by name, automatic fallback chains (Provider A fails → auto-failover to Provider B), and cost tracking with per-model token counting and estimate logging.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                    AI Provider Plugin System                   │
│                                                               │
│  Request (model name + payload)                               │
│       │                                                       │
│       ▼                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 Model Router                             │  │
│  │  Map: model_name → provider_id (from ai_providers)      │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            Fallback Chain                               │  │
│  │  Provider A (primary) → Provider B (fallback) →        │  │
│  │  Provider C (tertiary)                                 │  │
│  │  On error: log → increment retry → try next            │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              AI Provider Plugin                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐         │  │
│  │  │ chat()   │  │ embed()  │  │ classify()   │         │  │
│  │  │ (messages│  │ (text →  │  │ (text →      │         │  │
│  │  │  → text) │  │  vector) │  │  category)   │         │  │
│  │  └──────────┘  └──────────┘  └──────────────┘         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Cost Tracker:                                                │
│  Provider call → count tokens → lookup cost_per_1k →         │
│  accumulate in daily cost log → emit warning if > $5/day     │
└──────────────────────────────────────────────────────────────┘
```

- **Plugin Interface**: Each AI provider plugin exports `chat(messages, options) → { content, usage }`, `embed(input, options) → { vector, dimensions }`, and `classify(text, categories) → { category, confidence }`. Options include `model`, `temperature`, `max_tokens`, `stop`.
- **Model Routing**: The Model Router maintains a map of `model_name → [{ provider_id, priority }]`. On request, it queries the provider plugin at the highest priority that exposes the requested model. If that provider fails (network error, auth error, rate limit), the router tries the next provider in priority order.
- **Cost Tracking**: Each provider call returns `usage: { prompt_tokens, completion_tokens, total_tokens }`. The framework looks up `cost_per_1k_tokens` from `ai_providers`, computes cost, and logs to a daily cost aggregation table. Warning emitted to notification center if daily cost exceeds $5 threshold.

**Data Model**:
```sql
CREATE TABLE ai_providers (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,             -- e.g. 'openai', 'anthropic'
  model_names TEXT NOT NULL DEFAULT '[]',  -- JSON array of model names this provider handles
  priority INTEGER NOT NULL DEFAULT 100,   -- lower = tried first
  fallback_group TEXT,                     -- providers in same group form a fallback chain
  is_enabled BOOLEAN NOT NULL DEFAULT 1,
  config_json TEXT NOT NULL DEFAULT '{}',  -- API base URL, org ID, etc.
  cost_per_1k_tokens REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ai_providers_models ON ai_providers(model_names);

CREATE TABLE ai_cost_log (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES ai_providers(id),
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost REAL NOT NULL,
  date TEXT NOT NULL,                       -- YYYY-MM-DD for daily aggregation
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ai_cost_log_date ON ai_cost_log(date);
```

**Integration Points**: #57 (AI hooks: on_chat, on_embed, on_classify delegate to provider plugins), #55 (MCP exposes AI tools to external agents), #62 (cost data exposed in stats), AI service (Knot's built-in AI features use this plugin system internally)

**Edge Cases**: All providers in fallback group fail (throw aggregate error with list of individual errors, show "all AI providers unavailable" in UI, retry button), model name collision between providers (lower priority wins — primary provider for that model handles it; others shadowed, log warning), cost estimate explosion (cumulative daily cap: hard stop at $50/day configurable in settings, per-provider cap also configurable), token counting discrepancy between providers (framework normalizes via tiktoken for known models, uses provider's reported counts for unknown, flags >10% discrepancy), API key changes while plugin active (re-read config on each request with short-lived cache — 60s TTL)

---

## 66. Export Plugin API (#63)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #57 (Hook System)

**What**: An export plugin API that lets plugins convert Knot notes into external formats. Each plugin implements `export(note, options)` returning file bytes plus metadata (MIME type, filename). Roadmap targets include Notion API, Obsidian vault, Anki APKG, static site JSON/HTML, CSV, and JSON-LD. Supports batch export (list of notes with auto-bundling into archives) and progress reporting via SSE (Server-Sent Events).

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                    Export Plugin Pipeline                     │
│                                                               │
│  User selects notes + format                                  │
│       │                                                       │
│       ▼                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                Export Manager                           │  │
│  │  Routes to matching plugin by format                    │  │
│  │  Single: export(note, options) → file bytes             │  │
│  │  Batch: for each note → export() → bundle → zip/tar    │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │                                     │
│                         ▼                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Export Plugin                              │  │
│  │  ┌──────────────────┐    ┌──────────────────────────┐  │  │
│  │  │ export(note,     │    │ Metadata                 │  │  │
│  │  │  options)        │    │ { mime_type, filename,  │  │  │
│  │  │ → { bytes,       │    │   format_version }      │  │  │
│  │  │   metadata }     │    │                          │  │  │
│  │  └──────────────────┘    └──────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Progress (batch):                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │ Exporting 1/8 │───►│ Exporting 2/8│───►│ ... Done!    │   │
│  │ SSE: progress │    │ SSE: progress│    │ SSE: complete│   │
│  │  0.125        │    │  0.25        │    │  1.0         │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- **export()**: Receives a `Note` object (title, content_md, tags, properties, attachments, created_at, updated_at) and `options` (format-specific options dict). Returns `{ bytes: Uint8Array, metadata: { mime_type, filename, format_version } }`. The plugin handles all format conversion internally.
- **Batch Export**: Framework iterates over the note list, calling `export()` for each. If `batch_supported` flag is true in `export_plugins`, the plugin receives the full list and handles bundling (zip, tar, or single file). Otherwise the framework collects individual bytes and creates a zip.
- **SSE Progress**: For batch exports, the framework emits SSE events at `/api/v1/export/progress/:job_id` with `{ job_id, total, current, percent, current_note_title, status }`. The client connects via `EventSource` and closes on completion/error.

**Data Model**:
```sql
CREATE TABLE export_plugins (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  formats TEXT NOT NULL DEFAULT '[]',        -- JSON array of format strings, e.g. '["anki-apkg"]'
  batch_supported BOOLEAN NOT NULL DEFAULT 0,
  default_options TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_export_plugins_formats ON export_plugins(formats);

CREATE TABLE export_jobs (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id),
  format TEXT NOT NULL,
  note_ids TEXT NOT NULL,                    -- JSON array of note IDs
  status TEXT NOT NULL DEFAULT 'pending' CHECK(
    status IN ('pending','running','completed','failed','cancelled')
  ),
  progress REAL NOT NULL DEFAULT 0.0 CHECK(progress >= 0 AND progress <= 1),
  result_metadata TEXT,                      -- JSON: filename, size, mime_type
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
```

**Integration Points**: #56 (plugin lifecycle), #57 (after_note_export hook), #55 (MCP tool `export_note`, SSE progress endpoint), #1 (export command in editor context menu)

**Edge Cases**: Export produces file >100MB (stream to temp file, return a download URL instead of in-memory bytes), note contains unsupported content (skip unsupported blocks with warning list, continue export), batch of 10000 notes (chunk: process 50 at a time, yield to event loop every chunk, cancellable via job cancellation), concurrent export jobs (queue per plugin: serialize exports to same format, parallel for different formats), plugin not installed for requested format (return clear error with list of available formats and suggested store plugins)

---

## 67. UI Plugin API (#64)

**Priority**: P2  
**Dependencies**: #56 (Plugin Manifest & Loader), #57 (Hook System, UI hooks), #58 (Plugin Manager UI)

**What**: A UI plugin API that allows plugins to extend Knot's user interface — custom note types with schema + renderer (e.g. "Recipe" with ingredient fields), custom sidebar/docked panels (sandboxed iframe), custom editors (diagram, mind map, kanban, timeline), theme plugins via CSS variable overrides, command palette extensions with keyboard shortcuts, and context menu items on notes, tags, and canvas. UI plugins integrate with MCP via `plugin.<id>.<tool>` name prefixing and share lifecycle synchronization with other plugin types.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────┐
│                    UI Plugin API                              │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Custom Note Types                                    │   │
│  │  Schema (JSON) + Renderer (iframe sandbox)            │   │
│  │  "Recipe" → ingredients[], instructions, prep_time    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Sidebar      │  │ Custom       │  │ Theme Plugins    │  │
│  │ Panels       │  │ Editors      │  │ CSS variable     │  │
│  │ (docked      │  │ (diagram,    │  │ overrides        │  │
│  │  iframe)     │  │  mind map)   │  │ --primary-color  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Command Palette                                       │   │
│  │ plugin:my-plugin.do-something  [Ctrl+Shift+P]        │   │
│  │ plugin:other-plugin.export-csv                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Context Menus                                         │   │
│  │ Right-click note → "My Plugin: Analyze"               │   │
│  │ Right-click tag  → "My Plugin: Batch Tag"             │   │
│  │ Right-click canvas → "My Plugin: Layout"              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  MCP Integration: plugin.<id>.<tool> prefix                  │
│  Lifecycle: UI plugin activates → registers panels →         │
│  registers commands → on deactivate → unregisters all        │
└──────────────────────────────────────────────────────────────┘
```

- **Custom Note Types**: Plugin manifest declares `note_types: [{ type: "recipe", schema: { ingredients: { type: "array", items: "string" }, ... }, renderer: "recipe-renderer.html" }]`. Schema is JSON Schema draft-07. Renderer is an HTML file loaded in a sandboxed iframe with postMessage API for data binding.
- **Custom Panels**: Plugin registers a panel with `{ id, title, icon, position: "sidebar" | "docked", url: "panel.html", width }`. Panel content loads in a sandboxed iframe. Communication with Knot core via `window.parent.postMessage({ type, payload })` with a defined protocol (panel-ready, get-data, set-data, navigate, notify).
- **Custom Editors**: Registered for specific MIME types or note types. When a user opens a note of that type, instead of the default markdown editor, the custom editor iframe loads. Example: a diagram editor for `note_type: "diagram"`.
- **Themes**: Plugin provides `theme.css` with CSS variable overrides (`--affine-primary-color`, `--affine-background-color`, etc.). Applied dynamically. User can toggle between themes in settings.
- **Commands**: Registered via `register_command({ id, title, shortcut, handler })`. Shown in command palette (Ctrl+Shift+P) with `plugin:<id>.<title>` prefix. Shortcuts are registered with the platform and execute the handler on match.

**Data Model**:
```sql
CREATE TABLE ui_plugin_registrations (
  id TEXT PRIMARY KEY,
  plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
  registration_type TEXT NOT NULL CHECK(
    registration_type IN ('note_type','panel','editor','theme','command','context_menu')
  ),
  key TEXT NOT NULL,               -- command ID, note type name, panel ID, etc.
  config_json TEXT NOT NULL,       -- registration details (schema URL, shortcut, etc.)
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(plugin_id, registration_type, key)
);
CREATE INDEX idx_ui_registrations_type ON ui_plugin_registrations(registration_type);
```

**Integration Points**: #56 (lifecycle: auto-register on activate, cleanup on deactivate), #55 (MCP tools exposed under `plugin.<id>` namespace, inline with hook system), #57 (UI hooks: register_command, register_panel, register_editor_action use the hook system internally), #58 (plugin detail page shows registered UI components), #59 (iframes rendered in sandboxed context with postMessage bridge)

**Edge Cases**: Two plugins register the same command key (last-activated wins, warn on conflict in plugin log), plugin renders iframe that tries to `window.top.location` redirect (sandbox attribute `sandbox="allow-scripts allow-same-origin"` blocks navigation, log CSP violation), theme plugin conflicts with another theme (last-applied wins, user can toggle, no cascade), custom note type schema incompatible with existing notes of same type (validate on register, reject with schema diff, do not break existing notes), panel iframe crashes (detect via `messageerror` or heartbeat ping every 30s, show "panel crashed" placeholder with reload button), keyboard shortcut conflicts with built-in Knot shortcut (plugin shortcut takes precedence only if user confirms in prompt; stored in `shortcut_overrides` table), MCP tool name collision between plugins (use reverse-domain: `com.example.myplugin.tool_name`, MCP dispatcher strips prefix to plugin id, routes to correct plugin sandbox)

---


## 68. Space-Based Architecture & Sync Engine (#65)

**Priority**: P1  
**Dependencies**: #36 (CRDT Real-Time Collaboration), #55 (MCP Server + HTTP API)

**What**: A hub-and-spoke sync topology where each Space (subject, course, or project) acts as an independent synchronization unit. The central server stores the full workspace, and each child client syncs only the subset of spaces it has access to. Sync is bidirectional — REST pull for initial/periodic sync, WebSocket push for real-time changes. Change tracking uses an append-only `change_log` table with cursor-based pagination: the child sends its last known cursor, the central returns all changes after that cursor in batches of up to 500 records. The system is offline-first — each client maintains a local SQLite replica with queued changes; when connectivity resumes, the queue drains and upstream changes are merged. Consistency is eventual; payloads over 1 MB are gzip-compressed.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│                    Space Sync Architecture                         │
│                                                                   │
│  Central Server                    Child Client                   │
│  ┌──────────────────────┐         ┌──────────────────────────┐   │
│  │  Workspace DB         │         │  Local SQLite             │   │
│  │  ├── spaces           │         │  ├── spaces (subset)     │   │
│  │  ├── change_log       │         │  ├── change_log (local)  │   │
│  │  ├── notes / tags     │         │  ├── notes / tags        │   │
│  │  └── sync_cursors     │         │  └── pending_changes     │   │
│  └──────────┬───────────┘         └──────────┬───────────────┘   │
│             │                                 │                   │
│             │  REST: GET /sync/pull           │                   │
│             │  ?since_cursor=<n>              │                   │
│             │  ◄──── changes[500] ───────────►│                   │
│             │                                 │                   │
│             │  REST: POST /sync/push          │                   │
│             │  ◄──── local_changes ──────────►│                   │
│             │                                 │                   │
│             │  WS: /sync/stream               │                   │
│             │  ◄──── real-time events ───────►│                   │
│             │       (create, update, delete)   │                   │
│             │                                 │                   │
│  Space isolation:                             │                   │
│  ┌────────┐  ┌────────┐  ┌────────┐          │                   │
│  │ Math   │  │ Physics│  │ Chem   │  ...      │                   │
│  │ Space  │  │ Space  │  │ Space  │           │                   │
│  └────────┘  └────────┘  └────────┘           │                   │
│  Each space = independent sync unit            │                   │
└──────────────────────────────────────────────────────────────────┘
```

- **Sync Pull**: Child calls `GET /sync/pull?space_id=<id>&since_cursor=<cursor>`. Central queries `change_log WHERE space_id = ? AND id > ? ORDER BY id LIMIT 500`. Returns `{ changes: [...], next_cursor, has_more }`. Child applies changes to local SQLite in a transaction, updates `sync_cursors.last_cursor`.
- **Sync Push**: Child sends `POST /sync/push` with `{ space_id, changes: [{ entity_type, entity_id, operation, data_hash }] }`. Central validates permissions, inserts into `change_log`, broadcasts to other synced clients via WebSocket.
- **WebSocket Push**: When central receives a change (from sync push or direct edit), it publishes to `/sync/stream`. Connected clients receive a `{ event: "change", space_id, entity_type, entity_id, operation }` notification and fetch the full change on next pull.
- **Offline Queue**: When network is unavailable, local edits are written to the local `change_log` and flagged as pending. On reconnection, the child replays pending changes via sync push with idempotency keys (data_hash) to prevent duplicates.
- **Compression**: If the serialized change batch exceeds 1 MB (estimated by content-length), the response is gzip-compressed with `Content-Encoding: gzip`. The client checks the encoding header and decompresses automatically.

**Data Model**:
```sql
CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  schema_json TEXT NOT NULL DEFAULT '{}',       -- custom property schema for the space
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,         -- cursor value
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,                    -- e.g. 'note', 'tag', 'canvas_node'
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(
    operation IN ('create','update','delete')
  ),
  data_hash TEXT NOT NULL,                      -- SHA-256 of serialized data
  author_id TEXT NOT NULL,
  parent_id INTEGER REFERENCES change_log(id),  -- previous version for chain
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_change_log_space ON change_log(space_id, id);
CREATE INDEX idx_change_log_entity ON change_log(space_id, entity_type, entity_id);

CREATE TABLE sync_cursors (
  server_id TEXT NOT NULL,                       -- child's server identity
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  last_cursor INTEGER NOT NULL DEFAULT 0,
  last_sync_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (server_id, space_id)
);
```

**Integration Points**: #36 (CRDT conflict resolution feeds into change_log operations), #55 (MCP tools `sync.pull`, `sync.push`, `sync.status`), #66 (server identity used for author_id and sync_cursors.server_id), #67 (space permissions gate sync push/pull routes)

**Edge Cases**: Child syncs from stale cursor that central has pruned (central returns 410 Gone with current safe cursor, child must full-resync that space), two children simultaneously push changes to the same entity (LWW by timestamp, both entries logged, conflict flagged to #68), network drops mid-sync pull (client detects partial read via Content-Length mismatch, retries with same cursor — changes are idempotent), space deleted while child has pending changes (central returns 410 on push, child deletes local space copy, moves pending changes to quarantine log for manual review), batch of 500 changes exceeds 1 MB (triggers gzip, fallback to batch of 250 if still too large), cursor integer overflow after ~9 quintillion changes (unlikely but handled with change_log_id_is_text flag at init time, 40M+ entries expected before any concern)

---

## 69. Server Identity & Federation Auth (#66)

**Priority**: P1  
**Dependencies**: #65 (Space Sync — needs server identity for sync_cursors and author tracking)

**What**: A registration and authentication system for peer servers in the federation. When a child server first connects, it generates an Ed25519 key pair locally and sends the public key to the central server via `POST /fed/register`. The central validates the request, assigns a `server_id`, generates an API key, and stores the public key for future JWT verification. All subsequent API calls are authenticated with a short-lived JWT (1 hour TTL) carrying claims `{ server_id, space_ids[], role, exp }`. The JWT is signed by the child's Ed25519 private key and verified by the central using the stored public key. API keys are used only for JWT refresh — they can be rotated from the admin UI, and the old key is invalidated immediately. All federation actions are logged in `fed_audit_log` with server_id, timestamp, action, result, and IP address. Logs are retained for 90 days. Server online/offline status is tracked via `last_seen_at` — a heartbeat endpoint updates this every 5 minutes; servers not seen in 15 minutes are marked offline in the admin UI.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│                   Federation Auth Flow                             │
│                                                                   │
│  Child Server                         Central Server              │
│  ┌──────────────────────┐            ┌────────────────────────┐  │
│  │ 1. Generate           │            │                        │  │
│  │    Ed25519 key pair   │            │                        │  │
│  └──────────┬───────────┘            │                        │  │
│             │                        │                        │  │
│  ┌──────────▼───────────┐   POST     │  ┌──────────────────┐  │  │
│  │ 2. POST /fed/register│───────────►│  │ Validate pub key  │  │  │
│  │    { name, pub_key } │            │  │ → server_id       │  │  │
│  └──────────────────────┘            │  │ → api_key         │  │  │
│             │                        │  └──────────────────┘  │  │
│             │◄─── { server_id,       │                        │  │
│             │      api_key }         │                        │  │
│             │                        │                        │  │
│  ┌──────────▼───────────┐            │  ┌──────────────────┐  │  │
│  │ 3. Sign JWT with      │            │  │ Verify JWT with  │  │  │
│  │    private key        │───────────►│  │ stored public key│  │  │
│  │    Claims: server_id, │   API call │  │ Check: exp,      │  │  │
│  │    space_ids[], role  │  + JWT     │  │ space_ids, role  │  │  │
│  └──────────────────────┘            │  └──────────────────┘  │  │
│             │                        │                        │  │
│  ┌──────────▼───────────┐            │  ┌──────────────────┐  │  │
│  │ 4. JWT expired        │            │  │ POST /fed/refresh│  │  │
│  │    → POST /fed/refresh│───────────►│  │ verify api_key   │  │  │
│  │    { api_key }        │◄───────────│  │ → new JWT        │  │  │
│  │                       │   new JWT  │  └──────────────────┘  │  │
│  └──────────────────────┘            │                        │  │
│                                       │  Heartbeat:           │  │
│  ┌──────────▼───────────┐            │  POST /fed/heartbeat  │  │
│  │ 5. Every 5 min        │───────────►│  → update last_seen_at│  │
│  │    POST /fed/heartbeat│            │  → online status      │  │
│  └──────────────────────┘            └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

- **Registration**: Child generates Ed25519 key pair using libsodium or similar. Sends `{ name, public_key }` to `POST /fed/register`. Central validates key format, checks for duplicate name (warn if exists but allow registration if server is new), creates `fed_servers` row, generates a random 32-byte API key hashed with bcrypt, returns `{ server_id, api_key }`. Child stores server_id and api_key securely (OS keychain or encrypted config).
- **JWT Auth**: Child signs a JWT with its Ed25519 private key. Claims: `server_id` (assigned), `space_ids` (from sync_cursors), `role` (one of `owner`, `editor`, `viewer` per space), `exp` (1 hour from now). Central verifies the JWT using the stored public key. If verification fails (bad signature, expired), central returns 401. Child calls `POST /fed/refresh` with the API key to get a new JWT.
- **API Key Rotation**: Admin UI shows each server's API key (masked). "Rotate" button generates a new key, updates `api_key_hash`, returns it once (never stored in plaintext after that). Old key is immediately invalid — the next JWT refresh attempt with the old key fails.
- **Audit Logging**: Every federation action (register, refresh, heartbeat, API call) logs to `fed_audit_log`. Format: `{ server_id, action, result: "success"|"failure", ip_address, created_at }`. Retention: 90 days via nightly cleanup job (`DELETE FROM fed_audit_log WHERE created_at < datetime('now', '-90 days')`).
- **Heartbeat & Status**: Heartbeat `POST /fed/heartbeat` updates `last_seen_at`. Admin UI shows green dot for servers seen within 5 minutes, yellow within 15 minutes, red if >15 minutes. A periodic check (every minute) marks servers >15 minutes stale as offline.

**Data Model**:
```sql
CREATE TABLE fed_servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,                    -- Ed25519 public key (Base64)
  api_key_hash TEXT NOT NULL,                  -- bcrypt hash of API key
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT                            -- ISO 8601, updated by heartbeat
);
CREATE INDEX idx_fed_servers_active ON fed_servers(is_active);

CREATE TABLE fed_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id TEXT NOT NULL REFERENCES fed_servers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,                        -- 'register', 'refresh', 'heartbeat', 'api_call'
  result TEXT NOT NULL CHECK(
    result IN ('success','failure')
  ),
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_fed_audit_log_server ON fed_audit_log(server_id, created_at);
CREATE INDEX idx_fed_audit_log_cleanup ON fed_audit_log(created_at);
```

**Integration Points**: #65 (sync_cursors.server_id references fed_servers.id, sync requests authenticated via JWT), #67 (JWT space_ids claim gates access to spaces, role claim enforced on write operations), #55 (MCP tool `fed.status` for server health), admin UI (server list with online/offline status, API key rotation, audit log viewer)

**Edge Cases**: Server registration with duplicate name (allowed but logged as warning; admin UI shows duplicate warning with option to rename), Ed25519 key rotation on child (child re-registers as new identity, old server_id deactivated; central returns 409 if old key tries to auth, admin can transfer spaces from old to new server_id), API key compromised (admin rotates immediately, child gets 401 on next refresh, child shows "re-authorization required" prompt with one-click re-register), clock skew causes JWT to be rejected before 1h expiry (central allows 5 minute leeway in both directions for `nbf` and `exp`), audit log grows beyond 90-day retention (nightly cleanup deletes in batches of 1000 to avoid long-running transactions, runs at 03:00 UTC), server sends heartbeat with invalid JWT (log audit failure, do not update last_seen_at, do not mark offline — heartbeat failures do not affect online status to avoid cascading false-offline), admin mistakenly rotates key (no undo; must provide new key to child out-of-band — admin UI shows "copy this key now" with warning the key will never be shown again)

---

## 70. Selective Sync & Permissions (#67)

**Priority**: P1  
**Dependencies**: #65 (Space Sync), #66 (Server Identity & Federation Auth)

**What**: A role-based permission system that controls which servers can sync which spaces. Each space member is assigned a role — `owner` (full control, can manage members), `editor` (read/write sync), or `viewer` (read-only sync). Capability tokens are JWT claims scoped to specific `space_ids`; when a child requests sync, the central verifies that the JWT's `space_ids` include the requested space and that the `role` permits the operation. Access revocation is immediate: an admin removes or changes a member's role, the central updates `space_members`, and the next sync request from that server returns 403. If the server is connected via WebSocket, a `{ event: "access_revoked", space_id }` message is pushed to disconnect that space. Auto-discovery via `GET /fed/servers/me` returns the requesting server's assigned spaces and roles. Public spaces (`is_public: true`) are readable by any authenticated server without explicit membership. A space join flow allows servers to request access: `POST /spaces/:id/join` creates a `space_join_requests` entry, and the space owner receives a notification to approve or reject.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│                  Permission & Access Control                       │
│                                                                   │
│  API Request (with JWT)                                          │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Permission Gate                               │     │
│  │  1. Verify JWT signature (Ed25519)                        │     │
│  │  2. Extract server_id + space_ids[] + role from claims    │     │
│  │  3. Check space_members for this space+server             │     │
│  │  4. Enforce role-based operation limits                   │     │
│  └──────────────────────┬──────────────────────────────────┘     │
│                         │                                         │
│           ┌─────────────┴──────────────┐                          │
│           ▼                            ▼                           │
│  ┌──────────────────┐      ┌─────────────────────┐               │
│  │ Read Operation    │      │ Write Operation      │               │
│  │ Required: viewer  │      │ Required: editor     │               │
│  │ or higher         │      │ or owner             │               │
│  └──────────────────┘      └─────────────────────┘               │
│           │                            │                           │
│           ▼                            ▼                           │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Space Join Flow                               │     │
│  │                                                             │     │
│  │  Server A                          Server Owner             │     │
│  │  POST /spaces/:id/join            Notification:            │     │
│  │  → space_join_requests            "Server A wants access"  │     │
│  │       │                              │                     │     │
│  │       │◄────── WS: access_granted ───┤ Approve             │     │
│  │       │      or access_denied        │ or Reject           │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

- **Role Enforcement**: On every sync pull/push request, the Permission Gate checks `space_members` for the requesting server. If no row exists, the space is checked for `is_public`. If public, read is allowed (role = "viewer"), write is denied. If not public and no membership, return 403. Owner can manage members (add/remove/change roles), editor can sync push (create, update, delete), viewer can only sync pull (read).
- **Capability Tokens (JWT)**: When a server authenticates, the JWT includes `space_ids` — a subset of the server's assigned spaces. The sync API uses this to scope operations; a server cannot request a space not in its JWT even if it has a membership (the JWT acts as a capability). On membership change, the server must refresh its JWT (via API key) to get updated space_ids.
- **Access Revocation**: Admin removes a server from `space_members` or changes role from editor to viewer. On the next API request, the Permission Gate returns 403. If the server has an active WebSocket connection, central pushes `{ event: "access_revoked", space_id }`. The child receives this, removes the space from its local sync set, and optionally shows a notification.
- **Auto-Discovery**: `GET /fed/servers/me` with a valid JWT returns `{ server_id, spaces: [{ id, name, role, is_public }] }`. Used by the child on initial setup to discover which spaces it can sync without manual configuration.
- **Public Spaces**: Space creation/edit accepts `is_public` flag. When true, any authenticated server can pull changes read-only. The JWT still requires the space_id in its claims (added on JWT refresh). Public spaces are discoverable via auto-discovery.

**Data Model**:
```sql
CREATE TABLE space_members (
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL REFERENCES fed_servers(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(
    role IN ('owner','editor','viewer')
  ),
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  granted_by TEXT NOT NULL,                    -- server_id of granter
  PRIMARY KEY (space_id, server_id)
);

CREATE TABLE space_join_requests (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  server_id TEXT NOT NULL REFERENCES fed_servers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(
    status IN ('pending','approved','rejected','cancelled')
  ),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT REFERENCES fed_servers(id),
  UNIQUE(space_id, server_id)                  -- one pending request per pair
);
CREATE INDEX idx_join_requests_space ON space_join_requests(space_id, status);
```

**Integration Points**: #65 (sync pull/push gates call into space_members), #66 (JWT space_ids claim derived from space_members, JWT refresh updates claim), #55 (MCP tools `space.add_member`, `space.remove_member`, `space.list_members`, `space.join_request`), #32 (admin dashboard shows member list with role badges), #52 (WS notification on access_revoked and join request resolution)

**Edge Cases**: Server with editor role tries to delete a space (operation denied unless role is owner; return 403 with "only owners can delete spaces"), admin removes a server that is currently syncing (in-flight sync push completes successfully for already-authenticated batch, next pull/push gets 403; no rollback of completed batch — eventual consistency handles the divergence), two owners exist for a space (first owner who created the space is primary owner; they can promote another member to owner, demoting themselves is allowed only if at least one other owner exists), server requests join while already a member (return 409 Conflict with existing role; server can re-request if previous request was rejected after a cooling period of 7 days), public space with sensitive data accidentally made public (admin toggles is_public to false; all non-member servers currently syncing get access_revoked WS event, their local copy remains but further syncs blocked; admin can force-push a delete to all non-member servers if needed), child server clock is ahead causing JWT with future `iat` (central allows 5 min skew; if >5 min, return 401 with `x-clock-skew` header containing central's current time for the child to adjust)

---

## 71. Conflict Resolution & E2E Encryption (#68)

**Priority**: P2  
**Dependencies**: #65 (Space Sync — conflict detection during sync), #67 (Selective Sync & Permissions — E2E spaces restricted to editor+ roles)

**What**: A two-part system for handling data conflicts in multi-server sync and providing optional end-to-end encryption. Conflict resolution uses Last-Writer-Wins (LWW) based on the `created_at` timestamp from each server's clock, with both versions stored in a `conflicts` table and the losing version preserved for manual review. When the same entity is updated concurrently by two servers, the system auto-merges if the changes touch disjoint fields (union merge); if the same field is modified by both, the conflict is flagged and a diff view is available in the UI (side-by-side, "Keep A/B", "Edit merged", "Ignore"). E2E encryption is optional per-space: when enabled, content is encrypted with XChaCha20-Poly1305 (AEAD) using a key derived from a user-supplied passphrase via Argon2id. The central server acts as a relay — it stores the encrypted blob and cannot decrypt. The trade-off is that E2E encryption disables central-side full-text search, wiki synthesis, and cross-space AI features for that space.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│         Conflict Resolution & E2E Encryption                      │
│                                                                   │
│  Conflict Detection (during sync pull/push):                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Server A writes Note X at T1                            │    │
│  │  Server B writes Note X at T2 (same entity, same field)  │    │
│  │  ┌────────────┐          ┌────────────┐                  │    │
│  │  │ Version A  │          │ Version B  │                  │    │
│  │  │ (T1, hash) │          │ (T2, hash) │                  │    │
│  │  └─────┬──────┘          └─────┬──────┘                  │    │
│  │        │                      │                          │    │
│  │        └──────┬───────────────┘                          │    │
│  │               ▼                                           │    │
│  │        ┌──────────────────┐                              │    │
│  │        │ Conflict Detector │                              │    │
│  │        │ Compare fields   │                              │    │
│  │        │ Disjoint → union │                              │    │
│  │        │ Same field → flag│                              │    │
│  │        └──────────────────┘                              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  E2E Encryption (optional per-space):                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Client Side                          Central Server      │    │
│  │  ┌──────────────┐   encrypted blob   ┌────────────────┐  │    │
│  │  │ Author encrypts│─────────────────►│ Stores blob    │  │    │
│  │  │ XChaCha20     │   cannot decrypt  │ in notes table │  │    │
│  │  │ + Argon2id KDF│◄─────────────────│ Returns blob    │  │    │
│  │  │               │   encrypted blob  │ to authorized   │  │    │
│  │  └──────────────┘    for other       │ servers         │  │    │
│  │                       server          └────────────────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Trade-offs: E2E ON → no FTS, no AI, no cross-space features     │
└──────────────────────────────────────────────────────────────────┘
```

- **Conflict Detection**: During sync pull, the central detects that both Server A and Server B have modified the same entity since their last common cursor. Both versions are stored. If the JSON field-level diff shows no overlapping keys, an auto-merge is attempted: the union of both versions' fields is stored as the canonical version, and the conflict is marked `auto_mergeable = 1` and auto-resolved. If the same field is modified in both, the conflict is flagged — the later timestamp (LWW) is stored as the canonical version, the earlier is stored as the losing version in `conflicts`.
- **Conflict Review UI**: A dedicated conflict review panel accessible from the space settings or notification. Each conflict shows: entity title, version A metadata (server name, timestamp), version B metadata, side-by-side diff with highlighted differences. Actions: "Keep A" (promote A to canonical), "Keep B" (promote B), "Edit merged" (opens a three-pane editor: A | merged | B), "Ignore" (mark resolved without changing canonical). Resolved conflicts are recorded with `resolution` field.
- **E2E Encryption Setup**: Space owner enables E2E by providing a passphrase. The client derives a 256-bit key using Argon2id (memory 64 MB, iterations 3, parallelism 4), generates a random 192-bit salt, and encrypts the key with the passphrase. The salt and encrypted key checksum (`SHA-256(encrypted_key)`) are stored in `space_encryption`. The actual key never leaves the client. Each note is encrypted with XChaCha20-Poly1305 using a per-note random nonce (192-bit). The nonce is prepended to the ciphertext.
- **Central Relay**: For E2E spaces, the central server stores the full encrypted blob in the notes table. It cannot decrypt — no key material is stored server-side. Sync works normally: the blob is synced to other authorized servers, which decrypt locally. FTS indexing skips E2E spaces. AI features (semantic search, wiki synthesis, agentic chat) do not process E2E content.
- **Key Rotation**: Owner can change the passphrase. The client decrypts all notes with the old key (requires all notes to be synced locally), re-encrypts with the new key, and pushes the updated blobs. During rotation, notes are locked (sync pull returns ciphertext, decrypt on client may fail until rotation completes).

**Data Model**:
```sql
CREATE TABLE conflicts (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  version_a_id INTEGER NOT NULL REFERENCES change_log(id),
  version_b_id INTEGER NOT NULL REFERENCES change_log(id),
  auto_mergeable BOOLEAN NOT NULL DEFAULT 0,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved BOOLEAN NOT NULL DEFAULT 0,
  resolution TEXT CHECK(                          -- null if not resolved
    resolution IN ('keep_a','keep_b','edit_merged','ignore')
  ),
  resolved_at TEXT,
  resolved_by TEXT REFERENCES fed_servers(id)
);
CREATE INDEX idx_conflicts_space ON conflicts(space_id, resolved);
CREATE INDEX idx_conflicts_entity ON conflicts(space_id, entity_id);

CREATE TABLE space_encryption (
  space_id TEXT PRIMARY KEY REFERENCES spaces(id) ON DELETE CASCADE,
  algorithm TEXT NOT NULL DEFAULT 'xchacha20-poly1305',
  salt TEXT NOT NULL,                              -- Base64, 192-bit salt
  encrypted_key_checksum TEXT NOT NULL,            -- SHA-256 for key verification
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  key_rotated_at TEXT                              -- last key rotation
);
```

**Integration Points**: #65 (change_log entries trigger conflict detection during sync processing), #55 (MCP tools `conflicts.list`, `conflicts.resolve`, `space.enable_e2e`, `space.rotate_key`), #70 (conflict review UI, notification on new conflicts), #1 (E2E notes display "Encrypted" badge with lock icon, content blurred until decrypted), #3 (FTS skips E2E spaces, search results marked "not searchable" with explanatory tooltip)

**Edge Cases**: Both servers write the exact same content at different timestamps (compare data_hash — if hashes match, no conflict is created; change_log records both entries but conflict detection skips identical content), clock skew causes LWW to pick the wrong version as winner (central stores both versions so manual override is always possible; admin can adjust resolution in review UI), E2E passphrase is forgotten (zero recoverable — space data is permanently lost; export warning: "Export E2E space" produces encrypted files that can only be decrypted with the passphrase; backup the passphrase in system keychain with prompt on first setup), E2E space with 10000 notes during key rotation (batch decryption/re-encryption: process 50 notes per batch, SSE progress, cancellable, resume from last processed note_id), conflict resolution for a deleted entity (entity was deleted by Server A but updated by Server B before the delete synced — LWW on delete wins; the update version is stored as a conflict with resolution "ignored" and the delete stands, but the updated content is available for manual re-creation)

---

## 72. Export Engine System (#69)

**Priority**: P2  
**Dependencies**: #20 (Export — basic PDF/DOCX), #63 (Export Plugin API), #55 (MCP Server + HTTP API)

**What**: A comprehensive export engine that extends the basic export system with multi-format rendering, a template system, and API-first design. Formats include PPTX (via python-pptx/Presenton), DOCX (via python-docx), PDF (via WeasyPrint/Playwright for HTML→PDF), and images (PNG/JPEG/WebP via Playwright screenshots and Pillow processing), plus SVG vector export. The template system allows users to upload existing documents (PPTX, DOCX) as templates — the AI parses the structure to extract placeholders (e.g. `{{ title }}`, `{{ content }}`, `{{ author }}`) and brand theme elements (colors, fonts, logos). The export pipeline transforms Note Markdown into an intermediate AST, then each format-specific renderer converts the AST to the target format. The API exposes MCP tools (`export.render`, `export.list_templates`, `export.upload_template`, `export.batch`) and HTTP endpoints for programmatic access. Batch export supports multiple notes into a single PPTX/DOCX (one slide/page per note) or a ZIP bundle. External webhook callbacks notify on completion, and long-running jobs report progress via SSE with a `job_id`.

**Architecture**:
```
┌──────────────────────────────────────────────────────────────────┐
│                      Export Engine Pipeline                        │
│                                                                   │
│  User Action              Pipeline                        Output  │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ Export    │───►│ Markdown → AST   │───►│ PPTX Renderer    │──►│
│  │ Note(s)  │    │ (intermediate     │    │ (python-pptx)    │   │
│  └──────────┘    │  representation) │    └──────────────────┘   │
│                  └──────────────────┘                            │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ Template │───►│ AST + Template   │───►│ DOCX Renderer    │──►│
│  │ Upload   │    │ placeholder      │    │ (python-docx)    │   │
│  └──────────┘    │ substitution     │    └──────────────────┘   │
│                  └──────────────────┘                            │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ Batch    │───►│ Multi-note AST   │───►│ PDF Renderer     │──►│
│  │ (N notes)│    │ → one doc bundle │    │ (WeasyPrint /     │   │
│  └──────────┘    └──────────────────┘    │  Playwright)      │   │
│                                          └──────────────────┘   │
│  ┌──────────┐                           ┌──────────────────┐   │
│  │ Job Queue│                           │ Image Renderer   │──►│
│  │ job_id + │──────────────────────────►│ (Playwright +     │   │
│  │ SSE      │                           │  Pillow)          │   │
│  └──────────┘                           └──────────────────┘   │
│                                                                   │
│  Webhook Callback: POST <url> { job_id, status, download_url }   │
└──────────────────────────────────────────────────────────────────┘
```

- **Pipeline**: Each export goes through three stages: (1) **Parse** — Note Markdown is parsed into an intermediate AST with blocks (heading, paragraph, list, code, image, table, quote, callout, divider); (2) **Transform** — If a template is specified, the AST is merged with template placeholders; brand theme (colors, fonts, logo) is applied as metadata; (3) **Render** — The format-specific renderer converts the enriched AST to output bytes. Renderers are isolated processes to prevent memory leaks from large exports.
- **Template System**: User uploads a PPTX or DOCX file via `export.upload_template`. The AI analyzer opens the file, extracts text runs, identifies recurring patterns (e.g. `{{ title }}` in a slide title, `{{ content }}` in a text box), and generates a placeholder schema stored as JSON. Brand theme extraction reads theme colors, fonts (major/minor), and slide layouts from the PPTX XML; from DOCX, it reads styles, fonts, and headers/footers. The user can edit the placeholder schema in the admin UI.
- **Batch Export**: `export.batch({ note_ids, format, template_id?, bundle: "single" | "zip" })`. For `bundle: "single"`, multiple notes are combined into one document — PPTX gets one slide per note, DOCX gets a section break between notes. For `bundle: "zip"`, each note is exported individually and collected into a ZIP file. Progress is reported via SSE at `/api/v1/export/progress/:job_id`.
- **Job Management**: Each export creates an `export_jobs` row. The job runs asynchronously in a background worker pool (max 3 concurrent). Status transitions: `pending → running → completed | failed`. On completion, the result file path is stored in `result_file`. If a `webhook_url` was provided, a POST with the job result is sent. Thumbnails for images are generated at export time (256x256, stored alongside the full-resolution output).

**Data Model**:
```sql
CREATE TABLE export_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK(
    format IN ('pptx','docx')
  ),
  source_file TEXT NOT NULL,                     -- path to uploaded template file
  placeholder_schema_json TEXT NOT NULL DEFAULT '{}',  -- AI-extracted placeholders
  brand_theme_json TEXT NOT NULL DEFAULT '{}',   -- colors, fonts, logo references
  thumbnail_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_export_templates_format ON export_templates(format);

CREATE TABLE export_jobs (
  id TEXT PRIMARY KEY,
  format TEXT NOT NULL,                          -- 'pptx','docx','pdf','png','jpeg','webp','svg'
  note_ids TEXT NOT NULL,                        -- JSON array of note IDs
  template_id TEXT REFERENCES export_templates(id),
  bundle TEXT NOT NULL DEFAULT 'single' CHECK(
    bundle IN ('single','zip')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(
    status IN ('pending','running','completed','failed','cancelled')
  ),
  progress REAL NOT NULL DEFAULT 0.0 CHECK(progress >= 0 AND progress <= 1),
  result_file TEXT,                              -- path to output file
  result_size INTEGER,                           -- file size in bytes
  error TEXT,
  webhook_url TEXT,                              -- callback URL
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_export_jobs_created ON export_jobs(created_at);
```

**Integration Points**: #20 (basic export formats PDF/DOCX are consolidated into this engine as the PPTX/DOCX renderers), #63 (Export Plugin API — custom format plugins can register additional renderers in the pipeline), #55 (MCP tools `export.render`, `export.list_templates`, `export.upload_template`, `export.batch` with SSE progress), #65 (export respects space boundaries — only exports notes from spaces the user has access to), #70 (public spaces allow export by viewers, private spaces require editor+ role for export)

**Edge Cases**: Export of 500 notes as single PPTX (file exceeds 500 MB — chunk: process 50 notes, save partial PPTX, concatenate via python-pptx low-level XML merge; fallback to ZIP bundle with warning), uploaded template has broken internal references (AI analyzer attempts repair with warnings; if unrecoverable, reject template with list of broken references and their locations in the file), placeholder `{{ content }}` contains markdown that the template's text box cannot render (strip to plain text for single-run placeholders; for multi-run placeholders, apply basic formatting — bold, italic — via XML manipulation), concurrent export jobs for the same format exhaust worker pool (queue: max 3 concurrent per format, additional jobs wait in pending status; user sees queue position in SSE progress), webfont used in template not available during PDF render (fallback to system fonts with warning in job log; template declares fonts in brand_theme_json for pre-install), user navigates away from export progress page (SSE connection closes, job continues server-side; progress can be re-fetched via GET `/api/v1/export/jobs/:job_id` or recalled from notification on completion), image export of a note with large embedded base64 data (strip inline images >5 MB, render as placeholder with note "image excluded due to size", include image filename for reference)

---

