import { api, ProformaInvoice } from "@/lib/api";
import { requireAuth } from "@/lib/serverAuth";
import { notFound } from "next/navigation";
import ProformaPrintClient from "./ProformaPrintClient";

type CompanySetting = { key: string; value: string };

export default async function ProformaPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await requireAuth();

  let pi: ProformaInvoice;
  try {
    pi = await api.get<ProformaInvoice>(`/proforma-invoices/${id}`, token);
  } catch {
    notFound();
  }

  const settings = await api.get<CompanySetting[]>("/company-settings", token).catch(() => [] as CompanySetting[]);
  const settingMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

  return <ProformaPrintClient pi={pi} settings={settingMap} />;
}
