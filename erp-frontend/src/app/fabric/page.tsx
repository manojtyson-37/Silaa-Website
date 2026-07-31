import { requireAuth } from "@/lib/serverAuth";
import NewFabricItemForm from "./NewFabricItemForm";
import FabricClient from "./FabricClient";

export default async function FabricPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex gap-4 mb-5">
        <NewFabricItemForm />
      </div>
      <FabricClient token={token} />
    </main>
  );
}
