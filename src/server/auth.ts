"use server";

import { createSession, getSession, signOut } from "@/lib/auth";
import { sqlite } from "@/db";
import { hash, verify } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { redirect } from "next/navigation";

export async function signInAction(
  prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const passphrase = formData.get("passphrase") as string;
  if (!passphrase || passphrase.length < 4) {
    return { error: "Passphrase must be at least 4 characters" };
  }

  const userCount = (
    sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as {
      count: number;
    }
  ).count;

  if (userCount === 0) {
    const userId = generateIdFromEntropySize(10);
    const hashedPassword = await hash(passphrase);
    sqlite
      .prepare(
        "INSERT INTO users (id, passphrase, hashed_password) VALUES (?, ?, ?)",
      )
      .run(userId, passphrase, hashedPassword);
    await createSession(userId);
    redirect("/");
  }

  const row = sqlite
    .prepare("SELECT id, hashed_password FROM users ORDER BY id ASC LIMIT 1")
    .get() as { id: string; hashed_password: string } | undefined;

  if (!row) {
    return { error: "Wrong passphrase" };
  }

  const valid = await verify(row.hashed_password, passphrase);
  if (!valid) {
    return { error: "Wrong passphrase" };
  }

  await createSession(row.id);
  redirect("/");
}

export async function signOutAction() {
  await signOut();
  redirect("/login");
}

export async function getSessionAction() {
  return await getSession();
}
