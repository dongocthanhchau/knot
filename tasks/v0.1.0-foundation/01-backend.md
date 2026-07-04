# v0.1.0 Foundation — Backend Tasks

## Mục tiêu
Thiết lập toàn bộ hạ tầng backend cho knot: project scaffold, database schema, auth, CI.

## Tech Stack
- Next.js 14+ (App Router)
- SQLite via better-sqlite3
- Drizzle ORM
- Lucia Auth (local passphrase)
- TypeScript strict mode

## Tasks

### 1.1 Project Scaffold
- `npx create-next-app@latest knot --typescript --tailwind --eslint`
- Install: drizzle-orm, better-sqlite3, drizzle-kit, lucia, oslo, @types/better-sqlite3
- Config: tsconfig strict, path aliases (@/ -> src/)
- Folder structure:
```
src/
├── app/          (Next.js App Router)
├── components/   (shared UI)
├── db/           (Drizzle schema + client)
├── lib/          (utils, auth helpers)
├── server/       (server actions)
└── styles/       (global CSS)
```

### 1.2 Database Schema (Drizzle)
Create `src/db/schema.ts` with ALL V1 tables:

#### notes
- id: text primary key (uuid)
- title: text not null
- content: text (TipTap JSON)
- parent_id: text (nullable, self-ref for hierarchy)
- is_deleted: integer default 0
- created_at: text (ISO8601)
- updated_at: text (ISO8601)

#### tags
- id: text primary key (uuid)
- name: text not null unique
- color: text default '#6b7280'
- parent_id: text nullable

#### note_tags
- note_id: text references notes.id
- tag_id: text references tags.id
- PRIMARY KEY (note_id, tag_id)

#### note_versions
- id: text primary key (uuid)
- note_id: text references notes.id
- content: text (snapshot)
- created_at: text

#### templates
- id: text primary key (uuid)
- name: text not null
- content: text not null
- category: text default 'general'
- created_at: text

#### note_links
- id: text primary key (uuid)
- source_note_id: text references notes.id
- target_note_id: text references notes.id
- link_type: text default 'reference'
- created_at: text

#### graph_layouts
- id: text primary key (uuid)
- name: text not null
- node_positions: text (JSON)
- created_at: text

#### settings
- key: text primary key
- value: text

### 1.3 Drizzle Config
- `drizzle.config.ts` pointing to src/db
- `src/db/index.ts` — SQLite client + drizzle instance
- `src/db/migrate.ts` — migration runner
- Package.json scripts:
  - `db:generate` → drizzle-kit generate
  - `db:migrate` → tsx src/db/migrate.ts
  - `db:studio` → drizzle-kit studio

### 1.4 Auth (Lucia)
- `src/lib/auth.ts` — Lucia config with better-sqlite3 adapter
- Session table in schema
- Server actions: signIn, signOut, getSession
- `src/app/login/page.tsx` — simple passphrase form (placeholder UI)
- Protect routes via middleware

### 1.5 CI / Code Quality
- `.vscode/settings.json` — format on save, organize imports
- ESLint config (from Next.js)
- Prettier config (optional)

## Acceptance Criteria
- npm run dev starts without errors
- npm run db:generate creates SQL files
- npm run db:migrate creates working SQLite DB
- Login page renders, auth flow works end-to-end
- All schema tables present in DB
