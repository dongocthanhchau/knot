# v1.0.0 Slides + Polish + Ship — Backend Tasks

## Mục tiêu
Slides presentation from notes (#11), final polish, performance, and ship readiness.

## Tasks

### 1.1 Slides Data
File `src/server/slides.ts`:
- `createSlideDeck(noteId: string, options?: SlideOptions) => SlideDeck`
  - Auto-generate slides from note headings
  - Each H1/H2 = new slide
  - Content under heading = slide content
  - If no headings, each paragraph = separate slide
- `getSlideDeck(id: string) => SlideDeck | null`
- `updateSlideDeck(id: string, updates: Partial<SlideDeck>) => void`
- `deleteSlideDeck(id: string) => void`
- `reorderSlides(deckId: string, slideIds: string[]) => void`
- SlideDeck type: { id, noteId, title, slides: Slide[], theme, transition, createdAt, updatedAt }
- Slide type: { id, content (TipTap JSON), notes? (speaker notes), layout: 'title'|'content'|'two-column'|'image'|'blank' }

### 1.2 Presentation Mode
- `getPresentationDeck(deckId: string) => SlideDeck` — full deck with all slides expanded
- `getSlide(deckId: string, slideIndex: number) => Slide`

### 1.3 Performance Optimization
File `src/server/performance.ts`:
- Database query optimization:
  - Add indexes for frequently queried columns: notes.updated_at, notes.parent_id, note_tags.note_id, snapshots.note_id
  - Add composite index for search: notes FTS5 idx
- API response caching:
  - Cache dashboard stats (30s TTL)
  - Cache graph data (60s TTL)
  - Cache other tree data (30s TTL)
- Batch loading:
  - `loadNotesBulk(noteIds: string[]) => Note[]`
  - `loadGraphsBulk(noteIds: string[]) => GraphData[]`
- Query timeout protection: 5s max per query

### 1.4 Final Verification
- `GET /api/health` — returns { status: 'ok', timestamp, dbConnected: bool, version: '1.0.0' }
- `GET /api/version` — returns { version: '1.0.0', buildDate, features: ['notes','tags','search',...] }
- Verify all API routes return proper error responses
- Ensure all routes handle 404, 400, 500 consistently

## API Routes
- CRUD /api/slide-decks — slide deck management
- GET /api/slide-decks/:id/present — presentation data
- PATCH /api/slide-decks/:id/slides/reorder — reorder slides
- GET /api/health — health check
- GET /api/version — version info

## Acceptance Criteria
- Slides auto-generated from note headings
- Slide deck CRUD works
- Health endpoint returns status
- Version endpoint returns correct version
- Performance improvements measurable
