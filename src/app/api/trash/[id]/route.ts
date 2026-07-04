import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { permanentlyDeleteNoteAction as permanentlyDeleteNote } from "@/server/notes";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await permanentlyDeleteNote(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/trash/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
