import { requireAuth } from "@/lib/serverAuth";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const token = await requireAuth();
  return <ReportsClient token={token} />;
}
