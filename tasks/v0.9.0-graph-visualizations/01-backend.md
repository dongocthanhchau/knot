# v0.9.0 Mind Map + Tree Map + Drill-Down Graph — Backend Tasks

## Mục tiêu
Auto Mind Map from note hierarchy (#12), Tree Map visualization (#13), Drill-Down Graph traversal (#17).

## Tasks

### 1.1 Auto Mind Map Data
File `src/server/mindmap.ts`:
- `generateMindMap(rootNoteId: string, depth?: number) => MindMapData`
  - Traverses note hierarchy from root
  - Builds tree structure: { id, title, children: MindMapNode[], noteId, summary? }
  - Summary: first 100 chars of root node content
  - Optional depth limit (default: 3 levels)
- `getMindMapConfig(userId: string) => MindMapConfig`
- `updateMindMapConfig(config: Partial<MindMapConfig>) => void`
- MindMapConfig: { maxDepth, showTags, showSummaries, layout: 'tree'|'radial'|'org' }
- Caching: generateMindMap result cached per rootNoteId, invalidated on note change

### 1.2 Tree Map Data
File `src/server/treemap.ts`:
- `generateTreeMap(rootNoteId?: string) => TreeMapData`
  - Hierarchical rectangular subdivision based on note hierarchy
  - Tile size proportional to: note content length + number of children + number of tags
  - TreeMapNode: { id, title, value (weight), children: TreeMapNode[], color: string, noteId }
  - Color by: tag (first tag) or depth level
- `getTreeMapLayout(data: TreeMapData, width: number, height: number) => LayoutRect[]`
  - Squarified treemap algorithm (Bruls, Huizing, van Wijk)
  - Returns positioned rectangles: { id, x, y, width, height, noteId }
- `getTreeMapConfig(userId: string) => TreeMapConfig`
- `updateTreeMapConfig(config) => void`
- TreeMapConfig: { sizing: 'content'|'children'|'balanced', coloring: 'tag'|'depth'|'random' }

### 1.3 Drill-Down Graph Data
File `src/server/drilldown.ts`:
- `getDrillDownGraph(noteId: string, depth?: number) => DrillDownData`
  - Start from noteId, expand outward by connections
  - Level 0: current note (center)
  - Level 1: directly connected notes (parent, children, refs)
  - Level 2: connections of level 1 notes
  - etc. up to configurable depth
- `getDrillDownPath(noteId: string, targetId: string) => DrillDownPath`
  - Find shortest weighted path between two notes
  - Returns: { path: { noteId, title, relation, weight }[], totalWeight }
- `getDrillDownHistory(userId: string) => { noteId, title, timestamp }[]`
  - Track recent drill-down sessions
  - Store in localStorage-equivalent server setting

## API Routes
- GET /api/notes/:id/mindmap — generate mind map
- GET /api/mindmap-config — get config
- PUT /api/mindmap-config — update config
- GET /api/notes/:id/treemap — generate tree map
- GET /api/treemap-config — get config
- PUT /api/treemap-config — update config
- GET /api/notes/:id/drilldown — drill-down graph data
- GET /api/notes/:id/drilldown/path/:targetId — find path

## Acceptance Criteria
- Mind map generates hierarchical tree from notes
- Tree map produces weighted rectangles
- Drill-down loads connected notes level by level
- Path finding returns shortest weighted path
- Configs persist per user
