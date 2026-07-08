import { getStatsAction } from "@/server/notes";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const stats = await getStatsAction();

  return <SettingsView stats={stats} />;
}
