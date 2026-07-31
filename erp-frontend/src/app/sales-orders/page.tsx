import { requireAuth } from "@/lib/serverAuth";
import InvoicesPageClient from "./InvoicesPageClient";

export default async function SalesOrdersPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <InvoicesPageClient token={token} />
    </main>
  );
}
