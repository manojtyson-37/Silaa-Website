import { priceItems, saveOrder, Customer } from "../src/lib/orders";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

async function run() {
  console.log("Simulating an order to verify discount and ERP sync...");

  const mockCustomer: Customer = {
    name: "Test User",
    phone: "9999999999",
    email: "test@example.com",
    address: "123 Test Street",
    city: "Test City",
    pincode: "123456",
  };

  // 1. Fetch a product from Sanity that has an erpVariantId, or just mock one.
  // Wait, priceItems() validates against Sanity! We need to pass the real variant ID.
  const { allProducts, activeCampaigns } = await import("../src/lib/catalog");
  const products = await allProducts();
  
  let targetVariantId: number | null = null;
  for (const p of products) {
    const v = p.variants.find(v => v.erpVariantId != null);
    if (v) {
      targetVariantId = v.id;
      break;
    }
  }

  if (!targetVariantId) {
    console.log("No product with erpVariantId found! Creating a fallback one or you need to run syncSanityToErp.ts first.");
    targetVariantId = products[0]?.variants[0]?.id;
    if (!targetVariantId) {
      console.error("No products found in Sanity at all!");
      process.exit(1);
    }
  }

  console.log(`Using Sanity Variant ID: ${targetVariantId}`);

  const mockItems = [
    { variantId: targetVariantId, qty: 2 }
  ];

  const campaigns = await activeCampaigns();
  const testCode = campaigns.find(c => c.discountCode)?.discountCode || undefined;
  if (testCode) console.log(`Found active campaign code: ${testCode}`);
  
  console.log("Pricing items...");
  const priced = await priceItems(mockItems, testCode);

  if (!priced) {
    console.error("Failed to price items. Ensure the variant is available.");
    process.exit(1);
  }

  console.log(`Priced lines:`, priced.lines);
  console.log(`Campaign applied:`, priced.campaign);
  console.log(`Total Amount (paise):`, priced.amountPaise);
  console.log(`Total Amount (INR):`, priced.amountPaise / 100);

  // 2. Call saveOrder which triggers the ERP Sync
  console.log("Saving order to ERP...");
  
  const mockRazorpayId = `TEST_RZP_${Math.floor(Math.random() * 1000000)}`;

  const orderRef = await saveOrder({
    method: "prepaid",
    status: "paid",
    amount: priced.amountPaise / 100, // Amount in INR
    customer: mockCustomer,
    items: priced.lines,
    campaign: priced.campaign,
    payment: {
      razorpayOrderId: mockRazorpayId,
      razorpayPaymentId: `TEST_PAY_${Math.floor(Math.random() * 1000000)}`
    }
  });

  console.log(`Order saved locally with reference: ${orderRef}`);
  console.log("Check the ERP Sales Orders page to verify the order arrived with the correct discounted total!");
}

run().catch(console.error);
