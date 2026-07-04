import { NoteList } from "@/components/notes/note-list";

export default async function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            All your notes in the graph.
          </p>
        </div>
      </div>

      <NoteList />
    </div>
  );
}
