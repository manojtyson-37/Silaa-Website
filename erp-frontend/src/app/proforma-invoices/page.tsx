import { requireAuth } from "@/lib/serverAuth";
import ProformaPageClient from "./ProformaPageClient";

export default async function ProformaInvoicesPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <ProformaPageClient token={token} />
    </main>
  );
}
