// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createPayment } from "./createPayment.js";


dotenv.config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: "*", // Allow all origins (you can restrict later)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));
app.use(express.json());

// ✅ Root route
app.get("/", (req, res) => {
  res.json({ message: "✅ Bet Secret Backend is running fine!" });
});

// ✅ Payment route
app.post("/create-payment", createPayment);

// ✅ Health check route (useful for Render)
app.get("/status", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// ✅ Dynamic port (Render provides PORT automatically)
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
