// createPayment.js
import fetch from "node-fetch";

export default async function createPayment(req, res) {
  try {
    const { email, plan, price } = req.body;
    console.log("📩 Creating payment for:", { email, plan, price });

    const response = await fetch("https://api-sandbox.nowpayments.io/v1/payment", {
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
        success_url: "https://bet-secret.online/thank-you.html",
        cancel_url: "https://bet-secret.online/payment-failed.html",
      }),
    });

    const data = await response.json();
    console.log("✅ NowPayments API response:", data);

    if (!response.ok) {
      console.error("❌ NowPayments error:", data);
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("💥 Payment creation failed:", error);
    res.status(500).json({ error: "Payment creation failed" });
  }
}
