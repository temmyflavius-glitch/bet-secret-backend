import fetch from "node-fetch";

export default async function createPayment(req, res) {
  try {
    const { email, plan, price } = req.body;
    console.log("📩 Creating payment for:", { email, plan, price });

    // Determine environment (sandbox or live)
    const isSandbox = process.env.NOWPAYMENTS_MODE === "sandbox";

    // Choose correct endpoint
    const apiUrl = isSandbox
      ? "https://api-sandbox.nowpayments.io/v1/payment"
      : "https://api.nowpayments.io/v1/payment";

    // Choose correct payment redirect base URL
    const paymentBaseUrl = isSandbox
      ? "https://sandbox.nowpayments.io/payment/"
      : "https://nowpayments.io/payment/";

    const response = await fetch(apiUrl, {
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
        is_fixed_rate: true,
        ipn_callback_url: "https://bet-secret-backend-1.onrender.com/nowpayments-ipn",
        success_url: "https://bet-secret-formula.web.app/thankyou.html",
        cancel_url: "https://bet-secret-formula.web.app/payment-failed.html",
      }),
    });

    const data = await response.json();
    console.log("✅ NowPayments API response:", data);

    // Construct correct payment URL
    const paymentUrl = data.invoice_url
      ? data.invoice_url
      : `${paymentBaseUrl}${data.payment_id}`;

    res.status(200).json({ url: paymentUrl });
  } catch (error) {
    console.error("💥 Payment creation failed:", error);
    res.status(500).json({ error: "Payment creation failed" });
  }
}
