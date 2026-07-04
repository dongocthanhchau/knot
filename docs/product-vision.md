# Knot — Product Vision

## Product Name & Tagline

**Name**: Knot  
**Tagline**: "Your knowledge, connected."

---

## Vision Statement

Make notes visually connected, not siloed. Knot turns your knowledge base into an interactive graph — every note is a node, every link is an edge, and every connection has weight. The result: you see not just what you know, but how it fits together.

Knot is a desktop PKM app built with Tauri + Next.js + SQLite, targeting students, researchers, and knowledge workers. V1 ships a Visual Knowledge Foundation in 8 weeks, with 21 features from a total design of 69 features and 7,756 lines of architecture documentation.

---

## Target Personas

### Persona 1 — The Student (Minh, 21)

- **Needs**: Organize course materials across semesters, connect concepts, generate study guides
- **Pain**: Notes scattered across folders, can't see how topics relate, exam prep is manual
- **How Knot helps**: Hierarchy tree for course structure, spatial canvas for concept relationships, auto mind map for study guides

### Persona 2 — The Researcher (Linh, 34)

- **Needs**: Literature collection, idea linking, citation tracking, paper outlines
- **Pain**: Zotero for refs, Obsidian for notes, Notion for projects — fragmented workflow
- **How Knot helps**: Every note is a node in a knowledge graph, connection strength surfaces related work, context graph shows local network

### Persona 3 — The Knowledge Worker (Chad, 40)

- **Needs**: Daily notes, project docs, cross-project reference, AI-assisted discovery
- **Pain**: Information overload, notes buried in deep folders, weak recall
- **How Knot helps**: Visual graph reveals hidden connections, hybrid search finds anything fast, focus mode for deep work

---

## Core Loop

```
                     ┌─────────────────┐
                     │   CREATE note    │
                     │  (TipTap editor) │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  ORGANIZE with   │
                     │  tags + hierarchy │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  VISUALIZE on    │
                     │  spatial canvas  │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  NAVIGATE via    │
                     │  context graph   │
                     └────────┬────────┘
                              │
                              └──→ back to CREATE
```

---

## V1 Feature Scope — 'Visual Knowledge Foundation'

| Sprint | Weeks | Theme | Features |
|--------|-------|-------|----------|
| 1-2 | 1-2 | Core Engine | #1 Note Taking, #2 Tag System, #3 Semantic Search (basic), #43 Focus Mode, #32 Dashboard |
| 3-4 | 3-4 | Navigation | #5 Hierarchical Nested Docs, #16 Doc Hierarchy Tree, #6 Block References, #15 Doc Context Graph, #8 Versioning, #19 Template System |
| 5-6 | 5-6 | Canvas | #4 Spatial Canvas, #18 Connection Strength, #14 Node Map Editor, #9 Drawing Canvas, #10 Multi-View DB |
| 7-8 | 7-8 | Ship | #12 Auto Mind Map, #13 Tree Map, #17 Drill-Down Graph, #11 Slides, #20 Export, #7 Clone Notes |

**Post-V1**: AI Features (#21-#29), AI Auto-Organization (#47-#54), Plugin System (#55-#64), Fediverse (#65-#68), Integration features (#30-#46), Export Engine (#69)

---

## Success Metrics for V1

| Metric | Target |
|--------|--------|
| Adoption | 100 active users in first month |
| Engagement | 5 notes/day per active user |
| Retention | 40% Day-30 retention |
| Performance | App cold start <2s, graph render <1s for 500 nodes |
| NPS | >30 from early users |

---

## Competitive Positioning

| Dimension | Knot | Obsidian | Notion | Logseq |
|-----------|------|----------|--------|--------|
| Visual graph | ★★★★★ Native | ★★★ Plugin | ★★ Embeds | ★★★ Block view |
| Connection weight | ★★★★★ Built-in | ★ Plugin | ✗ | ✗ |
| Graph types | ★★★★★ 7 types | ★ 1 type | ★ Embeds | ★ Block graph |
| Note editing | ★★★★ Rich | ★★★ Markdown | ★★★★★ Blocks | ★★★ Outliner |
| AI integration | ★★★★★ Built-in | ★★★ Plugin | ★★★★ Built-in | ★ Plugin |
| Offline-first | ★★★★★ Yes | ★★★★★ Yes | ★★ Partial | ★★★★★ Yes |
| Open source | ★★★★★ Yes | ★★ Closed core | ✗ | ★★★★★ Yes |

---

## Risks & Mitigations

- **Risk**: Graph features too complex for non-technical users.  
  **Mitigation**: Progressive disclosure — basic mode shows simple graph, advanced settings unlock ELK, weighting, etc.
- **Risk**: AI dependency (Ollama) creates support burden.  
  **Mitigation**: All AI features have graceful degradation fallbacks. No AI = usable app.
- **Risk**: 8-week timeline too aggressive.  
  **Mitigation**: Sprint 1-4 (Weeks 1-4) is the hard cut for "useful note-taker". Canvas features can slip to V1.1.
- **Risk**: Electron/Tauri performance with large graphs.  
  **Mitigation**: Virtual rendering, 500-node cap with lazy expansion, WebGL rendering path for >1000 nodes.
- **Risk**: Single developer burnout.  
  **Mitigation**: Strict scope control. Post-V1 features explicitly deferred.

---

## Excluded from V1 (48 features)

- **AI Features (#21-#29)** — deferred to V2. Adding intelligence after foundation is stable.
- **AI Auto-Organization (#47-#54)** — deferred to V2. Requires AI infra first.
- **Integration features (#30-#46 except #32, #43)** — deferred. Import/export bridges after core is proven.
- **Plugin System (#55-#64)** — deferred to V3. Platform play after product-market fit.
- **Fediverse (#65-#68)** — deferred to V4+. Network effects require user base.
- **Export Engine (#69)** — deferred to V2. Basic export (#20) is enough for V1.
- **CRDT Collaboration (#36), Scripting API (#35), Kanban (#37)** — deferred.
