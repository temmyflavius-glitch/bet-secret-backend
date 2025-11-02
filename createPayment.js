import fetch from "node-fetch";

// Detect sandbox or live mode
const isSandbox = process.env.NOWPAYMENTS_MODE?.trim().toLowerCase() === "sandbox";

const NOWPAYMENTS_BASE_URL = isSandbox
  ? "https://api-sandbox.nowpayments.io/v1"
  : "https://api.nowpayments.io/v1";

console.log(`💡 NowPayments mode: ${isSandbox ? "SANDBOX" : "LIVE"}`);
if (isSandbox) {
  console.log("🧪 Sandbox mode active — all payments are in test mode.");
}

export async function createPayment(email, plan, price) {
  try {
    console.log("📩 Creating payment with body:", { email, plan, price });

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: price,
        price_currency: "usd",
        pay_currency: "btc",
        order_id: `${email}-${plan}`,
        order_description: plan,
        ipn_callback_url: "https://bet-secret-backend-1.onrender.com/nowpayments-ipn",
        success_url: "https://10bet-secret-formula-79c3a.web.app/success",
        cancel_url: "https://10bet-secret-formula-79c3a.web.app/cancel",
      }),
    });

    const data = await response.json();
    console.log("✅ NowPayments API response:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    return { status: false, message: "Error creating payment" };
  }
}
