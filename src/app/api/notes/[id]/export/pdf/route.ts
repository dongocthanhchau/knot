import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getNoteAction as getNote } from "@/server/notes";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        @page { margin: 20mm; }
        body { font-family: serif; max-width: 210mm; margin: 0 auto; padding: 20mm; color: #333; }
        h1 { font-size: 24pt; margin-bottom: 12pt; }
        p { font-size: 12pt; line-height: 1.6; margin-bottom: 8pt; }
      </style>
    </head><body>
      <h1>${escapeHtml(title)}</h1>
      <div>${content || ""}</div>
      <script>window.print()</script>
    </body></html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("GET /api/notes/[id]/export/pdf error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
