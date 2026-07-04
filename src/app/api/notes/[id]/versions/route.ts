import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listVersionsAction as listVersions,
  createVersionAction as createVersion,
} from "@/server/notes";

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
    const versions = await listVersions(id);
    return NextResponse.json(versions);
  } catch (error) {
    console.error("GET /api/notes/[id]/versions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const version = await createVersion(id);
    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes/[id]/versions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
