# Knot

> **A local-first knowledge graph app** — self-organizing notes with semantic search, wiki synthesis, and agentic chat.

Inspired by [Atomic.app](https://atomic.fyi). Temporary name while we find a better one.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Next.js 14 (App Router), TypeScript |
| Editor | TipTap (ProseMirror-based) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Vector Search | sqlite-vec (FTS5 + vector cosine similarity) |
| AI | Ollama / OpenRouter / OpenAI for embeddings + LLM |
| Graph | D3.js force-directed layout |

## Quick Links

| Document | Description |
|----------|-------------|
| [Features Overview](docs/features.md) | All 12 features across Core, AI, and Integration groups |
| [Frontend Architecture](docs/frontend-architecture.md) | Routes, layout zones, component tree, keyboard shortcuts |
| [AI Features Architecture](docs/ai-features-architecture.md) | Detailed UX specs for all AI features |
| [Platform Decision](docs/platform-decision.md) | Why Next.js + SQLite, architecture diagram, key decisions |
| [Roadmap](docs/roadmap.md) | 5-phase implementation plan (10 weeks) |

## Repo Structure

```
knot/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (main)/             # Authenticated layout group
│   │   │   ├── dashboard/      #  /
│   │   │   ├── notes/          #  /notes, /notes/new, /notes/:id
│   │   │   ├── tags/           #  /tags, /tags/:id
│   │   │   ├── search/         #  /search
│   │   │   ├── canvas/         #  /canvas
│   │   │   ├── wiki/           #  /wiki/:tagId
│   │   │   ├── rss/            #  /rss
│   │   │   └── settings/       #  /settings
│   │   └── api/                # API routes
│   ├── components/             # React components (by domain)
│   │   ├── ui/                 # Primitive UI (shadcn)
│   │   ├── layout/             # AppShell, Sidebar, RightPanel, StatusBar
│   │   ├── editor/             # EditorShell, Toolbar, Editor, TagBar
│   │   ├── search/             # SearchOverlay, ResultCard, FilterBar
│   │   ├── canvas/             # GraphCanvas, NoteNode, EdgeLine
│   │   ├── chat/               # ChatPanel, MessageBubble, CitationCard
│   │   ├── wiki/               # WikiArticle, CitationPopover, TOC
│   │   ├── briefing/           # BriefingWidget, BriefCard, GraphSnapshot
│   │   └── settings/           # Settings forms
│   ├── lib/                    # Utilities, hooks, constants
│   │   ├── db/                 # SQLite schema, queries, migrations
│   │   ├── ai/                 # LLM clients, embedding pipeline, prompts
│   │   ├── search/             # Hybrid search (BM25 + vector + RRF)
│   │   ├── graph/              # D3 force layout helpers
│   │   └── mcp/                # MCP server implementation
│   └── styles/                 # Global CSS
├── docs/                       # Documentation (see above)
├── drizzle/                    # Drizzle migration files
├── public/                     # Static assets
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Getting Started

```bash
# Clone & install
cd knot
npm install

# Environment
cp .env.example .env.local
# Set AI provider keys (Ollama / OpenRouter / OpenAI)

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app creates an empty workspace on first run.
