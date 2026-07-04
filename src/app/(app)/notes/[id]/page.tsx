import { FileText } from "lucide-react";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>Note</span>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Note Editor</h1>
      <p className="text-sm text-muted-foreground">
        Editing note:{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{id}</code>
      </p>
      <div className="rounded-lg border bg-card p-6 shadow-sm min-h-[300px]">
        <p className="text-muted-foreground">
          The rich-text editor will be implemented in the next milestone.
        </p>
      </div>
    </div>
  );
}
