# v0.6.0 Spatial Canvas + Connection Strength — Backend Tasks

## Mục tiêu
Spatial Canvas data management (#4), Connection Strength Engine (#18), Node Map Editor data (#14).

## Tasks

### 1.1 Canvas Data Management
File `src/server/canvas.ts`:
- `createCanvas(noteId: string, name: string) => Canvas`
- `getCanvas(canvasId: string) => Canvas | null`
- `listCanvases(noteId: string) => Canvas[]`
- `deleteCanvas(canvasId: string) => void`
- Canvas type: { id, noteId, name, nodes: CanvasNode[], edges: CanvasEdge[], createdAt, updatedAt }
- CanvasNode: { id, type: 'note'|'tag'|'text'|'shape', x, y, width, height, data, color }
- CanvasEdge: { id, source, target, label?, weight }

### 1.2 Canvas Node Operations
File `src/server/canvas.ts` (extend):
- `addCanvasNode(canvasId: string, node: CanvasNode) => void`
- `updateCanvasNode(canvasId: string, nodeId: string, updates: Partial<CanvasNode>) => void`
- `removeCanvasNode(canvasId: string, nodeId: string) => void`
- `moveCanvasNode(canvasId: string, nodeId: string, x, y) => void`
- `addCanvasEdge(canvasId: string, edge: CanvasEdge) => void`
- `removeCanvasEdge(canvasId: string, edgeId: string) => void`

### 1.3 Connection Strength Engine (#18)
File `src/server/connection-strength.ts`:
- `calculateConnectionWeight(sourceId: string, targetId: string) => ConnectionScore`
- `getConnectionStrength(noteId: string, targetId: string) => number` (0.0 - 1.0)
- ConnectionScore breakdown:
  - tagOverlap: number — shared tags / total unique tags
  - refCount: number — bidirectional references
  - hierarchyDistance: number — 1/(tree_distance + 1)
  - recencyScore: number — both edited recently? (7-day decay)
  - contentSimilarity: number — TF-IDF cosine similarity of title + first 200 chars
- Final weight formula: `0.25*tagOverlap + 0.25*refCount + 0.15*hierarchyDistance + 0.1*recencyScore + 0.25*contentSimilarity`
- `getStrongestConnections(noteId: string, limit?: number) => { noteId, title, weight, reasons[] }[]`
  - reasons: human-readable list like "3 shared tags", "2 block references", "Sibling note"

### 1.4 Connection Strength Settings
- `getConnectionSettings(userId: string) => ConnectionSettings`
- `updateConnectionSettings(settings: Partial<ConnectionSettings>) => void`
- ConnectionSettings: { tagWeight, refWeight, hierarchyWeight, recencyWeight, similarityWeight }

## API Routes
- CRUD /api/canvas — canvas management
- POST /api/canvas/:id/nodes — add node
- PATCH /api/canvas/:id/nodes/:nodeId — update node
- DELETE /api/canvas/:id/nodes/:nodeId — remove node
- POST /api/canvas/:id/edges — add edge
- DELETE /api/canvas/:id/edges/:edgeId — remove edge
- GET /api/notes/:id/strength/:targetId — connection weight
- GET /api/notes/:id/strength — strongest connections
- GET/PUT /api/connection-settings — user preferences

## Acceptance Criteria
- Canvas CRUD works
- Canvas nodes can be positioned and moved
- Connection weight returns 0.0-1.0 with breakdown
- Strongest connections returns ranked list with reasons
- Settings persist
