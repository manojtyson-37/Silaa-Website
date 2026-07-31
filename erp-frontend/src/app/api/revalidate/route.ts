import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/serverAuth";
import { decodeToken } from "@/lib/api";

const KNOWN_TAGS = new Set(["customers", "users"]);

export async function POST(req: NextRequest) {
  const token = await requireAuth();
  if (decodeToken(token).role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { tag } = await req.json();
  if (typeof tag !== "string" || !KNOWN_TAGS.has(tag)) {
    return NextResponse.json({ error: "unknown tag" }, { status: 400 });
  }
  revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
