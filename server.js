import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createPayment } from "./createPayment.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Log current mode (sandbox or live)
const MODE = process.env.NOWPAYMENTS_MODE || "live";
console.log(`💡 NowPayments mode: ${MODE.toUpperCase()}`);
if (MODE === "sandbox") {
  console.log("🧪 Sandbox mode active — all payments are in test mode.");
}

// ======== Create Crypto Payment Route ========
app.post("/create-payment", async (req, res) => {
  try {
    const { email, plan, price } = req.body;

    console.log("📩 Creating payment with body:", req.body);

    if (!email || !plan || !price) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: email, plan, or price",
      });
    }

    const result = await createPayment(email, plan, price);
    console.log("✅ Payment creation result:", result);
    res.json(result);
  } catch (error) {
    console.error("❌ Error in /create-payment:", error);
    res.status(500).json({
      status: false,
      message: "Server error creating payment",
    });
  }
});

// ======== Default Root Route ========
app.get("/", (req, res) => {
  res.send("✅ Bet Secret Backend is running successfully!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
