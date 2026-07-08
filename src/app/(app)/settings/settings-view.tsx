"use client";

import { Download } from "lucide-react";
import { Button } from "@astryxdesign/core";

interface Stats {
  noteCount: number;
  tagCount: number;
  trashedCount: number;
  lastUpdated: string | null;
}

export function SettingsView({ stats }: { stats: Stats | null }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your preferences.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold">Database Stats</h2>
          <div className="mt-2 space-y-1 text-sm">
            {stats ? (
              <>
                <p>Active notes: <span className="font-medium">{stats.noteCount}</span></p>
                <p>Tags: <span className="font-medium">{stats.tagCount}</span></p>
                <p>Trashed notes: <span className="font-medium">{stats.trashedCount}</span></p>
                {stats.lastUpdated && (
                  <p>Last updated: <span className="font-medium">{new Date(stats.lastUpdated).toLocaleString()}</span></p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-base font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Theme settings are available in the header dropdown.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            Sign out from the header dropdown.
          </p>
        </div>
      </div>
    </div>
  );
}
