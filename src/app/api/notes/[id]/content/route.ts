import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNoteAction as getNote } from "@/server/notes";
import { sqlite } from "@/db";
import mammoth from "mammoth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const note = await getNote(id);

    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Read raw BLOB from database
    const row = sqlite
      .prepare("SELECT content_docx FROM notes WHERE id = ?")
      .get(id) as { content_docx: Uint8Array | null } | undefined;

    if (!row?.content_docx) {
      // No binary content yet — return empty
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(Buffer.from(row.content_docx), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `inline; filename="content.docx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/notes/[id]/content error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify note exists and belongs to user
    const note = await getNote(id);
    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Read raw binary body
    const docxBuffer = await request.arrayBuffer();

    // Extract plain text from DOCX using mammoth
    let extractedText: string | null = null;
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(docxBuffer) });
      extractedText = result.value;
    } catch {
      // Fail silently — text extraction is best-effort
    }

    const now = new Date().toISOString();

    sqlite
      .prepare("UPDATE notes SET content_docx = ?, updated_at = ?, content = ? WHERE id = ?")
      .run(Buffer.from(docxBuffer), now, extractedText, id);

    return NextResponse.json({ updatedAt: now, extractedText });
  } catch (error) {
    console.error("PUT /api/notes/[id]/content error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
