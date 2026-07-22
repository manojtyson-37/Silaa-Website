import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { variantById, resolveDiscount } from "@/lib/catalog";
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
  items: { variantId: number; title: string; size: string; price: number; qty: number }[];
  campaign?: { id: string; title: string; discountCode: string | null; discountValue: number } | null;
  payment?: { razorpayOrderId: string; razorpayPaymentId: string };
};

const ORDERS_DIR = path.join(process.cwd(), "orders");
const ORDERS_FILE = path.join(ORDERS_DIR, "orders.jsonl");

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
    if (price <= 0) {
      price = found.product.price || Number(found.product.variants[0]?.price || 0);
    }
    lines.push({
      variantId,
      title: found.product.title,
      size: found.variant.title,
      price,
      qty,
    });
    amountPaise += Math.round(price * 100) * qty;
  }
  
  // Apply discount if any
  const campaign = await resolveDiscount(discountCode);
  let campaignRecord: OrderRecord["campaign"] | null = null;
  
  if (campaign) {
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

  // Ensure amount doesn't go below zero
  amountPaise = Math.max(0, amountPaise);

  if (amountPaise < 100 && amountPaise > 0) return null; // Minimum Razorpay amount if not completely free
  return { lines, amountPaise, campaign: campaignRecord };
}

const PENDING_DIR = path.join(ORDERS_DIR, "pending");

function pendingPath(razorpayOrderId: string): string {
  // razorpay ids are alphanumeric with underscores; sanitize defensively
  return path.join(PENDING_DIR, razorpayOrderId.replace(/[^A-Za-z0-9_]/g, "") + ".json");
}

/** Stash cart + customer at order-creation time so /api/verify can finalize. */
export async function savePending(
  razorpayOrderId: string,
  data: { customer: Customer; items: OrderRecord["items"]; amount: number; campaign?: OrderRecord["campaign"] | null }
): Promise<void> {
  await fs.mkdir(PENDING_DIR, { recursive: true });
  await fs.writeFile(pendingPath(razorpayOrderId), JSON.stringify(data), "utf8");
}

export async function takePending(
  razorpayOrderId: string
): Promise<{ customer: Customer; items: OrderRecord["items"]; amount: number; campaign?: OrderRecord["campaign"] | null } | null> {
  try {
    const p = pendingPath(razorpayOrderId);
    const data = JSON.parse(await fs.readFile(p, "utf8"));
    await fs.unlink(p).catch(() => {});
    return data;
  } catch {
    return null;
  }
}

export async function saveOrder(
  order: Omit<OrderRecord, "ref" | "createdAt">
): Promise<string> {
  const ref = "SILA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  const record: OrderRecord = {
    ref,
    createdAt: new Date().toISOString(),
    ...order,
  };
  await fs.mkdir(ORDERS_DIR, { recursive: true });
  await fs.appendFile(ORDERS_FILE, JSON.stringify(record) + "\n", "utf8");
  return ref;
}
