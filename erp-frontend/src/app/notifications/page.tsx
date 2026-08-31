import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notifications - Silaa ERP",
};

export default function NotificationsPage() {
  return (
    <main className="p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Recent alerts and system notifications.</p>
        </div>
        <NotificationsClient />
      </div>
    </main>
  );
}
