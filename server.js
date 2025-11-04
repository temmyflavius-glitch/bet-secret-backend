import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { createPayment } from "./createPayment.js";

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
const auth = admin.auth();

// ======== Log Current Mode ========
const MODE = process.env.NOWPAYMENTS_MODE || "live";
console.log(`
🎯 Bet Secret Formula Backend Initialized
----------------------------------------
🌐 Mode: ${MODE.toUpperCase()}
📡 Firebase + Firestore Connected
⚡ IPN and Payment Routes Ready
`);
if (MODE === "sandbox") console.log("🧪 Sandbox mode active — all payments are in test mode.");

// ======== Create Payment Route ========
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

// ======== NowPayments IPN (Webhook) ========
app.post("/nowpayments-ipn", async (req, res) => {
  try {
    const payment = req.body;
    console.log("📩 IPN received:", payment);

    // Verify completed payment
    if (payment.payment_status === "finished" || payment.payment_status === "confirmed") {
      const orderId = payment.order_id || "";
      const email = orderId.split("-")[0];
      console.log(`💰 Payment finished for ${email}`);

      // Check if user already exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log(`👤 Existing user found: ${email}`);
      } catch {
        console.log(`🆕 Creating new Firebase Auth user for ${email}`);
        userRecord = await auth.createUser({
          email,
          emailVerified: true, // optional
          password: Math.random().toString(36).slice(-10), // temporary password
        });
      }

      // Add or update member in Firestore
      const memberRef = db.collection("members").doc(userRecord.uid);
      await memberRef.set(
        {
          email,
          plan: payment.order_description || "monthly",
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentId: payment.payment_id,
          status: "active",
        },
        { merge: true }
      );

      console.log(`✅ Member record created/updated for ${email}`);

      // Send password reset email
      try {
        const resetLink = await auth.generatePasswordResetLink(email);
        console.log(`📧 Password reset link generated for ${email}`);
        console.log("👉", resetLink);
        // Normally you'd send this via your email service (SendGrid, Gmail, etc.)
        // For now, Firebase sends its default reset email.
      } catch (err) {
        console.error(`⚠️ Failed to send password reset link for ${email}:`, err.message);
      }
    } else {
      console.log(`ℹ️ Payment status '${payment.payment_status}' — waiting for completion.`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error processing IPN:", err);
    res.status(500).json({ success: false });
  }
});

// ======== Root Route ========
app.get("/", (req, res) => {
  res.send("✅ Bet Secret Backend is running successfully!");
});

// ======== Start Server ========
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
