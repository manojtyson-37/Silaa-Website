"use server";

import { cookies } from "next/headers";

// ERP_BACKEND_URL: full prefix including /api/erp, no trailing slash.
const BASE =
  process.env.ERP_BACKEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://silaa-website.vercel.app/api/erp"
    : "http://localhost:8000");

export async function loginAction(username: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return "Invalid credentials";

  const { access_token } = await res.json();
  const store = await cookies();
  store.set("silaa_token", access_token, {
    httpOnly: false, // client form components also need to read this for direct browser->backend fetches
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return null;
}
