# v0.4.0 Hierarchical Navigation — Test Plan

## Test Cases

### TC-01: Doc Tree
- Tree renders with proper indentation
- Expand/collapse works
- Click note → opens in editor
- Active note highlighted

### TC-02: Drag and Drop
- Drag note onto another → becomes child
- Drag to root → becomes root
- Visual feedback during drag (drop indicator)
- Cannot drop on itself

### TC-03: Breadcrumbs
- Breadcrumb shows full path
- Click segment navigates correctly
- Root note shows (no breadcrumb or just "Home")

### TC-04: Block References
- Create ref from block A to note B → ref appears in B's incoming list
- Click ref → navigates to source note with block highlighted
- Delete ref → removed from list
- Context snippet shows surrounding text

### TC-05: Circular Reference Prevention
- Move note → try to set child as parent → error returned
- API prevents circular hierarchy

## Edge Cases
- Very deep nesting (10+ levels) — tree should still work
- Note with very long title in tree — text truncation
- Drag to invalid position — rejected
- Note with no parent (root) — handled
- Delete parent with children — children become root
- Empty tree state
