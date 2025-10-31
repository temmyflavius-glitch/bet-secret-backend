import fetch from "node-fetch";

const NOWPAYMENTS_BASE_URL =
  process.env.NOWPAYMENTS_MODE === "sandbox"
    ? "https://sandbox.nowpayments.io/api/v1"
    : "https://api.nowpayments.io/v1";

export async function createPayment(email, plan, price) {
  try {
    console.log(`📩 Creating payment for: ${email}, plan: ${plan}, price: ${price}`);

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

    // Log only useful info
    console.log("✅ NowPayments API response:", data);

    return data;
  } catch (error) {
    // Avoid circular reference crash
    console.error("❌ Error creating payment:", error?.message || error);
    return { status: false, message: "Error creating payment" };
  }
}
