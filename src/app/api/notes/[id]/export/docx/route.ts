import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNoteAction as getNote } from "@/server/notes";
import { sqlite } from "@/db";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

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

    const title = note.title || "Untitled";

    // Return stored DOCX blob if available
    const row = sqlite.prepare("SELECT content_docx FROM notes WHERE id = ?").get(id) as
      | { content_docx: Buffer | null }
      | undefined;

    if (row?.content_docx) {
      return new NextResponse(new Uint8Array(row.content_docx), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${title}.docx"`,
        },
      });
    }

    // Fallback: build a minimal DOCX from extracted text
    const content = note.content || "";
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: content })] }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${title}.docx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/notes/[id]/export/docx error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
