import { requireAuth } from "@/lib/serverAuth";
import AbandonedCartsClient from "./AbandonedCartsClient";

export default async function AbandonedCartsPage() {
  const token = await requireAuth();
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abandoned Carts</h1>
          <p className="text-muted-foreground mt-2">View carts that were left before checkout completion.</p>
        </div>
      </div>
      <AbandonedCartsClient token={token} />
    </div>
  );
}
