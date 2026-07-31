import { requireAuth } from "@/lib/serverAuth";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-6xl mx-auto px-8 py-10">
      <CustomersClient token={token} />
    </main>
  );
}
