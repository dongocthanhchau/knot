# v1.0.0 Slides + Polish + Ship — Test Plan

## Test Cases

### TC-01: Slide Generation
- Auto-generate slides from note with headings
- Each H1/H2 = new slide
- Content distributed correctly under each slide
- Note without headings → one slide per paragraph

### TC-02: Presentation Mode
- Full-screen presentation works
- Arrow keys navigate slides
- Progress indicator shows correct count
- Exit presentation via Escape
- Transitions animate between slides

### TC-03: Slide Editor
- Reorder slides via drag
- Edit slide content → saved
- Add/delete slides
- Change layout per slide

### TC-04: Onboarding
- First visit shows welcome steps
- Skip skips onboarding
- "Getting Started" accessible later
- Steps complete correctly

### TC-05: Settings
- Theme change applies globally
- Font size affects editor
- All sections render correctly
- Settings persist on reload

### TC-06: Keyboard Shortcuts
- Cmd+K opens search
- Cmd+N creates new note
- Cmd+B toggles sidebar
- Cmd+E toggles focus mode
- Ctrl+Tab cycles recent notes

### TC-07: UI States
- Loading skeletons on all data-fetching pages
- Empty states for all lists
- Error state with retry button
- Toast notifications appear and auto-dismiss

### TC-08: Responsiveness
- Layout works at 1024px (tablet landscape)
- Layout works at 1440px (desktop)
- Layout works at 1920px+ (widescreen)
- Sidebar collapses gracefully

### TC-09: Health Check
- /api/health returns ok
- /api/version returns correct version string
- All features listed in version response

### TC-10: Final Integration
- Create note → add tags → search → find it
- Create nested hierarchy → tree renders correctly
- Add block reference → appears in graph
- Create snapshot → restore → content correct
- Export note → file downloads correctly
- End-to-end: all features work together
- App runs without console errors

## Edge Cases
- Note with 50+ headings → slides navigation performance
- Presentation with single slide
- Settings with invalid values — validation
- Onboarding on mobile viewport
- Very long slide content — scroll within slide
- Keyboard shortcuts when dialog/input focused — should not trigger
- Concurrent note edit + slide generation
- Missing health endpoint — timeout handling
