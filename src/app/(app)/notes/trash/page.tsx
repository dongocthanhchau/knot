import { TrashList } from "@/components/notes/trash-list";

export default async function TrashPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
          <p className="text-sm text-muted-foreground">
            Deleted notes can be restored or permanently deleted.
          </p>
        </div>
      </div>

      <TrashList />
    </div>
  );
}
