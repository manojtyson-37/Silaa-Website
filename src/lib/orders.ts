import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { variantById } from "@/lib/catalog";

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
export function priceItems(items: unknown):
  | { lines: OrderRecord["items"]; amountPaise: number }
  | null {
  if (!Array.isArray(items) || items.length === 0 || items.length > 30) return null;
  const lines: OrderRecord["items"] = [];
  let amountPaise = 0;
  for (const raw of items) {
    const variantId = Number((raw as Record<string, unknown>)?.variantId);
    const qty = Math.floor(Number((raw as Record<string, unknown>)?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 10) return null;
    const found = variantById(variantId);
    if (!found || !found.variant.available) return null;
    const price = Number(found.variant.price);
    lines.push({
      variantId,
      title: found.product.title,
      size: found.variant.title,
      price,
      qty,
    });
    amountPaise += Math.round(price * 100) * qty;
  }
  if (amountPaise < 100) return null;
  return { lines, amountPaise };
}

const PENDING_DIR = path.join(ORDERS_DIR, "pending");

function pendingPath(razorpayOrderId: string): string {
  // razorpay ids are alphanumeric with underscores; sanitize defensively
  return path.join(PENDING_DIR, razorpayOrderId.replace(/[^A-Za-z0-9_]/g, "") + ".json");
}

/** Stash cart + customer at order-creation time so /api/verify can finalize. */
export async function savePending(
  razorpayOrderId: string,
  data: { customer: Customer; items: OrderRecord["items"]; amount: number }
): Promise<void> {
  await fs.mkdir(PENDING_DIR, { recursive: true });
  await fs.writeFile(pendingPath(razorpayOrderId), JSON.stringify(data), "utf8");
}

export async function takePending(
  razorpayOrderId: string
): Promise<{ customer: Customer; items: OrderRecord["items"]; amount: number } | null> {
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
