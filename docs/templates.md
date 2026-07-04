# Templates

Built-in note templates for Knot. Each template provides a structured starting point
with predefined sections, formatting, and variables that are interpolated on creation.

---

## Template System Architecture

Templates are stored as JSON schema in the SQLite database (table: `templates`) and
rendered via the TipTap editor on instantiation. The system has three layers:

### Layer 1: Registry (`lib/templates/registry.ts`)

Loads built-in templates from a JSON index and user-created templates from the DB.
Built-in templates are read-only; users can fork a built-in template into a custom
copy.

### Layer 2: Schema (`lib/templates/schema.ts`)

Each template is validated against a Zod schema at rest:

```typescript
const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(64),
  icon: z.string().emoji().length(1),    // single emoji
  description: z.string().max(256),
  tags: z.array(z.string()).default([]),
  variables: z.record(z.string()),        // key → default value
  coverPage: coverPageSchema.optional(),
  sections: z.array(sectionSchema).min(1),
  metadata: z.object({
    version: z.number().int().positive().default(1),
    builtIn: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
});
```

### Layer 3: Renderer (`lib/templates/renderer.ts`)

The renderer walks the section tree and emits TipTap JSON nodes:

1. **Variables** (`{{variable}}`) are interpolated before rendering.
2. Each **section** maps to one or more TipTap node types (heading, paragraph, table, codeBlock, etc.).
3. **Repeatable sections** (e.g., chapters, dish cards) generate N copies with numbered variables.
4. **Optional sections** (e.g., section divider) are skipped when the trigger variable is empty.

### Template Instantiation Flow

```
User picks template
  → Variable form opens (prefilled with defaults)
    → User fills variables
      → Renderer interpolates + builds TipTap JSON
        → New note created in DB with rendered content
          → Editor opens with content
```

---

## Import & Export

Templates can be created from external documents or shared as files.

### Import DOCX / Markdown

Users can upload a `.docx` or `.md` file and Knot auto-generates a template from its structure.

**Import pipeline**:

```
Upload file
  → Parse (mammoth.js HTML + docx.js styles/numbering/sections)
    → Structure detection (section hierarchy, headings, tables, images, fill-in blanks)
      → Variable extraction (AI-assisted: finds repeating patterns → suggests {{variables}})
        → Template preview (user reviews/edits sections and variables)
          → Save as template in DB
```

| Component | File | Description |
|-----------|------|-------------|
| `ImporterService` | `lib/templates/importer.ts` | Orchestrates the import pipeline. Accepts DOCX (Buffer) or MD (string), returns a `TemplateCandidate`. |
| `DocxParser` | `lib/templates/importers/docx.ts` | Uses mammoth.js (HTML output) + docx.js (low-level access: styles, numbering, headers/footers, page layout). Returns a `ParsedDocument` with structured blocks. |
| `MdParser` | `lib/templates/importers/md.ts` | Parses markdown via remark/unified. Detects heading hierarchy, tables, lists, code blocks, images. |
| `StructureDetector` | `lib/templates/detector.ts` | Walks `ParsedDocument` to identify section boundaries (H1/H2 splits), repeating patterns (same subsections across multiple chapters), fill-in blanks (`………`, `____`), and cover page. Scores repeat confidence. |
| `VariableExtractor` | `lib/templates/variables.ts` | Suggests `{{variable}}` placeholders from repeated text spans and document metadata (author, date, institution). Uses keyword matching + optional LLM call for complex patterns. |
| `TemplatePreview` | `lib/templates/preview.tsx` | React component showing the parsed template structure. Users can: rename sections, toggle repeatable, add/remove variables, preview rendered output, then save or discard. |

### Import from Other Apps

| Source | Format | Notes |
|--------|--------|-------|
| Obsidian | `.md` files (plain markdown with wikilinks `[[...]]`) | MdParser handles — wikilinks converted to doc references |
| Obsidian Canvas | `.canvas` files (JSON Canvas format) | Reuses JSON Canvas parser from map system. Each file/link node becomes a template section |
| Notion | Markdown export (`.zip` of `.md` files + assets) | MdParser per file. Frontmatter metadata extracted to template variables |
| Generic DOCX | `.docx` | DocxParser. Heading-based structure detection, table detection, image extraction |

### Import from Clipboard

Users can paste rich text (from Word, Google Docs, web pages) directly into a new template:

1. Paste → browser clipboard API extracts HTML
2. Turndown converts HTML to markdown
3. MdParser extracts structure
4. TemplatePreview opens for review

### Export Templates

Templates can be exported as `.json` files for sharing or backup:

- **Single**: Export one template → `.knot-template.json` file
- **Batch**: Export multiple templates → `.zip` archive
- **Import**: Drag-and-drop `.knot-template.json` file into Knot to add to library. Validated against Zod schema before import.

## Templates

---

## 1. 📚 Giáo trình / Textbook

Academic textbook template with cover page, foreword, regulations, and repeating
chapters. Designed for Vietnamese technical education materials.

| Field | Value |
|-------|-------|
| **Icon** | 📚 |
| **Name** | Giáo trình / Textbook |
| **Description** | Structured textbook with cover page, foreword, regulations, and repeating chapters (bài). Based on analysis of a real DOCX giáo trình. |
| **Tags** | `academic`, `education`, `textbook` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{title}}` | — | Main textbook title |
| `{{subtitle}}` | — | Subject/topic subtitle |
| `{{subtitle2}}` | — | Optional subtitle line 2 |
| `{{field}}` | `KỸ THUẬT ĐIỆN TỬ` | Field of study |
| `{{authors}}` | — | Author names (comma-separated) |
| `{{institution}}` | — | Institution full name |
| `{{department}}` | — | Department name |
| `{{sub_department}}` | — | Sub-department / division |
| `{{date}}` | — | Publication date |
| `{{foreword_text}}` | — | Foreword body content |
| `{{chapter_count}}` | `5` | Number of chapters to generate |
| `{{chapter_titles}}` | — | Comma-separated chapter titles |

### Cover Page

| Element | Format |
|---------|--------|
| Institution name | 20pt BOLD #0070C0 CENTER |
| Department | 20pt BOLD #0070C0 CENTER |
| Sub-department | 20pt BOLD #0070C0 CENTER |
| Logo | Centered image (optional) |
| Authors | 20pt BOLD #1F4E79 CENTER (one per line, max 3) |
| "GIÁO TRÌNH" | 30pt BOLD #0070C0 CENTER |
| Subtitle | 28pt BOLD #1F4E79 CENTER |
| Subtitle 2 | 14pt BOLD #0070C0 CENTER |
| Field (`NGÀNH: ...`) | 14pt BOLD #0070C0 CENTER |
| Date | 13–16pt BOLD #0070C0 CENTER |

### Sections

**1. Foreword**

| Block | Formatting |
|-------|-----------|
| Heading | `LỜI NÓI ĐẦU` — 18pt BOLD+ITALIC CENTER |
| Body | 13pt ITALIC JUSTIFY — `{{foreword_text}}` |
| CLO/CDR (optional) | 11pt BOLD+ITALIC JUSTIFY |
| Acknowledgments | 13pt ITALIC JUSTIFY |

*Repeatable*: No

**2. Regulations**

| Block | Formatting |
|-------|-----------|
| Heading | `NỘI QUY PHÒNG THỰC HÀNH` — Heading 1 (16pt #2E74B5 CENTER) |
| Items (11+) | 13pt JUSTIFY, decimal numbering (1., 2., ...) |

*Repeatable*: No

**3. Chapter** (generated `{{chapter_count}}` times)

*Variable mapping per iteration*:
- `{{chapter_N_number}}` — extracted from position
- `{{chapter_N_title}}` — from `{{chapter_titles}}` split

| Block | Formatting |
|-------|-----------|
| Heading | `BÀI {{chapter_N_number}}: {{chapter_N_title}}` — Heading 1 (16pt #2E74B5 CENTER) |
| Section intro | 2-column table (3 rows, title + blank cells) — Table Grid, 4pt borders |
| **I. Mục đích – Yêu cầu** | 13pt BOLD JUSTIFY |
| Objectives | Multi-level numbered list (`1. → a. → i.`) |
| Requirements | Bullet list |
| **II. Nội dung thực hành** | 13pt BOLD JUSTIFY |
| **1. Chuẩn bị** | Sub-heading |
| BOM Table | 5-column Table Grid: `STT \| Loại linh kiện \| Từ khóa tìm \| Giá trị \| Số lượng` |
| **2. {{circuit}} — Mô phỏng trên Multisim** | Sub-heading (repeatable per circuit variant) |
| Steps | Numbered with bold step headers (`Bước 1.`, `Bước 2.`, ...) |
| Fill-in blanks | `Vi = ………`, `Time/Div = ………`, `Volts/Div = ………` |
| Schematic image | With caption: `Hình X.Y: [description]` — 13pt CENTER |
| Data table | 3-column Table Grid: `Thông số \| Dạng sóng/Dạng phổ \| Kết quả` — first column vertical-merged |
| Observation | `Nhận xét:` — 13pt BOLD JUSTIFY with fill-in lines |
| **3. {{circuit}} — Khảo sát trên kit thực hành** | Sub-heading (repeatable) |
| Steps | Numbered |
| Data table | Same 3-column format |
| Observation | `Nhận xét:` with fill-in lines |

*Repeatable*: Yes — controlled by `{{chapter_count}}`

### Page Setup

| Property | Value |
|----------|-------|
| Paper | A4 portrait |
| Margins | L: 3cm, R: 2cm, T: 2.5cm, B: 2.5cm |
| Body font | Times New Roman 13pt JUSTIFY |
| Header | Bài title — CENTER |
| Footer | `Trang ` + page number — CENTER |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000001",
  "name": "Giáo trình / Textbook",
  "icon": "📚",
  "description": "Structured textbook with cover page, foreword, regulations, and repeating chapters. Based on analysis of a real DOCX giáo trình.",
  "tags": ["academic", "education", "textbook"],
  "variables": {
    "title": "",
    "subtitle": "",
    "subtitle2": "",
    "field": "KỸ THUẬT ĐIỆN TỬ",
    "authors": "",
    "institution": "",
    "department": "",
    "sub_department": "",
    "date": "",
    "foreword_text": "",
    "chapter_count": "5",
    "chapter_titles": ""
  },
  "coverPage": {
    "enabled": true,
    "elements": [
      { "type": "text", "content": "{{institution}}", "style": { "fontSize": 20, "bold": true, "color": "#0070C0", "align": "center" } },
      { "type": "text", "content": "{{department}}", "style": { "fontSize": 20, "bold": true, "color": "#0070C0", "align": "center" } },
      { "type": "text", "content": "{{sub_department}}", "style": { "fontSize": 20, "bold": true, "color": "#0070C0", "align": "center" } },
      { "type": "image", "style": { "align": "center" } },
      { "type": "text", "content": "{{authors}}", "style": { "fontSize": 20, "bold": true, "color": "#1F4E79", "align": "center" } },
      { "type": "text", "content": "GIÁO TRÌNH", "style": { "fontSize": 30, "bold": true, "color": "#0070C0", "align": "center" } },
      { "type": "text", "content": "{{subtitle}}", "style": { "fontSize": 28, "bold": true, "color": "#1F4E79", "align": "center" } },
      { "type": "text", "content": "{{subtitle2}}", "style": { "fontSize": 14, "bold": true, "color": "#0070C0", "align": "center" } },
      { "type": "text", "content": "NGÀNH: {{field}}", "style": { "fontSize": 14, "bold": true, "color": "#0070C0", "align": "center" } },
      { "type": "text", "content": "{{date}}", "style": { "fontSize": 14, "bold": true, "color": "#0070C0", "align": "center" } }
    ]
  },
  "sections": [
    {
      "id": "foreword",
      "name": "Foreword",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "LỜI NÓI ĐẦU", "style": { "fontSize": 18, "bold": true, "italic": true, "align": "center" } },
        { "type": "paragraph", "content": "{{foreword_text}}", "style": { "fontSize": 13, "italic": true, "align": "justify" } },
        { "type": "paragraph", "content": "", "optional": true, "style": { "fontSize": 11, "bold": true, "italic": true, "align": "justify" } }
      ]
    },
    {
      "id": "regulations",
      "name": "Regulations",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "NỘI QUY PHÒNG THỰC HÀNH", "style": { "fontSize": 16, "color": "#2E74B5", "align": "center" } },
        { "type": "list", "style": "ordered", "items": ["Item 1", "Item 2", "..."], "format": { "fontSize": 13, "align": "justify" } }
      ]
    },
    {
      "id": "chapter",
      "name": "Chapter",
      "repeatable": true,
      "countVariable": "chapter_count",
      "variablePrefix": "chapter_",
      "blocks": [
        { "type": "heading", "level": 1, "content": "BÀI {{number}}: {{title}}", "style": { "fontSize": 16, "color": "#2E74B5", "align": "center" } },
        { "type": "table", "rows": 3, "cols": 2, "style": "Table Grid", "border": "4pt" },
        { "type": "heading", "level": 2, "content": "I. Mục đích – Yêu cầu", "style": { "fontSize": 13, "bold": true, "align": "justify" } },
        { "type": "list", "style": "ordered", "levels": ["1.", "a.", "i."] },
        { "type": "list", "style": "bullet" },
        { "type": "heading", "level": 2, "content": "II. Nội dung thực hành", "style": { "fontSize": 13, "bold": true, "align": "justify" } },
        { "type": "heading", "level": 3, "content": "1. Chuẩn bị", "style": { "fontSize": 13, "bold": true } },
        { "type": "table", "cols": 5, "headers": ["STT", "Loại linh kiện", "Từ khóa tìm", "Giá trị", "Số lượng"] },
        { "type": "heading", "level": 3, "content": "2. {{circuit}} — Mô phỏng trên Multisim", "optional": true },
        { "type": "list", "style": "ordered", "stepPrefix": "Bước" },
        { "type": "paragraph", "content": "Vi = ………   Time/Div = ………   Volts/Div = ………" },
        { "type": "image", "caption": "Hình X.Y: [description]", "style": { "align": "center", "fontSize": 13 } },
        { "type": "table", "cols": 3, "headers": ["Thông số", "Dạng sóng/Dạng phổ", "Kết quả"], "mergeFirstColumn": true },
        { "type": "paragraph", "content": "Nhận xét:", "style": { "fontSize": 13, "bold": true, "align": "justify" } },
        { "type": "heading", "level": 3, "content": "3. {{circuit}} — Khảo sát trên kit thực hành", "optional": true },
        { "type": "list", "style": "ordered" },
        { "type": "table", "cols": 3, "headers": ["Thông số", "Dạng sóng/Dạng phổ", "Kết quả"], "mergeFirstColumn": true },
        { "type": "paragraph", "content": "Nhận xét:", "style": { "fontSize": 13, "bold": true, "align": "justify" } }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "pageSetup": {
      "paperSize": "A4",
      "orientation": "portrait",
      "margins": { "top": 2.5, "bottom": 2.5, "left": 3, "right": 2 },
      "headerFooter": { "header": "bài title CENTER", "footer": "Trang # CENTER" }
    }
  }
}
```

---

## 2. 🎞 Presentation / Slides

Slide deck for presentations with title slide, content slides, and optional section
dividers.

| Field | Value |
|-------|-------|
| **Icon** | 🎞 |
| **Name** | Presentation / Slides |
| **Description** | Slide deck for presentations with title slide, content slides, and section dividers. |
| **Tags** | `presentation`, `slides`, `business` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{title}}` | — | Presentation title |
| `{{subtitle}}` | — | Presentation subtitle |
| `{{author}}` | — | Presenter name |
| `{{date}}` | — | Presentation date |
| `{{event}}` | — | Event/Conference name |
| `{{slide_count}}` | `8` | Number of content slides |
| `{{section_count}}` | `0` | Number of section dividers |

### Cover Slide

| Element | Format |
|---------|--------|
| Title | 40pt CENTER |
| Subtitle | 24pt CENTER |
| Author · Date | 18pt CENTER |
| Optional logo | Image, top-right |

### Content Slide (repeatable, `{{slide_count}}` times)

| Block | Formatting |
|-------|-----------|
| Heading | 32pt LEFT |
| Body | Bullet points, image, code block, table, or diagram |
| Speaker notes (optional) | 12pt ITALIC, visible in presenter mode |

### Section Divider (optional, `{{section_count}}` times)

| Block | Formatting |
|-------|-----------|
| Heading | 48pt CENTER |
| Subtitle | 24pt CENTER |

### End Slide

| Block | Formatting |
|-------|-----------|
| "Thank You" / "Q&A" | 40pt CENTER |
| Contact info | 20pt CENTER |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000002",
  "name": "Presentation / Slides",
  "icon": "🎞",
  "description": "Slide deck for presentations with title slide, content slides, and section dividers.",
  "tags": ["presentation", "slides", "business"],
  "variables": {
    "title": "",
    "subtitle": "",
    "author": "",
    "date": "",
    "event": "",
    "slide_count": "8",
    "section_count": "0"
  },
  "coverPage": {
    "enabled": true,
    "elements": [
      { "type": "text", "content": "{{title}}", "style": { "fontSize": 40, "align": "center" } },
      { "type": "text", "content": "{{subtitle}}", "style": { "fontSize": 24, "align": "center" } },
      { "type": "text", "content": "{{author}} · {{date}}", "style": { "fontSize": 18, "align": "center" } },
      { "type": "image", "style": { "position": "top-right" } }
    ]
  },
  "sections": [
    {
      "id": "content_slides",
      "name": "Content Slide",
      "repeatable": true,
      "countVariable": "slide_count",
      "blocks": [
        { "type": "heading", "level": 1, "content": "Slide {{number}}", "style": { "fontSize": 32, "align": "left" } },
        { "type": "bullet_list" },
        { "type": "paragraph", "content": "", "optional": true, "style": { "fontSize": 12, "italic": true } }
      ]
    },
    {
      "id": "section_divider",
      "name": "Section Divider",
      "repeatable": true,
      "countVariable": "section_count",
      "optional": true,
      "blocks": [
        { "type": "heading", "level": 1, "content": "Section {{number}}", "style": { "fontSize": 48, "align": "center" } },
        { "type": "paragraph", "content": "", "style": { "fontSize": 24, "align": "center" } }
      ]
    },
    {
      "id": "end_slide",
      "name": "End Slide",
      "repeatable": false,
      "blocks": [
        { "type": "paragraph", "content": "Thank You", "style": { "fontSize": 40, "align": "center" } },
        { "type": "paragraph", "content": "{{author}} · {{event}}", "style": { "fontSize": 20, "align": "center" } }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "pageSetup": { "orientation": "landscape" }
  }
}
```

---

## 3. 📍 Place Review

Location/place review with rating, photos, pros/cons, and travel tips.

| Field | Value |
|-------|-------|
| **Icon** | 📍 |
| **Name** | Place Review |
| **Description** | Location/place review with rating, photos, pros/cons. |
| **Tags** | `travel`, `review`, `location` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{place_name}}` | — | Name of the place |
| `{{location}}` | — | Address / coordinates |
| `{{category}}` | — | Type (restaurant, park, museum, etc.) |
| `{{rating}}` | `★★★★☆` | Star rating |
| `{{price_range}}` | `$$` | Price indicator |
| `{{best_time}}` | — | Recommended time to visit |

### Sections

**1. Hero**

| Block | Formatting |
|-------|-----------|
| Title | Heading 1 — `{{place_name}}` |
| Subtitle | `{{location}} · {{category}} · {{rating}}` |
| Cover image | Full-width, centered |

**2. Overview**

| Block | Formatting |
|-------|-----------|
| Info table | 3-row table: Type, Price Range, Best Time to Visit |

**3. Review Sections** (collapsible)

| Block | Formatting |
|-------|-----------|
| ## Atmosphere | Heading 2 + description + photo |
| ## Service | Heading 2 + rating + notes |
| ## Food / Activities | Heading 2 + rating + notes |

**4. Pros & Cons** — 2-column layout

| Column | Content |
|--------|---------|
| ✅ Pros | Bullet list |
| ❌ Cons | Bullet list |

**5. Tips**

| Block | Formatting |
|-------|-----------|
| Body | Bullet list — booking, parking, what to order |

**6. Photo Gallery**

| Block | Formatting |
|-------|-----------|
| Grid | 2×N image grid with captions |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000003",
  "name": "Place Review",
  "icon": "📍",
  "description": "Location/place review with rating, photos, pros/cons.",
  "tags": ["travel", "review", "location"],
  "variables": {
    "place_name": "",
    "location": "",
    "category": "",
    "rating": "★★★★☆",
    "price_range": "$$",
    "best_time": ""
  },
  "coverPage": {
    "enabled": true,
    "elements": [
      { "type": "image", "style": { "width": "100%", "align": "center" } }
    ]
  },
  "sections": [
    {
      "id": "hero",
      "name": "Hero",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{place_name}}", "style": { "fontSize": 32 } },
        { "type": "paragraph", "content": "{{location}} · {{category}} · {{rating}}", "style": { "fontSize": 14, "color": "#666" } },
        { "type": "image", "style": { "align": "center" } }
      ]
    },
    {
      "id": "overview",
      "name": "Overview",
      "repeatable": false,
      "blocks": [
        { "type": "table", "cols": 2, "rows": 3, "cells": [["Type", "{{category}}"], ["Price Range", "{{price_range}}"], ["Best Time", "{{best_time}}"]] }
      ]
    },
    {
      "id": "atmosphere",
      "name": "Atmosphere",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Atmosphere" },
        { "type": "paragraph", "content": "" },
        { "type": "image" }
      ]
    },
    {
      "id": "service",
      "name": "Service",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Service" },
        { "type": "paragraph", "content": "" }
      ]
    },
    {
      "id": "food_activities",
      "name": "Food / Activities",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Food / Activities" },
        { "type": "paragraph", "content": "" }
      ]
    },
    {
      "id": "pros_cons",
      "name": "Pros & Cons",
      "repeatable": false,
      "layout": "2-column",
      "blocks": [
        { "type": "list", "style": "bullet", "heading": "✅ Pros" },
        { "type": "list", "style": "bullet", "heading": "❌ Cons" }
      ]
    },
    {
      "id": "tips",
      "name": "Tips",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Tips" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "gallery",
      "name": "Photo Gallery",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Photo Gallery" },
        { "type": "image_grid", "columns": 2, "captions": true }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 4. 🍜 Food Review

Restaurant/food review with dish ratings, recommendations, and verdict.

| Field | Value |
|-------|-------|
| **Icon** | 🍜 |
| **Name** | Food Review |
| **Description** | Restaurant/food review with dish ratings and recommendations. |
| **Tags** | `food`, `review`, `restaurant` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{restaurant_name}}` | — | Restaurant name |
| `{{cuisine}}` | — | Cuisine type |
| `{{price_range}}` | `$$` | Price indicator |
| `{{rating}}` | `★★★★☆` | Overall rating |
| `{{address}}` | — | Full address |
| `{{phone}}` | — | Phone number |
| `{{hours}}` | — | Operating hours |
| `{{website}}` | — | Website URL |
| `{{dish_count}}` | `3` | Number of dish cards |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Restaurant name | Heading 1 with star rating |
| Info line | `{{cuisine}} · {{price_range}}` |
| Details | Address, phone, hours, website (each on own line) |

**2. Dishes** (repeatable, `{{dish_count}}` times)

| Block | Formatting |
|-------|-----------|
| Dish name | ### Heading 3 — `{{name}} ★★★☆☆` |
| Photo + price | Inline image + price tag |
| Description | Paragraph |
| Would order again | ✅ / ❌ toggle |

**3. Overall**

| Block | Formatting |
|-------|-----------|
| Score row | `Value: ★★★★☆ \| Vibe: ★★★★☆ \| Service: ★★★☆☆` |
| Must-try | Inline tags for recommended dishes |
| Verdict | Paragraph summary |

**4. Tags**

Inline tag list: `#cuisine #location #price-tier`

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000004",
  "name": "Food Review",
  "icon": "🍜",
  "description": "Restaurant/food review with dish ratings and recommendations.",
  "tags": ["food", "review", "restaurant"],
  "variables": {
    "restaurant_name": "",
    "cuisine": "",
    "price_range": "$$",
    "rating": "★★★★☆",
    "address": "",
    "phone": "",
    "hours": "",
    "website": "",
    "dish_count": "3"
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{restaurant_name}} {{rating}}" },
        { "type": "paragraph", "content": "{{cuisine}} · {{price_range}}" },
        { "type": "paragraph", "content": "📍 {{address}}", "style": { "fontSize": 12 } },
        { "type": "paragraph", "content": "📞 {{phone}}", "style": { "fontSize": 12 } },
        { "type": "paragraph", "content": "🕐 {{hours}}", "style": { "fontSize": 12 } },
        { "type": "paragraph", "content": "🌐 {{website}}", "style": { "fontSize": 12 } }
      ]
    },
    {
      "id": "dish",
      "name": "Dish Card",
      "repeatable": true,
      "countVariable": "dish_count",
      "blocks": [
        { "type": "heading", "level": 3, "content": "Dish {{number}}" },
        { "type": "image", "style": { "width": 200 } },
        { "type": "paragraph", "content": "Description:" },
        { "type": "paragraph", "content": "Would order again? ⬜" }
      ]
    },
    {
      "id": "overall",
      "name": "Overall",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Overall" },
        { "type": "paragraph", "content": "Value: ★★★★☆ | Vibe: ★★★★☆ | Service: ★★★☆☆" },
        { "type": "paragraph", "content": "Must-try:" },
        { "type": "paragraph", "content": "Verdict:" }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 5. 🧮 Data Structure / Algorithm

Technical note for data structures and algorithms with complexity table and code
examples.

| Field | Value |
|-------|-------|
| **Icon** | 🧮 |
| **Name** | Data Structure / Algorithm |
| **Description** | Technical note for data structures and algorithms with complexity table and code examples. |
| **Tags** | `cs`, `programming`, `algorithm` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{name}}` | — | Structure/algorithm name |
| `{{category}}` | — | Category (Tree, Sort, Graph, DP, etc.) |
| `{{definition}}` | — | Formal definition |
| `{{operation_count}}` | `3` | Number of operation blocks |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Name + category | Heading 1 — `{{name}} · {{category}}` |

**2. Definition**

| Block | Formatting |
|-------|-----------|
| One-liner | Paragraph |
| Formal definition | Blockquote |

**3. Complexity Table**

| Operation | Best | Average | Worst | Space |
|-----------|------|---------|-------|-------|
| (empty rows to fill) |

**4. Operations** (repeatable, `{{operation_count}}` times)

| Block | Formatting |
|-------|-----------|
| Operation name | ### Heading 3 |
| Pseudocode | Code block (language-agnostic) |
| Explanation | Paragraph |
| Diagram | Image placeholder |

**5. Code Example**

| Block | Formatting |
|-------|-----------|
| Language tabs | Python / TypeScript / C++ |
| Code blocks | Syntax-highlighted with copy button |

**6. Use Cases**

| Block | Formatting |
|-------|-----------|
| List | Bullet points — real-world applications |

**7. Related**

| Block | Formatting |
|-------|-----------|
| Links | Bullet list to related structures / algorithms |

**8. Practice Problems**

| Block | Formatting |
|-------|-----------|
| Table | Problem \| Difficulty \| Link |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000005",
  "name": "Data Structure / Algorithm",
  "icon": "🧮",
  "description": "Technical note for data structures and algorithms with complexity table and code examples.",
  "tags": ["cs", "programming", "algorithm"],
  "variables": {
    "name": "",
    "category": "",
    "definition": "",
    "operation_count": "3"
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{name}} · {{category}}" }
      ]
    },
    {
      "id": "definition",
      "name": "Definition",
      "repeatable": false,
      "blocks": [
        { "type": "paragraph", "content": "" },
        { "type": "blockquote", "content": "{{definition}}" }
      ]
    },
    {
      "id": "complexity",
      "name": "Complexity",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Complexity" },
        { "type": "table", "cols": 5, "headers": ["Operation", "Best", "Average", "Worst", "Space"] }
      ]
    },
    {
      "id": "operations",
      "name": "Operation",
      "repeatable": true,
      "countVariable": "operation_count",
      "blocks": [
        { "type": "heading", "level": 3, "content": "Operation {{number}}" },
        { "type": "code_block", "language": "text", "content": "" },
        { "type": "paragraph", "content": "" }
      ]
    },
    {
      "id": "code_example",
      "name": "Code Example",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Code Example" },
        { "type": "code_tabs", "languages": ["python", "typescript", "cpp"] }
      ]
    },
    {
      "id": "use_cases",
      "name": "Use Cases",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Use Cases" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "related",
      "name": "Related",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Related" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "practice",
      "name": "Practice Problems",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Practice Problems" },
        { "type": "table", "cols": 3, "headers": ["Problem", "Difficulty", "Link"] }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 6. 📋 Meeting Notes

Structured meeting notes with agenda, discussion, decisions, and action items.

| Field | Value |
|-------|-------|
| **Icon** | 📋 |
| **Name** | Meeting Notes |
| **Description** | Structured meeting notes with agenda, discussion, decisions, and action items. |
| **Tags** | `business`, `meeting`, `collaboration` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{title}}` | — | Meeting title |
| `{{date}}` | — | Meeting date |
| `{{time}}` | — | Start time |
| `{{location}}` | — | Room / link |
| `{{attendees}}` | — | Comma-separated attendee names |
| `{{agenda_items}}` | — | Comma-separated agenda topics |
| `{{next_date}}` | — | Next meeting date |
| `{{next_time}}` | — | Next meeting time |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Title | Heading 1 — `{{title}}` |
| Meta line | `📅 {{date}} · ⏰ {{time}} · 📍 {{location}}` |

**2. Attendees**

| Block | Formatting |
|-------|-----------|
| List | Bullet with status — `{{name}} (present/excused)` |

**3. Agenda**

| Block | Formatting |
|-------|-----------|
| List | Numbered — `{{topic}} — {{lead}}` |

**4. Discussion** (per agenda item)

| Block | Formatting |
|-------|-----------|
| Topic | ### Heading 3 — `1. {{topic}}` |
| Notes | Paragraphs + bullet points |

*Repeatable*: Based on `{{agenda_items}}` split

**5. Decisions**

| Block | Formatting |
|-------|-----------|
| Items | Bullet list with rationale |

**6. Action Items**

| Block | Formatting |
|-------|-----------|
| Table | Task \| Owner \| Due \| Status |

**7. Next Meeting**

| Block | Formatting |
|-------|-----------|
| Info | `📅 {{next_date}} · ⏰ {{next_time}}` |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000006",
  "name": "Meeting Notes",
  "icon": "📋",
  "description": "Structured meeting notes with agenda, discussion, decisions, and action items.",
  "tags": ["business", "meeting", "collaboration"],
  "variables": {
    "title": "",
    "date": "",
    "time": "",
    "location": "",
    "attendees": "",
    "agenda_items": "",
    "next_date": "",
    "next_time": ""
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{title}}" },
        { "type": "paragraph", "content": "📅 {{date}} · ⏰ {{time}} · 📍 {{location}}", "style": { "color": "#666" } }
      ]
    },
    {
      "id": "attendees",
      "name": "Attendees",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Attendees" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "agenda",
      "name": "Agenda",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Agenda" },
        { "type": "list", "style": "ordered" }
      ]
    },
    {
      "id": "discussion",
      "name": "Discussion",
      "repeatable": true,
      "blocks": [
        { "type": "heading", "level": 3, "content": "Topic {{number}}" },
        { "type": "paragraph", "content": "" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "decisions",
      "name": "Decisions",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Decisions" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "action_items",
      "name": "Action Items",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Action Items" },
        { "type": "table", "cols": 4, "headers": ["Task", "Owner", "Due", "Status"] }
      ]
    },
    {
      "id": "next_meeting",
      "name": "Next Meeting",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Next Meeting" },
        { "type": "paragraph", "content": "📅 {{next_date}} · ⏰ {{next_time}}" }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 7. 📖 Book / Article Summary

Book or article summary with key ideas, notable quotes, and action items.

| Field | Value |
|-------|-------|
| **Icon** | 📖 |
| **Name** | Book / Article Summary |
| **Description** | Book or article summary with key ideas, quotes, and action items. |
| **Tags** | `reading`, `learning`, `reference` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{title}}` | — | Book or article title |
| `{{author}}` | — | Author name |
| `{{year}}` | — | Publication year |
| `{{url}}` | — | Link (if article) |
| `{{idea_count}}` | `5` | Number of key idea slots |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Title + author | Heading 1 — `{{title}}` by `{{author}}` ({{year}}) |
| Link + tags | `{{url}} \| {{tags}}` |

**2. Key Ideas** (repeatable, `{{idea_count}}` times)

| Block | Formatting |
|-------|-----------|
| Number + bold idea | `{{number}}. **Idea** — explanation` |

**3. Notable Quotes**

| Block | Formatting |
|-------|-----------|
| Quote | Blockquote — `> "excerpt" — p.{{page}}` |

**4. Summary**

| Block | Formatting |
|-------|-----------|
| Synthesis | 1–2 paragraph summary |

**5. Action Items**

| Block | Formatting |
|-------|-----------|
| List | Bullet — what to apply / implement |

**6. Related**

| Block | Formatting |
|-------|-----------|
| List | Bullet — `[book/article] — [why related]` |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000007",
  "name": "Book / Article Summary",
  "icon": "📖",
  "description": "Book or article summary with key ideas, quotes, and action items.",
  "tags": ["reading", "learning", "reference"],
  "variables": {
    "title": "",
    "author": "",
    "year": "",
    "url": "",
    "idea_count": "5"
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{title}}" },
        { "type": "paragraph", "content": "by {{author}} ({{year}})", "style": { "color": "#666" } },
        { "type": "paragraph", "content": "{{url}}", "style": { "fontSize": 12 } }
      ]
    },
    {
      "id": "key_ideas",
      "name": "Key Ideas",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Key Ideas" },
        { "type": "list", "style": "ordered" }
      ]
    },
    {
      "id": "quotes",
      "name": "Quotes",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Notable Quotes" },
        { "type": "blockquote", "content": "" }
      ]
    },
    {
      "id": "summary",
      "name": "Summary",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Summary" },
        { "type": "paragraph", "content": "" }
      ]
    },
    {
      "id": "action_items",
      "name": "Action Items",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Action Items" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "related",
      "name": "Related",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Related" },
        { "type": "list", "style": "bullet" }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 8. 🍳 Recipe

Cooking recipe with ingredients table, step-by-step instructions, and notes.

| Field | Value |
|-------|-------|
| **Icon** | 🍳 |
| **Name** | Recipe |
| **Description** | Cooking recipe with ingredients, instructions, and notes. |
| **Tags** | `food`, `cooking`, `recipe` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{dish_name}}` | — | Name of the dish |
| `{{prep_time}}` | — | Preparation time |
| `{{cook_time}}` | — | Cooking time |
| `{{servings}}` | `4` | Number of servings |
| `{{difficulty}}` | `Easy` | Difficulty level |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Dish name | Heading 1 — `{{dish_name}}` |
| Meta line | `⏱ {{prep_time}} + {{cook_time}} · {{servings}} servings · {{difficulty}}` |

**2. Ingredients**

| Block | Formatting |
|-------|-----------|
| Table | Qty \| Ingredient \| Notes |

**3. Equipment**

| Block | Formatting |
|-------|-----------|
| List | Bullet items |

**4. Instructions**

| Block | Formatting |
|-------|-----------|
| Steps | Numbered list — `1. Step one...` |

**5. Notes**

| Block | Formatting |
|-------|-----------|
| Body | Substitutions, tips, storage info |

**6. Tags**

Inline: `#cuisine #meal-type #dietary`

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000008",
  "name": "Recipe",
  "icon": "🍳",
  "description": "Cooking recipe with ingredients, instructions, and notes.",
  "tags": ["food", "cooking", "recipe"],
  "variables": {
    "dish_name": "",
    "prep_time": "",
    "cook_time": "",
    "servings": "4",
    "difficulty": "Easy"
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{dish_name}}" },
        { "type": "paragraph", "content": "⏱ {{prep_time}} + {{cook_time}} · {{servings}} servings · {{difficulty}}" }
      ]
    },
    {
      "id": "ingredients",
      "name": "Ingredients",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Ingredients" },
        { "type": "table", "cols": 3, "headers": ["Qty", "Ingredient", "Notes"] }
      ]
    },
    {
      "id": "equipment",
      "name": "Equipment",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Equipment" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "instructions",
      "name": "Instructions",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Instructions" },
        { "type": "list", "style": "ordered" }
      ]
    },
    {
      "id": "notes",
      "name": "Notes",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Notes" },
        { "type": "paragraph", "content": "" }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 9. 📐 Project Spec

Project specification with requirements, architecture diagram, timeline, and risk
assessment.

| Field | Value |
|-------|-------|
| **Icon** | 📐 |
| **Name** | Project Spec |
| **Description** | Project specification with requirements, architecture, timeline, and risks. |
| **Tags** | `project`, `planning`, `engineering` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{project_name}}` | — | Project name |
| `{{status}}` | `🟡 In Progress` | Status with indicator |
| `{{priority}}` | `Medium` | Priority level |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Title + status | Heading 1 — `{{project_name}} · {{status}}` |
| Priority | Badge — `Priority: {{priority}}` |

**2. Overview**

| Block | Formatting |
|-------|-----------|
| Problem statement | Paragraph |
| Goals | Numbered list |

**3. Requirements**

| Block | Formatting |
|-------|-----------|
| ### Functional | Heading 3 — FR1, FR2, ... |
| ### Non-functional | Heading 3 — NFR1, NFR2, ... |

**4. Architecture**

| Block | Formatting |
|-------|-----------|
| Diagram | Image placeholder |
| Tech stack | Bullet list |

**5. Timeline**

| Block | Formatting |
|-------|-----------|
| Table | Phase \| Duration \| Milestone |

**6. Team**

| Block | Formatting |
|-------|-----------|
| 2-column table | Role \| Name |

**7. Risks**

| Block | Formatting |
|-------|-----------|
| Table | Risk \| Impact \| Mitigation |

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-000000000009",
  "name": "Project Spec",
  "icon": "📐",
  "description": "Project specification with requirements, architecture, timeline, and risks.",
  "tags": ["project", "planning", "engineering"],
  "variables": {
    "project_name": "",
    "status": "🟡 In Progress",
    "priority": "Medium"
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "{{project_name}}" },
        { "type": "paragraph", "content": "Status: {{status}} · Priority: {{priority}}" }
      ]
    },
    {
      "id": "overview",
      "name": "Overview",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Overview" },
        { "type": "paragraph", "content": "" },
        { "type": "list", "style": "ordered", "heading": "Goals" }
      ]
    },
    {
      "id": "requirements",
      "name": "Requirements",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Requirements" },
        { "type": "heading", "level": 3, "content": "Functional" },
        { "type": "list", "style": "ordered" },
        { "type": "heading", "level": 3, "content": "Non-functional" },
        { "type": "list", "style": "ordered" }
      ]
    },
    {
      "id": "architecture",
      "name": "Architecture",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Architecture" },
        { "type": "image", "caption": "Architecture diagram" },
        { "type": "paragraph", "content": "Tech stack:" },
        { "type": "list", "style": "bullet" }
      ]
    },
    {
      "id": "timeline",
      "name": "Timeline",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Timeline" },
        { "type": "table", "cols": 3, "headers": ["Phase", "Duration", "Milestone"] }
      ]
    },
    {
      "id": "team",
      "name": "Team",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Team" },
        { "type": "table", "cols": 2, "headers": ["Role", "Name"] }
      ]
    },
    {
      "id": "risks",
      "name": "Risks",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Risks" },
        { "type": "table", "cols": 3, "headers": ["Risk", "Impact", "Mitigation"] }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 10. 📓 Daily / Weekly Journal

Personal journal with highlights, tasks, reflection, and priorities.

| Field | Value |
|-------|-------|
| **Icon** | 📓 |
| **Name** | Daily / Weekly Journal |
| **Description** | Personal journal with highlights, tasks, reflection, and priorities. |
| **Tags** | `journal`, `personal`, `productivity` |

### Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `{{date}}` | — | Date for daily entry |
| `{{week_range}}` | — | Date range for weekly entry |
| `{{mood}}` | `😊` | Mood emoji |
| `{{entry_type}}` | `daily` | `daily` or `weekly` |

### Sections

**1. Header**

| Block | Formatting |
|-------|-----------|
| Date + mood | Heading 1 — `📅 {{date}} — {{mood}}` |

**2. Highlights**

| Block | Formatting |
|-------|-----------|
| 🏆 Best moment | Bullet |
| 📚 Top learning | Bullet |
| 🎯 Goal progress | Bullet |

**3. Tasks Completed**

| Block | Formatting |
|-------|-----------|
| List | Checklist / bullet |

**4. Reflection**

| Block | Formatting |
|-------|-----------|
| What went well | Bullet list |
| What could improve | Bullet list |
| Gratitude | Paragraph |

**5. Tomorrow / Next Week**

| Block | Formatting |
|-------|-----------|
| Priorities | Numbered list |

**6. Tags**

`#journal #week-N`

### JSON Schema

```json
{
  "id": "c7f8a1b2-0001-4000-8000-00000000000a",
  "name": "Daily / Weekly Journal",
  "icon": "📓",
  "description": "Personal journal with highlights, tasks, reflection, and priorities.",
  "tags": ["journal", "personal", "productivity"],
  "variables": {
    "date": "",
    "week_range": "",
    "mood": "😊",
    "entry_type": "daily"
  },
  "sections": [
    {
      "id": "header",
      "name": "Header",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 1, "content": "📅 {{date}} — {{mood}}" }
      ]
    },
    {
      "id": "highlights",
      "name": "Highlights",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Highlights" },
        { "type": "list", "style": "bullet", "items": ["🏆 Best moment:", "📚 Top learning:", "🎯 Goal progress:"] }
      ]
    },
    {
      "id": "tasks",
      "name": "Tasks Completed",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Tasks Completed" },
        { "type": "list", "style": "todo" }
      ]
    },
    {
      "id": "reflection",
      "name": "Reflection",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Reflection" },
        { "type": "paragraph", "content": "What went well:" },
        { "type": "paragraph", "content": "What could improve:" },
        { "type": "paragraph", "content": "Gratitude:" }
      ]
    },
    {
      "id": "next",
      "name": "Tomorrow / Next Week",
      "repeatable": false,
      "blocks": [
        { "type": "heading", "level": 2, "content": "Tomorrow / Next Week" },
        { "type": "list", "style": "ordered" }
      ]
    }
  ],
  "metadata": {
    "version": 1,
    "builtIn": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Appendix: Zod Schemas (Reference)

### `coverPageSchema`

```typescript
const coverPageElementSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string(), style: coverTextStyleSchema }),
  z.object({ type: z.literal("image"), style: coverImageStyleSchema.optional() }),
]);

const coverPageSchema = z.object({
  enabled: z.boolean(),
  elements: z.array(coverPageElementSchema),
});
```

### `sectionSchema`

```typescript
const blockSchema = z.object({
  type: z.enum(["heading", "paragraph", "list", "table", "code_block",
                "blockquote", "image", "image_grid", "code_tabs"]),
  level: z.number().int().min(1).max(6).optional(),     // heading
  style: z.record(z.unknown()).optional(),
  content: z.string().optional(),
  optional: z.boolean().default(false),
  // Table-specific
  cols: z.number().int().optional(),
  rows: z.number().int().optional(),
  headers: z.array(z.string()).optional(),
  mergeFirstColumn: z.boolean().optional(),
  // List-specific
  style: z.enum(["ordered", "bullet", "todo"]).optional(),
  levels: z.array(z.string()).optional(),                // multi-level numbering
  stepPrefix: z.string().optional(),                     // e.g. "Bước"
  // Code-specific
  language: z.string().optional(),
  languages: z.array(z.string()).optional(),              // code_tabs
  // Image-specific
  caption: z.string().optional(),
  columns: z.number().int().optional(),                  // image_grid
});

const sectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  repeatable: z.boolean().default(false),
  countVariable: z.string().optional(),                   // only when repeatable
  variablePrefix: z.string().optional(),
  optional: z.boolean().default(false),
  layout: z.enum(["single", "2-column"]).default("single"),
  blocks: z.array(blockSchema),
});
```

### `pageSetupSchema`

```typescript
const pageSetupSchema = z.object({
  paperSize: z.enum(["A4", "Letter", "Legal"]).default("A4"),
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  margins: z.object({
    top: z.number().default(2.5),
    bottom: z.number().default(2.5),
    left: z.number().default(2.5),
    right: z.number().default(2.5),
  }).default({}),
  headerFooter: z.object({
    header: z.string().optional(),
    footer: z.string().optional(),
    differentFirstPage: z.boolean().default(false),
  }).optional(),
}).optional();
```

---

*Last updated: 2025-07-04*
