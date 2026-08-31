import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings - Silaa ERP",
};

export default function SettingsPage() {
  return (
    <main className="p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage global configuration and integrations.</p>
        </div>
        <SettingsClient />
      </div>
    </main>
  );
}
