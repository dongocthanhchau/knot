import { Tags } from "lucide-react";

export default async function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
        <p className="text-sm text-muted-foreground">
          Manage your note tags.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 flex flex-col items-center justify-center gap-3 text-center">
        <Tags className="h-8 w-8 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">No tags yet</h2>
          <p className="text-sm text-muted-foreground">
            Tags will appear here once you start adding them to your notes.
          </p>
        </div>
      </div>
    </div>
  );
}
