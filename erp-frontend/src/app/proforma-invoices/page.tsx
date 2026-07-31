import { api, ProformaInvoice } from "@/lib/api";
import { requireAuth } from "@/lib/serverAuth";
import ProformaPageClient from "./ProformaPageClient";

export default async function ProformaInvoicesPage() {
  const token = await requireAuth();
  const invoices = await api.get<ProformaInvoice[]>("/proforma-invoices", token).catch(() => [] as ProformaInvoice[]);
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <ProformaPageClient invoices={invoices} />
    </main>
  );
}
