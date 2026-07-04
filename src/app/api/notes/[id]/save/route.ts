import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveNoteAction as saveNote } from "@/server/notes";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, lastSavedAt, pageSettings, fontPreferences } = body;

    const result = await saveNote(id, title, content, lastSavedAt, pageSettings, fontPreferences);

    if ("error" in result && result.error === "Conflict") {
      return NextResponse.json(
        { error: "Conflict", serverUpdatedAt: result.serverUpdatedAt },
        { status: 409 },
      );
    }

    return NextResponse.json({ updatedAt: result.updatedAt });
  } catch (error) {
    console.error("POST /api/notes/[id]/save error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
