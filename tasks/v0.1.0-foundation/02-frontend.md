# v0.1.0 Foundation — Frontend Tasks

## Mục tiêu
Thiết lập UI foundation: AppShell layout, routing, theme, Tauri integration.

## Tech Stack
- Next.js 14+ (App Router)
- TailwindCSS
- shadcn/ui
- Lucide icons
- next-themes (dark mode)

## Tasks

### 2.1 shadcn/ui Setup
- Init shadcn with: Button, Input, Dialog, DropdownMenu, Sheet, Tooltip, Separator, Avatar, Skeleton
- Custom theme colors matching knot brand (neural/purple tones)
- `src/components/ui/` — generated components

### 2.2 AppShell Layout
- `src/components/layout/app-shell.tsx` — main app wrapper
- `src/components/layout/sidebar.tsx` — left sidebar (collapsible, 240px → 64px)
- `src/components/layout/header.tsx` — top bar with breadcrumb + actions
- `src/components/layout/main-content.tsx` — content area wrapper
- Responsive: sidebar collapses on small screens

### 2.3 Routing
- `src/app/(app)/layout.tsx` — AppShell wrapper for authenticated routes
- `src/app/(app)/page.tsx` — Dashboard (placeholder)
- `src/app/(app)/notes/[id]/page.tsx` — Note editor (placeholder)
- `src/app/(app)/tags/page.tsx` — Tags (placeholder)
- `src/app/(app)/settings/page.tsx` — Settings (placeholder)
- `src/app/login/page.tsx` — Login page (basic)

### 2.4 Theme System
- `src/components/theme/theme-provider.tsx` — next-themes provider
- `src/components/theme/theme-toggle.tsx` — dark/light toggle button
- Persist preference in localStorage

### 2.5 Tauri Integration (minimal)
- Install @tauri-apps/api
- `src-tauri/` directory with tauri.conf.json
- Window title: "knot"
- Min size: 800x600
- Default size: 1200x800

## Acceptance Criteria
- AppShell renders: sidebar + header + content
- Sidebar collapses/expands
- All routes render without 404
- Dark/light toggle works and persists
- Tauri app builds and launches
