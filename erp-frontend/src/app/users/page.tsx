import { requireAuth } from "@/lib/serverAuth";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const token = await requireAuth();
  return <UsersClient token={token} />;
}
