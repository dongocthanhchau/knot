"use server";

import { sqlite } from "@/db";
import { generateIdFromEntropySize } from "lucia";
import { getSession } from "@/lib/auth";

export async function listTagsAction() {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      `SELECT t.id, t.name, t.color, t.parent_id as parentId,
        COUNT(nt.note_id) as noteCount
      FROM tags t
      LEFT JOIN note_tags nt ON nt.tag_id = t.id
      GROUP BY t.id
      ORDER BY t.name ASC`,
    )
    .all() as Array<{
    id: string;
    name: string;
    color: string | null;
    parentId: string | null;
    noteCount: number;
  }>;

  return rows;
}

export async function createTagAction(name: string, color?: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const id = generateIdFromEntropySize(10);

  sqlite
    .prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)")
    .run(id, name, color ?? "#6b7280");

  return { id };
}

export async function updateTagAction(id: string, name: string, color: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite.prepare("UPDATE tags SET name = ?, color = ? WHERE id = ?").run(name, color, id);

  return { success: true };
}

export async function deleteTagAction(id: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite.prepare("DELETE FROM note_tags WHERE tag_id = ?").run(id);
  sqlite.prepare("DELETE FROM tags WHERE id = ?").run(id);

  return { success: true };
}

export async function getNoteTagsAction(noteId: string) {
  const { user } = await getSession();
  if (!user) return [];

  const rows = sqlite
    .prepare(
      `SELECT t.id, t.name, t.color
      FROM tags t
      JOIN note_tags nt ON nt.tag_id = t.id
      WHERE nt.note_id = ?
      ORDER BY t.name ASC`,
    )
    .all(noteId) as Array<{
    id: string;
    name: string;
    color: string | null;
  }>;

  return rows;
}

export async function addNoteTagAction(noteId: string, tagId: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const exists = sqlite
    .prepare("SELECT 1 FROM note_tags WHERE note_id = ? AND tag_id = ?")
    .get(noteId, tagId);

  if (exists) return { success: true };

  sqlite.prepare("INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)").run(noteId, tagId);

  return { success: true };
}

export async function removeNoteTagAction(noteId: string, tagId: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite.prepare("DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?").run(noteId, tagId);

  return { success: true };
}
