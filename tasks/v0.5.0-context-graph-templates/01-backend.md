# v0.5.0 Context Graph + Template System — Backend Tasks

## Mục tiêu
Doc Context Graph data (#15), Template System CRUD (#19).

## Tasks

### 1.1 Doc Context Graph API
File `src/server/context-graph.ts`:
- `getGraphData(noteId: string, depth?: number) => GraphData`
  - GraphData = { nodes: GraphNode[], links: GraphLink[] }
  - GraphNode = { id, title, type: 'note'|'tag'|'ref', weight }
  - GraphLink = { source, target, relation: 'parent'|'child'|'ref'|'tag', weight }
- `getRelatedNotes(noteId: string) => RelatedNote[]` — notes with most connections
- Weight calculation:
  - Direct parent/child = weight 1.0
  - Block reference = weight 0.8
  - Same tags = weight 0.5 per shared tag
  - Deep ancestry = weight 0.3 per level
- `getGraphConfig() => GraphConfig` — adjustable weight multipliers via settings

### 1.2 Template System
File `src/server/templates.ts`:
- `createTemplate(data: { name, content, category, icon }) => Template`
- `getTemplate(id: string) => Template | null`
- `listTemplates(category?: string) => Template[]`
- `updateTemplate(id: string, data) => Template`
- `deleteTemplate(id: string) => void`
- `instantiateTemplate(templateId: string, title: string) => Note`
  - Clone template content into new note
  - Replace {{variable}} placeholders with defaults
  - Return created noteId
- Template type: { id, name, content (TipTap JSON), category, icon, createdAt, updatedAt }

Template categories: 'note', 'daily', 'project', 'meeting'

### 1.3 Graph Settings
File `src/server/graph-settings.ts`:
- `getGraphSettings(userId: string) => GraphSettings`
- `updateGraphSettings(settings: Partial<GraphSettings>) => void`
- GraphSettings: { maxDepth, weightMultipliers, showTags, showRefs, showHierarchy }

## API Routes
- GET /api/notes/:id/graph — get graph data for note
- GET /api/notes/:id/related — related notes
- CRUD /api/templates — template management
- POST /api/templates/:id/instantiate — create note from template
- GET/PUT /api/graph-settings — user graph preferences

## Acceptance Criteria
- Graph data returns correct nodes and weighted links
- Related notes ranked by connection strength
- Create template → listable by category
- Instantiate template → new note with content
- Template variables placeholders preserved for manual replacement
