import type { Document, Paragraph, ParagraphContent, RunContent } from "@eigenpal/docx-editor-core";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
  paraId?: string;
}

/**
 * Extract heading-paragraph text from the ParagraphFormatting styleId on
 * each paragraph-level BlockContent.  DOCX heading styleIds follow the
 * pattern "Heading1", "Heading2", …  Runs that start with a tracked
 * deletion are skipped; inline hyperlink / image content is ignored (we
 * want plain text only).
 */
export function extractHeadingsFromDoc(document: Document): HeadingItem[] {
  const body = document.package?.document;
  if (!body?.content) return [];

  const headings: HeadingItem[] = [];

  for (const block of body.content) {
    if (block.type !== "paragraph") continue;

    const para = block as Paragraph;
    const styleId = para.formatting?.styleId;
    if (!styleId || !isHeadingStyleId(styleId)) continue;

    const level = parseHeadingLevel(styleId);
    const text = extractParagraphText(para);

    headings.push({
      id: `h-${headings.length + 1}`,
      text,
      level,
      paraId: para.paraId,
    });
  }

  return headings;
}

function isHeadingStyleId(styleId: string): boolean {
  // Match "Heading1", "heading1", "Heading 1" etc.
  return /^heading\d*$/i.test(styleId.replace(/\s+/g, ""));
}

function parseHeadingLevel(styleId: string): number {
  const m = styleId.match(/\d+/);
  if (!m) return 1;
  const n = parseInt(m[0], 10);
  return n >= 1 && n <= 9 ? n : 1;
}

function extractParagraphText(para: Paragraph): string {
  const parts: string[] = [];

  for (const child of para.content) {
    if (child.type !== "run") continue;
    const run = child as { type: "run"; content: RunContent[] };
    for (const rc of run.content) {
      if (rc.type === "text") {
        const textContent = rc as { type: "text"; text: string };
        parts.push(textContent.text);
      }
    }
  }

  return parts.join("").trim();
}
