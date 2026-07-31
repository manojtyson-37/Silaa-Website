import { requireAuth } from "@/lib/serverAuth";
import NewStyleForm from "./NewStyleForm";
import StylesClient from "./StylesClient";

export default async function StylesPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <NewStyleForm />
      <StylesClient token={token} />
    </main>
  );
}
