import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTrashNotesAction as listTrashNotes } from "@/server/notes";

export async function GET(_request: NextRequest) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await listTrashNotes();
    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/trash error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
