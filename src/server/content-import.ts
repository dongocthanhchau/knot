"use server";

import { sqlite } from "@/db";
import { generateIdFromEntropySize } from "lucia";
import { getSession } from "@/lib/auth";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

export interface CurriculumLesson {
  title: string;
  sections: CurriculumSection[];
}

export interface CurriculumSection {
  heading: string;
  level: number; // 1 = H2 (section), 2 = H3 (subsection)
  bodyHtml: string;
}

export interface CurriculumImport {
  title: string;
  author: string;
  lessons: CurriculumLesson[];
}

/**
 * Import a complete curriculum with hierarchical lesson structure.
 * Creates a parent note for the curriculum, then child notes for each lesson.
 */
export async function importCurriculumAction(curriculum: CurriculumImport) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const now = new Date().toISOString();
  const curriculumId = generateIdFromEntropySize(10);

  // 1. Create the parent curriculum note
  const curriculumContent = buildCurriculumContent(curriculum);
  sqlite
    .prepare(
      "INSERT INTO notes (id, title, content, content_docx, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(curriculumId, curriculum.title, curriculumContent, null, now, now);

  // 2. Create lesson notes as children
  const lessonIds: string[] = [];
  for (const lesson of curriculum.lessons) {
    const lessonId = generateIdFromEntropySize(10);
    const lessonContent = buildLessonContent(lesson);
    const lessonDocx = await buildLessonDocx(lesson);

    sqlite
      .prepare(
        "INSERT INTO notes (id, title, content, content_docx, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(lessonId, lesson.title, lessonContent, lessonDocx, curriculumId, now, now);

    lessonIds.push(lessonId);
  }

  // 3. Create or get the "curriculum" tag and link all notes
  const tagRow = sqlite
    .prepare("SELECT id FROM tags WHERE name = ?")
    .get("curriculum") as { id: string } | undefined;

  let tagId: string;
  if (tagRow) {
    tagId = tagRow.id;
  } else {
    tagId = generateIdFromEntropySize(10);
    sqlite
      .prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)")
      .run(tagId, "curriculum", "#8b5cf6");
  }

  // Link all notes to the curriculum tag
  const allNoteIds = [curriculumId, ...lessonIds];
  for (const noteId of allNoteIds) {
    sqlite
      .prepare("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)")
      .run(noteId, tagId);
  }

  return {
    curriculumId,
    lessonIds,
    count: lessonIds.length,
  };
}

function buildCurriculumContent(curriculum: CurriculumImport): string {
  const parts: string[] = [];
  parts.push("<h1>Mục lục</h1>");
  parts.push("<ul>");
  for (const lesson of curriculum.lessons) {
    parts.push(`<li><a href="#${slugify(lesson.title)}">${lesson.title}</a></li>`);
  }
  parts.push("</ul>");
  parts.push(`<p><em>Tác giả: ${curriculum.author}</em></p>`);
  return parts.join("\n");
}

function buildLessonContent(lesson: CurriculumLesson): string {
  const parts: string[] = [];

  for (const section of lesson.sections) {
    if (section.level === 0) {
      parts.push(`<h1>${section.heading}</h1>`);
    } else if (section.level === 1) {
      parts.push(`<h2>${section.heading}</h2>`);
    } else if (section.level === 2) {
      parts.push(`<h3>${section.heading}</h3>`);
    }
    if (section.bodyHtml) {
      parts.push(section.bodyHtml);
    }
  }

  return parts.join("\n");
}

/**
 * Convert lesson HTML content to a DOCX binary Buffer.
 * Parses the predictable HTML from buildLessonContent() into
 * docx.js Paragraph objects and packs them into a .docx file.
 */
async function buildLessonDocx(lesson: CurriculumLesson): Promise<Buffer | null> {
  const children: Paragraph[] = [];

  for (const section of lesson.sections) {
    // Section heading
    if (section.level === 0) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 200 },
        }),
      );
    } else if (section.level === 1) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 160 },
        }),
      );
    } else if (section.level === 2) {
      children.push(
        new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        }),
      );
    }

    // Body HTML — parse into paragraphs
    if (section.bodyHtml) {
      const paragraphs = parseHtmlToParagraphs(section.bodyHtml);
      children.push(...paragraphs);
    }
  }

  if (children.length === 0) return null;

  const doc = new Document({
    title: lesson.title,
    description: "Imported curriculum lesson",
    styles: {
      default: {
        document: {
          run: { size: 24, font: "Calibri" }, // 12pt
          paragraph: { spacing: { after: 120 } },
        },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

/** Regex-based HTML-to-Paragraph converter for our predictable HTML output. */
function parseHtmlToParagraphs(html: string): Paragraph[] {
  const result: Paragraph[] = [];

  // Split on block-level tags: <p>, <li>, <ul>, </ul>, <br>
  const blockPattern = /<(p|li|ul|\/ul|br|h[1-3])([^>]*)>/gi;
  let lastIndex = 0;
  let inList = false;
  let listItems: string[] = [];

  for (const match of html.matchAll(blockPattern)) {
    // Flush any text before this tag
    const leadingText = html.slice(lastIndex, match.index).trim();
    if (leadingText && !inList) {
      result.push(new Paragraph({ children: [new TextRun({ text: leadingText })] }));
    }

    const tag = match[1].toLowerCase();

    if (tag === "ul") {
      inList = true;
      listItems = [];
    } else if (tag === "/ul") {
      inList = false;
      for (const item of listItems) {
        result.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: stripTags(item) })],
            spacing: { before: 40, after: 40 },
          }),
        );
      }
      listItems = [];
    } else if (tag === "li" && inList) {
      // Capture content until </li>
      const liEnd = html.indexOf("</li>", match.index);
      const liContent = liEnd !== -1 ? html.slice(match.index + match[0].length, liEnd) : "";
      listItems.push(liContent.trim());
    } else if (tag === "p") {
      const pEnd = html.indexOf("</p>", match.index);
      const pContent = pEnd !== -1 ? html.slice(match.index + match[0].length, pEnd) : "";
      const text = stripTags(pContent).trim();
      if (text) {
        // Check for <em> or <strong> wrapping
        const hasEmphasis = /<em>/i.test(pContent) || /<i>/i.test(pContent);
        const hasStrong = /<strong>/i.test(pContent) || /<b>/i.test(pContent);
        const runs: TextRun[] = [];
        if (hasStrong && hasEmphasis) {
          runs.push(new TextRun({ text, bold: true, italics: true }));
        } else if (hasStrong) {
          runs.push(new TextRun({ text, bold: true }));
        } else if (hasEmphasis) {
          runs.push(new TextRun({ text, italics: true }));
        } else {
          runs.push(new TextRun({ text }));
        }
        result.push(new Paragraph({ children: runs }));
      }
    } else if (tag === "br") {
      result.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Flush remaining text
  const remaining = html.slice(lastIndex).trim();
  if (remaining && !inList) {
    result.push(new Paragraph({ children: [new TextRun({ text: stripTags(remaining) })] }));
  }

  return result;
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Bulk-import lessons from a structured array.
 * Useful for scripting the import of pre-defined curricula.
 */
export async function bulkImportLessonsAction(
  lessons: Array<{ title: string; content: string; parentId?: string }>,
) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const now = new Date().toISOString();
  const ids: string[] = [];

  for (const lesson of lessons) {
    const id = generateIdFromEntropySize(10);
    sqlite
      .prepare(
        "INSERT INTO notes (id, title, content, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(id, lesson.title, lesson.content, lesson.parentId ?? null, now, now);
    ids.push(id);
  }

  return { ids, count: ids.length };
}
