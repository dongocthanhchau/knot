import { FileText, Tags, Brain, Activity } from "lucide-react";
import { listNotesAction } from "@/server/notes";
import { listTagsAction } from "@/server/tags";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="p-6 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const [notes, tags] = await Promise.all([listNotesAction(), listTagsAction()]);
  const today = new Date().toISOString().slice(0, 10);
  const recentActivity = notes.filter((n) => n.updatedAt >= today).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to Knot — your local-first knowledge graph.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Notes"
          value={String(notes.length)}
          icon={FileText}
          description="Notes in your graph"
        />
        <StatCard
          title="Tags"
          value={String(tags.length)}
          icon={Tags}
          description="Active tags"
        />
        <StatCard
          title="Connections"
          value="—"
          icon={Brain}
          description="Wiki links"
        />
        <StatCard
          title="Recent Activity"
          value={String(recentActivity)}
          icon={Activity}
          description="Updates today"
        />
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
        <p className="text-sm text-muted-foreground">
          Semantic search, wiki synthesis, agentic chat, and graph visualization
          will appear here.
        </p>
      </div>
    </div>
  );
}
