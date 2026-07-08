import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint: PUT binary data → GET it back (no auth, for testing)
 */
export async function PUT(request: NextRequest) {
  try {
    const raw = await request.arrayBuffer();
    const size = raw.byteLength;
    const view = new Uint8Array(raw);
    const preview = Array.from(view.slice(0, Math.min(32, size)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    console.log(`[debug PUT] received ${size} bytes, header: ${preview}`);

    // Return that roundtrip works
    return NextResponse.json({
      ok: true,
      size,
      headerBytesHex: preview,
    });
  } catch (e) {
    console.error("[debug PUT] error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same as PUT but also echoes the body back
  try {
    const raw = await request.arrayBuffer();
    const view = new Uint8Array(raw);
    console.log(`[debug POST] received ${raw.byteLength} bytes`);

    return new NextResponse(raw, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Debug-Size": String(raw.byteLength),
        "X-Debug-First-Bytes": Array.from(view.slice(0, Math.min(16, raw.byteLength)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" "),
      },
    });
  } catch (e) {
    console.error("[debug POST] error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
