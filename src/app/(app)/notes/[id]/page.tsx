import { getNoteAction } from "@/server/notes";
import { notFound } from "next/navigation";
import { NoteEditorClient } from "./note-editor-client";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNoteAction(id);

  if (!note) notFound();

  return <NoteEditorClient note={note} />;
}
