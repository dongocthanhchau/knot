# v1.0.0 Slides + Polish + Ship — Frontend Tasks

## Mục tiêu
Presentation slides from notes (#11), UI polish, final QA, ship preparation.

## Tasks

### 2.1 Slide Deck View
Component `src/components/slides/slide-deck.tsx`:
- List of slide decks for a note
- Thumbnail preview (first slide content)
- "Present" button → enter presentation mode
- Deck settings: theme selector, transition selector
- Empty state: "No slide decks yet. Auto-generate from headings."

### 2.2 Slide Editor
Component `src/components/slides/slide-editor.tsx`:
- Slide list (thumbnails) on left
- Current slide editor in center
- Slide properties panel on right
- Add/delete/reorder slides
- Edit slide content (simplified TipTap)
- Layout selector per slide
- Speaker notes textarea

### 2.3 Presentation Mode
Component `src/components/slides/presentation.tsx`:
- Full-screen mode
- One slide at a time
- Navigation: arrow keys, click (next), escape (exit)
- Progress indicator: "3 / 12"
- Theme support: light, dark, sepia, custom
- Transitions: fade, slide, zoom
- Speaker notes visible (on second monitor or overlay)
- Timer for timed presentations
- "Present from this note" button in note editor toolbar

### 2.4 UI Polish
Final pass across all components:
- Consistent loading states (skeleton everywhere)
- Error states (retry buttons on failed loads)
- Empty states for all lists/tables/views
- Responsive layout check (tablet, desktop)
- Keyboard shortcuts documented:
  - Cmd+K: Search
  - Cmd+N: New note
  - Cmd+E: Toggle editor/focus mode
  - Cmd+P: Open command palette
  - Cmd+B: Toggle sidebar
  - Ctrl+Tab: Switch between recent notes
- Animations:
  - Smooth page transitions (framer-motion)
  - Sidebar collapse animation
  - Toast notifications for actions
  - Hover states on all interactive elements

### 2.5 Onboarding
Component `src/components/onboarding/onboarding-flow.tsx`:
- First-run experience (check localStorage flag)
- Step 1: Welcome + "Create your first note"
- Step 2: "Add a tag"
- Step 3: "Explore the graph"
- Step 4: "Try search (Cmd+K)"
- Progress indicator
- Skip button
- "Getting Started" page accessible anytime from help menu

### 2.6 Settings Page
`src/app/(app)/settings/page.tsx`:
- General: default editor mode, language, theme
- Editor: font size, line height, auto-save interval
- Graph: all graph-related configs
- Templates: manage templates
- Data: import/export section
- About: version, build info

## Acceptance Criteria
- Slides auto-generated from headings
- Presentation mode full-screen with nav
- Onboarding shows on first run
- Settings page functional
- All UI states (loading, empty, error) handled
- Keyboard shortcuts work
- Slide editor works
