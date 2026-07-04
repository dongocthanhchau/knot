import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNoteAction as getNote } from "@/server/notes";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";

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
    const content = note.content || "";

    const plainText = content.replace(/<[^>]*>/g, "");
    const paragraphs = plainText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
            }),
            ...paragraphs.map(
              (p) =>
                new Paragraph({
                  children: [new TextRun(p)],
                  spacing: { after: 200 },
                }),
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const mimeType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${title}.docx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/notes/[id]/export/docx error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
