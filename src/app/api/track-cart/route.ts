import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Call the ERP backend
    const ERP_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.silacollective.in";
    
    const res = await fetch(`${ERP_URL}/customers/track-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      console.error("Failed to track cart:", await res.text());
      return NextResponse.json({ error: "Failed to track" }, { status: 500 });
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Cart track error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
