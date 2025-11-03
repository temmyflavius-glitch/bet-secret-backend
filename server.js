import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createPayment } from "./createPayment.js";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ======== Initialize Firebase Admin ========
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ======== Log current mode (sandbox or live) ========
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

// ======== NowPayments IPN Webhook ========
app.post("/nowpayments-ipn", async (req, res) => {
  try {
    const payment = req.body;
    console.log("📩 IPN received:", payment);

    // Verify payment completed
    if (payment.payment_status === "finished" || payment.payment_status === "confirmed") {
      const orderId = payment.order_id || "";
      const email = orderId.split("-")[0];

      console.log(`💰 Payment finished for ${email}`);

      // Find pending user by email
      const snapshot = await db.collection("pendyuser").where("email", "==", email).get();

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Move user to 'user' collection
        await db.collection("user").doc(userDoc.id).set(userData);
        await db.collection("pendyuser").doc(userDoc.id).delete();

        console.log(`✅ User ${email} moved from 'pendyuser' → 'user'`);
      } else {
        console.log(`⚠️ No pending user found for ${email}`);
      }
    } else {
      console.log(`ℹ️ Payment status is '${payment.payment_status}', not finished yet`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error processing IPN:", err);
    res.status(500).json({ success: false });
  }
});

// ======== Default Root Route ========
app.get("/", (req, res) => {
  res.send("✅ Bet Secret Backend is running successfully!");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
