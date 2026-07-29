import { api } from "@/lib/api";
import AbandonedCartsClient from "./AbandonedCartsClient";
import { Customer } from "@/lib/api";
import { requireAuth } from "@/lib/serverAuth";

export default async function AbandonedCartsPage() {
  const token = await requireAuth();
  const customers = await api.get<Customer[]>("/customers", token);
  
  // Flatten out all abandoned carts from all customers
  const carts = customers.flatMap((c: any) => 
    (c.abandoned_carts || []).map((cart: any) => ({ ...cart, customer: c }))
  );
  
  // Sort by drop off time descending
  carts.sort((a: any, b: any) => new Date(b.drop_off_time).getTime() - new Date(a.drop_off_time).getTime());

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abandoned Carts</h1>
          <p className="text-muted-foreground mt-2">
            View carts that were left before checkout completion.
          </p>
        </div>
      </div>
      <AbandonedCartsClient carts={carts} />
    </div>
  );
}
