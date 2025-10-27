// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import createPayment from "./createPayment.js";

dotenv.config();

// ✅ Initialize Firebase Admin using environment variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf8")
);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}


const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("🚀 Bet Secret backend is running...");
});

// ✅ Payment route
app.post("/create-payment", createPayment);

// ✅ Subscribe by Book Purchase
app.post("/subscribe-book-purchase", async (req, res) => {
  try {
    const { email, platform, transactionId, proofUrl } = req.body;

    if (!email || !platform || !transactionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store in Firestore for admin review
    await db.collection("pendingBookSubscribers").doc(email).set({
      email,
      platform,
      transactionId,
      proofUrl: proofUrl || null,
      status: "pending",
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`📚 Book purchase submitted by ${email}`);
    res.status(200).json({ success: true, message: "Purchase submitted for review" });

  } catch (err) {
    console.error("❌ Error submitting book purchase:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
