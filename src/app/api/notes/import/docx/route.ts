import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sqlite } from "@/db";
import { generateIdFromEntropySize } from "lucia";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filename = request.headers.get("X-Filename") || "Untitled";
    if (!filename.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only .docx files are supported" }, { status: 400 });
    }

    // Read raw binary directly — no JSON, no FormData, no base64
    const docxBuffer = Buffer.from(await request.arrayBuffer());
    const title = filename.replace(/\.docx$/i, "");

    const id = generateIdFromEntropySize(10);
    const now = new Date().toISOString();

    sqlite
      .prepare(
        "INSERT INTO notes (id, title, content_docx, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, title, docxBuffer, now, now);

    return NextResponse.json({ id, title, createdAt: now });
  } catch (error) {
    console.error("POST /api/notes/import/docx error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
