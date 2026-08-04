import crypto from "crypto";
import { variantById, resolveDiscount, price as productPrice } from "@/lib/catalog";
import type { Campaign } from "@/lib/catalog";

export type OrderItem = { variantId: number; qty: number };

export type Customer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  pincode: string;
};

export type OrderRecord = {
  ref: string;
  createdAt: string;
  method: "cod" | "prepaid";
  status: "pending" | "paid";
  amount: number;
  customer: Customer;
  items: { variantId: number; erpVariantId?: number; title: string; size: string; price: number; qty: number }[];
  campaign?: { id: string; title: string; discountCode: string | null; discountValue: number } | null;
  payment?: { razorpayOrderId: string; razorpayPaymentId: string };
};

const ERP_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://silaa-website.vercel.app";
const INTERNAL_KEY = process.env.ERP_INTERNAL_KEY ?? "";

export function validateCustomer(c: unknown): Customer | null {
  if (!c || typeof c !== "object") return null;
  const o = c as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const customer: Customer = {
    name: str(o.name).slice(0, 120),
    phone: str(o.phone).replace(/\D/g, "").slice(-10),
    email: str(o.email).slice(0, 200) || undefined,
    address: str(o.address).slice(0, 500),
    city: str(o.city).slice(0, 100) || undefined,
    pincode: str(o.pincode).slice(0, 6),
  };
  if (customer.name.length < 2) return null;
  if (!/^\d{10}$/.test(customer.phone)) return null;
  if (customer.address.length < 6) return null;
  if (!/^\d{6}$/.test(customer.pincode)) return null;
  return customer;
}

/** Validate items against catalog; returns priced lines + total paise, or null. */
export async function priceItems(items: unknown, discountCode?: string):
  Promise<| { lines: OrderRecord["items"]; amountPaise: number; campaign: OrderRecord["campaign"] | null }
  | null> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) return null;
  const lines: OrderRecord["items"] = [];
  let amountPaise = 0;
  for (const raw of items) {
    const variantId = Number((raw as Record<string, unknown>)?.variantId);
    const qty = Math.floor(Number((raw as Record<string, unknown>)?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 10) return null;
    const found = await variantById(variantId);
    if (!found || !found.variant.available) return null;
    let price = Number(found.variant.price);
    if (!Number.isFinite(price) || price <= 0) {
      price = productPrice(found.product);
    }
    if (price <= 0) return null;
    lines.push({
      variantId,
      erpVariantId: found.variant.erpVariantId,
      title: found.product.title,
      size: found.variant.title,
      price,
      qty,
      // @ts-ignore - temporary attachment for category validation
      _category: found.product.category
    });
    amountPaise += Math.round(price * 100) * qty;
  }
  
  // Apply discount if any
  const campaign = await resolveDiscount(discountCode);
  let campaignRecord: OrderRecord["campaign"] | null = null;
  
  if (campaign) {
    let isEligible = true;
    if (campaign.minPurchaseAmount && (amountPaise / 100) < campaign.minPurchaseAmount) {
      isEligible = false;
    }
    if (isEligible && campaign.allowedCategories && campaign.allowedCategories.length > 0) {
      // @ts-ignore
      const hasAllowedCategory = lines.some((line) => campaign.allowedCategories!.includes(line._category || ""));
      if (!hasAllowedCategory) {
        isEligible = false;
      }
    }

    if (isEligible) {
      campaignRecord = {
        id: campaign.id,
        title: campaign.title,
        discountCode: campaign.discountCode,
        discountValue: campaign.discountValue,
      };
      
      if (campaign.discountType === "percentage") {
        amountPaise = amountPaise - (amountPaise * (campaign.discountValue / 100));
      } else if (campaign.discountType === "fixed") {
        amountPaise = amountPaise - (campaign.discountValue * 100);
      }
    }
  }

  // Clean up the temporary attachment
  // @ts-ignore
  lines.forEach(l => delete l._category);

  // Ensure amount doesn't go below zero
  amountPaise = Math.max(0, amountPaise);

  if (amountPaise < 100 && amountPaise > 0) return null; // Minimum Razorpay amount if not completely free
  return { lines, amountPaise, campaign: campaignRecord };
}

/** Stash cart + customer at order-creation time so /api/verify can finalize.
 *  Uses ERP DB (Supabase) instead of filesystem so Razorpay callbacks land on any serverless instance. */
export async function savePending(
  razorpayOrderId: string,
  data: { customer: Customer; items: OrderRecord["items"]; amount: number; campaign?: OrderRecord["campaign"] | null }
): Promise<void> {
  const res = await fetch(`${ERP_BASE}/api/erp/pending-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Internal-Key": INTERNAL_KEY },
    body: JSON.stringify({ razorpay_order_id: razorpayOrderId, payload: data }),
  });
  if (!res.ok) throw new Error(`savePending failed: ${res.status}`);
}

export async function takePending(
  razorpayOrderId: string
): Promise<{ customer: Customer; items: OrderRecord["items"]; amount: number; campaign?: OrderRecord["campaign"] | null } | null> {
  try {
    const res = await fetch(`${ERP_BASE}/api/erp/pending-orders/${encodeURIComponent(razorpayOrderId)}`, {
      method: "DELETE",
      headers: { "X-Internal-Key": INTERNAL_KEY },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`takePending failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("takePending error — verified payment may be unsynced:", err);
    return null;
  }
}

import { client as sanityClient } from "@/sanity/lib/client";

export async function saveOrder(
  order: Omit<OrderRecord, "ref" | "createdAt">
): Promise<string> {
  const ref = "SILA-" + crypto.randomBytes(4).toString("hex").toUpperCase();

  // Handle auto-disabling or usage increments for campaigns
  if (order.campaign && process.env.SANITY_API_WRITE_TOKEN) {
    try {
      // Create a write client
      const { projectId, dataset, apiVersion } = sanityClient.config();
      const { createClient } = await import("next-sanity");
      const writeClient = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false,
        token: process.env.SANITY_API_WRITE_TOKEN,
      });

      const camp = await writeClient.fetch(`*[_type == "campaign" && _id == $id][0]`, { id: order.campaign.id });
      if (camp) {
        if (camp.oneTimeUse) {
          await writeClient.patch(camp._id).set({ isActive: false }).commit();
        } else if (camp.maxUses) {
          const currentCount = camp.usageCount || 0;
          const newCount = currentCount + 1;
          const patch = writeClient.patch(camp._id).inc({ usageCount: 1 });
          if (newCount >= camp.maxUses) {
            patch.set({ isActive: false });
          }
          await patch.commit();
        }
      }
    } catch (e) {
      console.error("Failed to mutate campaign usage in Sanity:", e);
    }
  }

  // Auto-Sync order to Silaa ERP (if erpVariantIds are present)
  try {
    const ERP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const ADMIN_USER = process.env.ERP_ADMIN_USERNAME || "admin";
    const ADMIN_PASS = process.env.ERP_ADMIN_PASSWORD;

    // Fail closed: guessing "admin" only ever produced a failed login attempt
    // against the live ERP on every order.
    if (!ADMIN_PASS) {
      console.error("ERP_ADMIN_PASSWORD is not set — skipping ERP order sync for", ref);
      return ref;
    }

    // 1. Login to ERP
    const loginRes = await fetch(`${ERP_URL}/api/erp/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    });
    
    if (loginRes.ok) {
      const { access_token } = await loginRes.json();
      
      // 2. Prepare Payload
      const totalOriginalPrice = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const discountRatio = totalOriginalPrice > 0 ? order.amount / totalOriginalPrice : 1;

      const orderLines = order.items
        .filter(item => item.erpVariantId) // Only sync items that have been mapped
        .map(item => ({
          variant_id: item.erpVariantId,
          qty: item.qty,
          unit_price: Number((item.price * discountRatio).toFixed(2)),
          gst_percent: 5 // Default GST
        }));
        
      const unmappedItems = order.items.filter(item => !item.erpVariantId);
      let finalAddress = order.customer.address;
      if (unmappedItems.length > 0) {
        const unmappedStr = unmappedItems.map(i => `${i.title} (Qty: ${i.qty})`).join(", ");
        finalAddress = `${finalAddress}\n\n[WARNING: Order contains items missing from ERP catalogue: ${unmappedStr}]`;
      }

      const rawItemsStr = order.items.map(i => `${i.title} (Qty: ${i.qty})`).join(", ");

      const payload = {
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        customer_address: finalAddress,
        customer_state: order.customer.city || "Website Order",
        category: "B2C",
        campaign_id: order.campaign?.id || null,
        lines: orderLines,
        created_by: "Website Integration",
        razorpay_order_id: order.payment?.razorpayOrderId || null,
        raw_items: rawItemsStr,
        total_amount: order.amount / 100, // Convert from paise to rupees
        discount_amount: order.campaign?.discountValue ? order.campaign.discountValue / 100 : null,
        discount_code: order.campaign?.discountCode || null,
      };

      // 3. Post to ERP
        await fetch(`${ERP_URL}/api/erp/sales-orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${access_token}`
          },
          body: JSON.stringify(payload),
        });
    }
  } catch (e) {
    console.error("Failed to sync order to ERP:", e);
  }

  return ref;
}
