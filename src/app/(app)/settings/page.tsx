export default async function SettingsPage() {
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
