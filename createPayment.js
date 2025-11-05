import fetch from "node-fetch";

const mode = process.env.NOWPAYMENTS_MODE || "live";
const NOWPAYMENTS_BASE_URL =
  mode === "sandbox"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

console.log(`💡 NowPayments mode: ${mode.toUpperCase()}`);
if (mode === "sandbox") console.log("🧪 Sandbox mode active — all payments are in test mode.");

/**
 * Create NowPayments invoice
 * @param {string} email - user email
 * @param {string} plan - selected plan (e.g., "monthly")
 * @param {number} price - plan price in USD
 * @param {string} [successUrl] - optional redirect URL after successful payment
 */
export async function createPayment(email, plan, price, successUrl) {
  try {
    const paymentBody = {
      price_amount: price,
      price_currency: "USD",
      pay_currency: "BTC",
      order_id: `${email}-${plan}`,
      order_description: plan,
      ipn_callback_url: "https://bet-secret-backend-1.onrender.com/nowpayments-ipn",
      success_url:
        success_url: `https://bet-secret-formula-79c3a.web.app/reset?email=${encodeURIComponent(email)}`,
      cancel_url: "https://bet-secret-formula-79c3a.web.app/cancel",
    };

    console.log("📩 Creating payment with body:", paymentBody);

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await response.json();
    console.log("✅ NowPayments API response:", data);

    return data;
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    return { status: false, message: "Error creating payment" };
  }
}
