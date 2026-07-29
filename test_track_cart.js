const fetch = require("node-fetch");

async function testTrackCart() {
  const payload = {
    customer: {
      name: "Test User",
      email: "test@example.com",
      phone: "9876543210",
      address: "123 Test St",
      city: "Test City",
      pincode: "123456"
    },
    items: [
      { variantId: 45, qty: 1 }
    ]
  };

  try {
    const res = await fetch("/customers/track-cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}

testTrackCart();
