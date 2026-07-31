import { requireAuth } from "@/lib/serverAuth";
import DashboardClient from "./DashboardClient";

export default async function Home() {
  const token = await requireAuth();
  return <DashboardClient token={token} />;
}
