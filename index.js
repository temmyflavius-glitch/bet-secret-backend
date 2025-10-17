require("dotenv").config();
console.log("✅ ENV CHECK:", {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  HAS_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
  NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET,
});

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/nowpayments-ipn", async (req, res) => {
  try {
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    const receivedSecret =
      req.headers["x-nowpayments-sig"] || req.body.ipn_secret;

    if (!receivedSecret || receivedSecret !== ipnSecret) {
      console.warn("❌ Unauthorized IPN attempt");
      return res.status(401).send("Invalid IPN secret");
    }

    const payment = req.body;
    const status = (payment.payment_status || "").toLowerCase();

    console.log("📩 NowPayments IPN:", payment);

    if (status === "finished" || status === "confirmed") {
      const orderId = payment.order_id;
      const email = orderId.split("-")[0] || "unknown";

      await db.collection("members").doc(email).set(
        {
          email,
          plan: payment.order_description.includes("yearly")
            ? "yearly"
            : "monthly",
          method: "crypto",
          paymentId: payment.payment_id,
          status: "active",
          activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await db.collection("pendingUsers").doc(email).delete();
      console.log(`✅ Activated member: ${email}`);
    } else {
      console.log(`⏳ Payment status: ${status} (not confirmed yet)`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ Error handling IPN:", err);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
