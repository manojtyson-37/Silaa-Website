import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type: string; slug?: { current?: string } }>(
      req,
      process.env.SANITY_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      return new NextResponse("Invalid Signature", { status: 401 });
    }

    if (!body?._type) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Always revalidate the homepage and the shop page since product data might appear there
    revalidatePath("/");
    revalidatePath("/shop");

    // Revalidate specific product pages if a slug is provided
    if (body._type === "product" && body.slug?.current) {
      revalidatePath(`/product/${body.slug.current}`);
    }

    return NextResponse.json({ status: 200, revalidated: true, now: Date.now(), body });
  } catch (err: any) {
    console.error(err);
    return new NextResponse(err.message, { status: 500 });
  }
}
