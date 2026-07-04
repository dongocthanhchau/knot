import Link from "next/link";
import { FileText, Plus } from "lucide-react";

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

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 flex flex-col items-center justify-center gap-3 text-center">
        <FileText className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">No notes yet</h2>
          <p className="text-sm text-muted-foreground">
            Your notes will appear here once you start creating them.
          </p>
        </div>
      </div>
    </div>
  );
}
