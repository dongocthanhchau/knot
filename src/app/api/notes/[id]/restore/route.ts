import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { restoreNoteAction as restoreNote } from "@/server/notes";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await restoreNote(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/notes/[id]/restore error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
