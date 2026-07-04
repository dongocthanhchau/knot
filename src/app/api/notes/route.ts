import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createNoteAction as createNote,
  listNotesAction as listNotes,
  searchNotesAction as searchNotes,
} from "@/server/notes";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (query) {
      const results = await searchNotes(query);
      return NextResponse.json(results);
    }

    const notes = await listNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, pageSettings, fontPreferences } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    const note = await createNote(title, content, pageSettings, fontPreferences);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
