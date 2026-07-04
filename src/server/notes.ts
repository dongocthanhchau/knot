"use server";

import { sqlite } from "@/db";
import { generateIdFromEntropySize } from "lucia";
import { getSession } from "@/lib/auth";

export async function listNotesAction() {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      "SELECT id, title, content, created_at as createdAt, updated_at as updatedAt FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC",
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

export async function getNoteAction(id: string) {
  const { user } = await getSession();
  if (!user) return null;

  const row = sqlite
    .prepare(
      "SELECT id, title, content, created_at as createdAt, updated_at as updatedAt FROM notes WHERE id = ? AND is_deleted = 0",
    )
    .get(id) as
    | { id: string; title: string; content: string | null; createdAt: string; updatedAt: string }
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

  sqlite
    .prepare(
      "INSERT INTO notes (id, title, content, page_settings, font_preferences, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      id,
      title ?? "Untitled",
      content ? JSON.stringify(content) : null,
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

export async function searchNotesAction(query: string) {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      "SELECT id, title, content, created_at as createdAt, updated_at as updatedAt FROM notes WHERE is_deleted = 0 AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC",
    )
    .all(`%${query}%`, `%${query}%`) as Array<{
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
