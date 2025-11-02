import fetch from "node-fetch";

// Define mode (sandbox or live) from environment variable
const mode = process.env.NOWPAYMENT_MODE?.trim().toLowerCase() || "live";

const NOWPAYMENTS_BASE_URL =
  mode === "sandbox"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

console.log(`💡 NowPayments mode: ${mode.toUpperCase()}`);

export async function createPayment(email, plan, price) {
  try {
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

    // ✅ Fix invoice URL if in sandbox mode
    if (mode === "sandbox" && data.invoice_url) {
      data.invoice_url = data.invoice_url.replace(
        "https://nowpayments.io",
        "https://sandbox.nowpayments.io"
      );
    }

    console.log("✅ NowPayments API response:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creating payment:", error);
    return { status: false, message: "Error creating payment" };
  }
}
