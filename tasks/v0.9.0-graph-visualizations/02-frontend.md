# v0.9.0 Mind Map + Tree Map + Drill-Down Graph — Frontend Tasks

## Mục tiêu
Auto Mind Map visualization (#12), Tree Map visualization (#13), Drill-Down Graph UX (#17).

## Tasks

### 2.1 Auto Mind Map (#12)
Component `src/components/graph/mind-map.tsx`:
- Tree layout using D3.js tree layout
- Three layout modes:
  - Tree: root at top, children below (standard org chart)
  - Radial: root at center, children in concentric circles
  - Org chart: alternating left-right for compact vertical
- Nodes: rounded rectangles with title
- Collapsible branches (click to expand/collapse)
- Smooth transitions on expand/collapse
- Zoomable/pannable
- Click node → navigate to note
- Hover → tooltip with summary text
- Legend for depth colors

Component `src/components/graph/mind-map-config.tsx`:
- Config drawer: layout selector, depth slider, show tags toggle, show summaries toggle

### 2.2 Tree Map (#13)
Component `src/components/graph/tree-map.tsx`:
- Squarified treemap using D3.js treemap layout
- Each rectangle = a note
- Rectangle size = note weight (content + children + tags)
- Color coding: by tag or depth
- Rectangle shows: title (truncated if small), child count badge on hover
- Zoom: click rectangle → drill into that subtree (re-renders treemap for that node's children)
- Breadcrumb: "Root > Folder > Subfolder" above treemap
- Back button to go up one level
- Hover tooltip: full title, size value

Component `src/components/graph/tree-map-config.tsx`:
- Sizing method: content/children/balanced
- Coloring: tag/depth/random
- Min rectangle size slider (prevent too-small rects)

### 2.3 Drill-Down Graph (#17)
Component `src/components/graph/drill-down.tsx`:
- Force-directed graph centered on current note
- Levels expand outward with concentric rings or different opacity
- Controls:
  - "Expand" button → load next level
  - "Collapse" button → go back one level
  - Path mode: enter target note name → show shortest path highlighted
- Visual:
  - Current note: large, highlighted (glow)
  - Level 1: medium, semi-transparent
  - Level 2: smaller, more transparent
  - Level 3+: smallest, most transparent
- Edges: labeled with relation type ("parent", "reference", "tag")
- Path highlight: animated dashed line along path
- History sidebar: "Recent drill-downs" list

### 2.4 Graph Page
`src/app/(app)/graph/page.tsx` — updated to include tabs:
- "Context Graph" | "Mind Map" | "Tree Map" | "Drill-Down"
- Tab state persists in URL query param
- Each tab uses its respective component

## Acceptance Criteria
- Mind map renders three layouts correctly
- Collapse/expand branches
- Tree map shows weighted rectangles
- Click tree map rectangle → drill into child subtree
- Drill-down expands level by level
- Path mode finds and highlights shortest path
- Tab switching works with URL persistence
- All config options work
