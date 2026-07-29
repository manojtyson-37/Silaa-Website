import { api, Customer } from "@/lib/api";
import { PageHeader, Card } from "@/components/ui";
import { requireAuth } from "@/lib/serverAuth";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const token = await requireAuth();
  const customers = (await api.get<Customer[]>("/customers", token)) || [];

  return (
    <main className="max-w-6xl mx-auto px-8 py-10">
      <PageHeader
        title="Customers & CRM"
        subtitle={`${customers.length} customer${customers.length === 1 ? "" : "s"} tracked`}
      />
      {customers.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          No customers recorded yet.
        </Card>
      ) : (
        <CustomersClient customers={customers} />
      )}
    </main>
  );
}
