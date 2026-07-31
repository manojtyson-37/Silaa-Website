import { requireAuth } from "@/lib/serverAuth";
import { ProductionOrderClientWrapper } from "./ProductionOrderClientWrapper";

export default async function ProductionOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await requireAuth();
  return <ProductionOrderClientWrapper id={id} token={token} />;
}
