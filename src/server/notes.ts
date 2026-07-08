"use server";

import { sqlite } from "@/db";
import { generateIdFromEntropySize } from "lucia";
import { getSession } from "@/lib/auth";
import { Document, Packer, Paragraph, TextRun } from "docx";

export async function listNotesAction() {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      "SELECT id, title, content, is_pinned as isPinned, created_at as createdAt, updated_at as updatedAt FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC",
    )
    .all() as Array<{
    id: string;
    title: string;
    content: string | null;
    isPinned: number;
    createdAt: string;
    updatedAt: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    preview: row.content
      ? row.content.replace(/<[^>]*>/g, "").slice(0, 100)
      : "",
    isPinned: row.isPinned === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function listNotesWithTagsAction() {
  const notes = await listNotesAction();
  if (notes.length === 0) return [];

  const ids = notes.map((n) => n.id);
  const placeholders = ids.map(() => "?").join(",");

  const tagRows = sqlite
    .prepare(
      `SELECT nt.note_id as noteId, t.id, t.name, t.color
      FROM note_tags nt
      JOIN tags t ON t.id = nt.tag_id
      WHERE nt.note_id IN (${placeholders})
      ORDER BY t.name`,
    )
    .all(...ids) as Array<{
    noteId: string;
    id: string;
    name: string;
    color: string | null;
  }>;

  const tagsByNote: Record<string, Array<{ id: string; name: string; color: string | null }>> = {};
  for (const tr of tagRows) {
    if (!tagsByNote[tr.noteId]) tagsByNote[tr.noteId] = [];
    tagsByNote[tr.noteId].push({ id: tr.id, name: tr.name, color: tr.color });
  }

  return notes.map((note) => ({
    ...note,
    tags: tagsByNote[note.id] ?? [],
  }));
}

export async function getNoteAction(id: string) {
  const { user } = await getSession();
  if (!user) return null;

  const row = sqlite
    .prepare(
      "SELECT id, title, content, page_settings as pageSettings, created_at as createdAt, updated_at as updatedAt FROM notes WHERE id = ? AND is_deleted = 0",
    )
    .get(id) as
    | {
        id: string;
        title: string;
        content: string | null;
        pageSettings: string | null;
        createdAt: string;
        updatedAt: string;
      }
    | undefined;

  return row ?? null;
}

export async function createNoteAction(
  title?: string,
  content?: unknown,
  pageSettings?: string | null,
  fontPreferences?: string | null,
) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const id = generateIdFromEntropySize(10);
  const now = new Date().toISOString();

  // Generate an empty DOCX so the editor loads instead of "No document loaded"
  const emptyDoc = new Document({
    sections: [{ children: [new Paragraph({ children: [new TextRun("")] })] }],
  });
  const docxBuffer = await Packer.toBuffer(emptyDoc);

  sqlite
    .prepare(
      "INSERT INTO notes (id, title, content, content_docx, page_settings, font_preferences, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      title ?? "Untitled",
      content ? JSON.stringify(content) : null,
      docxBuffer,
      pageSettings ?? null,
      fontPreferences ?? null,
      now,
      now,
    );

  return { id };
}

export async function updateNoteAction(id: string, title: string, content: string | null) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const now = new Date().toISOString();

  sqlite
    .prepare("UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?")
    .run(title, content, now, id);

  return { updatedAt: now };
}

export async function deleteNoteAction(id: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const now = new Date().toISOString();

  sqlite
    .prepare("UPDATE notes SET is_deleted = 1, updated_at = ? WHERE id = ?")
    .run(now, id);

  return { success: true };
}

export async function permanentlyDeleteNoteAction(id: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite.prepare("DELETE FROM notes WHERE id = ?").run(id);

  return { success: true };
}

export async function saveNoteAction(
  id: string,
  title: string,
  content: string | null,
  lastSavedAt?: string,
  pageSettings?: string | null,
  fontPreferences?: string | null,
) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  if (lastSavedAt) {
    const row = sqlite
      .prepare("SELECT updated_at FROM notes WHERE id = ?")
      .get(id) as { updated_at: string } | undefined;

    if (row && row.updated_at !== lastSavedAt) {
      return { error: "Conflict" as const, serverUpdatedAt: row.updated_at };
    }
  }

  const now = new Date().toISOString();

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  setClauses.push("title = ?");
  values.push(title);

  setClauses.push("content = ?");
  values.push(content);

  if (pageSettings !== undefined) {
    setClauses.push("page_settings = ?");
    values.push(pageSettings);
  }

  if (fontPreferences !== undefined) {
    setClauses.push("font_preferences = ?");
    values.push(fontPreferences);
  }

  setClauses.push("updated_at = ?");
  values.push(now);

  values.push(id);

  sqlite
    .prepare(`UPDATE notes SET ${setClauses.join(", ")} WHERE id = ?`)
    .run(...values);

  return { updatedAt: now };
}

function sanitizeFtsQuery(input: string): string {
  return input
    .replace(/[^\w\sÀ-ỹ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"`)
    .join(" ");
}

export async function searchNotesAction(query: string) {
  const { user } = await getSession();
  if (!user) return [];

  const ftsQuery = sanitizeFtsQuery(query.trim());

  let rows: Array<{ id: string; title: string; content: string | null; isPinned: number; createdAt: string; updatedAt: string }>;

  if (ftsQuery) {
    try {
      rows = sqlite
        .prepare(
          `SELECT n.id, n.title, n.content, n.is_pinned as isPinned, n.created_at as createdAt, n.updated_at as updatedAt
          FROM notes n
          JOIN notes_fts fts ON n.rowid = fts.rowid
          WHERE notes_fts MATCH ?
          AND n.is_deleted = 0
          ORDER BY rank`,
        )
        .all(ftsQuery) as typeof rows;
    } catch {
      rows = sqlite
        .prepare(
          "SELECT id, title, content, is_pinned as isPinned, created_at as createdAt, updated_at as updatedAt FROM notes WHERE is_deleted = 0 AND (title LIKE ? OR content LIKE ?) ORDER BY is_pinned DESC, updated_at DESC",
        )
        .all(`%${query}%`, `%${query}%`) as typeof rows;
    }
  } else {
    rows = [];
  }

  if (rows.length === 0 && !ftsQuery) return [];

  const notes = rows.map((row) => ({
    id: row.id,
    title: row.title,
    preview: row.content
      ? row.content.replace(/<[^>]*>/g, "").slice(0, 100)
      : "",
    isPinned: (row as any).isPinned === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  if (notes.length === 0) return [];

  const ids = notes.map((n) => n.id);
  const placeholders = ids.map(() => "?").join(",");

  const tagRows = sqlite
    .prepare(
      `SELECT nt.note_id as noteId, t.id, t.name, t.color
      FROM note_tags nt
      JOIN tags t ON t.id = nt.tag_id
      WHERE nt.note_id IN (${placeholders})
      ORDER BY t.name`,
    )
    .all(...ids) as Array<{
    noteId: string;
    id: string;
    name: string;
    color: string | null;
  }>;

  const tagsByNote: Record<string, Array<{ id: string; name: string; color: string | null }>> = {};
  for (const tr of tagRows) {
    if (!tagsByNote[tr.noteId]) tagsByNote[tr.noteId] = [];
    tagsByNote[tr.noteId].push({ id: tr.id, name: tr.name, color: tr.color });
  }

  return notes.map((note) => ({
    ...note,
    tags: tagsByNote[note.id] ?? [],
  }));
}

export async function restoreNoteAction(id: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const now = new Date().toISOString();

  sqlite
    .prepare("UPDATE notes SET is_deleted = 0, updated_at = ? WHERE id = ?")
    .run(now, id);

  return { success: true };
}

export async function listTrashNotesAction() {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      "SELECT id, title, content, created_at as createdAt, updated_at as updatedAt FROM notes WHERE is_deleted = 1 ORDER BY updated_at DESC",
    )
    .all() as Array<{
    id: string;
    title: string;
    content: string | null;
    createdAt: string;
    updatedAt: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    preview: row.content
      ? row.content.replace(/<[^>]*>/g, "").slice(0, 100)
      : "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function listVersionsAction(noteId: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const rows = sqlite
    .prepare(
      "SELECT id, version_number as versionNumber, content, created_at as createdAt FROM note_versions WHERE note_id = ? ORDER BY version_number DESC",
    )
    .all(noteId) as Array<{
    id: string;
    versionNumber: number;
    content: string | null;
    createdAt: string;
  }>;

  return rows;
}

export async function createVersionAction(noteId: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const note = sqlite
    .prepare("SELECT content FROM notes WHERE id = ? AND is_deleted = 0")
    .get(noteId) as { content: string | null } | undefined;

  if (!note) throw new Error("Note not found");

  const id = generateIdFromEntropySize(10);
  const now = new Date().toISOString();

  const maxRow = sqlite
    .prepare(
      "SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM note_versions WHERE note_id = ?",
    )
    .get(noteId) as { next: number };

  const versionNumber = maxRow.next;

  sqlite
    .prepare(
      "INSERT INTO note_versions (id, note_id, content, version_number, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, noteId, note.content, versionNumber, now);

  return { id, versionNumber, createdAt: now };
}

export async function restoreVersionAction(noteId: string, versionId: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const version = sqlite
    .prepare("SELECT content FROM note_versions WHERE id = ? AND note_id = ?")
    .get(versionId, noteId) as { content: string | null } | undefined;

  if (!version) throw new Error("Version not found");

  const now = new Date().toISOString();

  sqlite
    .prepare("UPDATE notes SET content = ?, updated_at = ? WHERE id = ?")
    .run(version.content, now, noteId);

  return { success: true, updatedAt: now };
}

export async function importNoteAction(title: string, content: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const id = generateIdFromEntropySize(10);
  const now = new Date().toISOString();

  sqlite
    .prepare(
      "INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, title || "Imported Note", content, now, now);

  return { id };
}

export async function togglePinAction(id: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const row = sqlite
    .prepare("SELECT is_pinned FROM notes WHERE id = ?")
    .get(id) as { is_pinned: number } | undefined;

  if (!row) throw new Error("Note not found");

  const newVal = row.is_pinned ? 0 : 1;
  sqlite.prepare("UPDATE notes SET is_pinned = ? WHERE id = ?").run(newVal, id);

  return { isPinned: newVal === 1 };
}

export async function getTrashCountAction() {
  const { user } = await getSession();
  if (!user) return 0;

  const row = sqlite
    .prepare("SELECT COUNT(*) as count FROM notes WHERE is_deleted = 1")
    .get() as { count: number };

  return row.count;
}

export async function getNoteTreeAction() {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      "SELECT id, title, parent_id as parentId FROM notes WHERE is_deleted = 0 ORDER BY title ASC",
    )
    .all() as Array<{
    id: string;
    title: string;
    parentId: string | null;
  }>;

  return rows;
}

export async function setNoteParentAction(id: string, parentId: string | null) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite.prepare("UPDATE notes SET parent_id = ? WHERE id = ?").run(parentId, id);

  return { success: true };
}

export async function bulkDeleteAction(ids: string[]) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");
  if (ids.length === 0) return { count: 0 };

  const placeholders = ids.map(() => "?").join(",");
  sqlite
    .prepare(`UPDATE notes SET is_deleted = 1 WHERE id IN (${placeholders})`)
    .run(...ids);

  return { count: ids.length };
}

export async function savePropertiesAction(id: string, pageSettings: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite
    .prepare("UPDATE notes SET page_settings = ?, updated_at = ? WHERE id = ?")
    .run(pageSettings, new Date().toISOString(), id);

  return { success: true };
}

export async function getBacklinksAction(noteId: string) {
  const { user } = await getSession();
  if (!user) return [];

  return sqlite
    .prepare(
      `SELECT n.id, n.title FROM note_links nl
       JOIN notes n ON n.id = nl.source_note_id
       WHERE nl.target_note_id = ? AND n.is_deleted = 0`,
    )
    .all(noteId) as Array<{ id: string; title: string }>;
}

export async function scanAndUpdateLinksAction(noteId: string, content: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const wikiRegex = /\[\[([^\]]+)\]\]/g;
  const titles = new Set<string>();
  let match;
  while ((match = wikiRegex.exec(content)) !== null) {
    titles.add(match[1].trim());
  }

  if (titles.size === 0) {
    sqlite.prepare("DELETE FROM note_links WHERE source_note_id = ?").run(noteId);
    return { links: 0 };
  }

  const targetNotes = sqlite
    .prepare(
      `SELECT id, title FROM notes WHERE title IN (${Array.from(titles).map(() => "?").join(",")}) AND is_deleted = 0`,
    )
    .all(...Array.from(titles)) as Array<{ id: string; title: string }>;

  sqlite.prepare("DELETE FROM note_links WHERE source_note_id = ?").run(noteId);

  const insert = sqlite.prepare(
    "INSERT OR IGNORE INTO note_links (id, source_note_id, target_note_id, link_type, created_at) VALUES (?, ?, ?, ?, ?)",
  );

  const now = new Date().toISOString();
  for (const target of targetNotes) {
    const id = generateIdFromEntropySize(10);
    insert.run(id, noteId, target.id, "wikilink", now);
  }

  return { links: targetNotes.length };
}

export async function getStatsAction() {
  const { user } = await getSession();
  if (!user) return null;

  const noteCount = (
    sqlite.prepare("SELECT COUNT(*) as count FROM notes WHERE is_deleted = 0").get() as { count: number }
  ).count;
  const tagCount = (
    sqlite.prepare("SELECT COUNT(*) as count FROM tags").get() as { count: number }
  ).count;
  const trashedCount = (
    sqlite.prepare("SELECT COUNT(*) as count FROM notes WHERE is_deleted = 1").get() as { count: number }
  ).count;
  const lastUpdated = (
    sqlite.prepare("SELECT updated_at as updatedAt FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC LIMIT 1").get() as { updatedAt: string } | undefined
  )?.updatedAt ?? null;

  return { noteCount, tagCount, trashedCount, lastUpdated };
}

export async function importDocxAction(name: string, base64: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const id = generateIdFromEntropySize(10);
  const now = new Date().toISOString();
  const title = name.replace(/\.docx$/i, "");
  const docxBuffer = Buffer.from(base64, "base64");

  sqlite
    .prepare(
      "INSERT INTO notes (id, title, content_docx, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, title, docxBuffer, now, now);

  return { id };
}
