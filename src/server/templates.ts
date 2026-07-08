"use server";

import { sqlite } from "@/db";
import { generateIdFromEntropySize } from "lucia";
import { getSession } from "@/lib/auth";

export async function listTemplatesAction() {
  const { user } = await getSession();
  if (!user) return [];

  return sqlite
    .prepare("SELECT id, name, content, created_at as createdAt FROM templates ORDER BY name ASC")
    .all() as Array<{ id: string; name: string; content: string; createdAt: string }>;
}

export async function saveTemplateAction(name: string, content: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  const id = generateIdFromEntropySize(10);
  const createdAt = new Date().toISOString();

  sqlite
    .prepare("INSERT INTO templates (id, name, content, created_at) VALUES (?, ?, ?, ?)")
    .run(id, name, content, createdAt);

  return { id };
}

export async function deleteTemplateAction(id: string) {
  const { user } = await getSession();
  if (!user) throw new Error("Unauthorized");

  sqlite.prepare("DELETE FROM templates WHERE id = ?").run(id);

  return { success: true };
}
