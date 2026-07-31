import { requireAuth } from "@/lib/serverAuth";
import { PageHeader } from "@/components/ui";
import ExpenseClientWrapper from "./ExpenseClientWrapper";

export default async function ExpensesPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <PageHeader title="Expenses" subtitle="Salaries, commissions, inventory costs" />
      <ExpenseClientWrapper token={token} />
    </main>
  );
}
