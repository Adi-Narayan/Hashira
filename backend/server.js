import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import reviewRouter from "./routes/reviewRoute.js";

const app = express();

const PORT = process.env.PORT || 4000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* -------------------- CORS CONFIG -------------------- */
const allowedOrigins = [
  "https://hashira.in",
  "https://www.hashira.in",
  "https://hashira-admin.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174"
];

// PayU posts to /api/order/verifyPayU from payu.in (cross-origin form POST).
// Browsers don't send an Origin header on that redirect for server-to-server
// form posts, but we also mount a CORS-less route for PayU callbacks below.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server, curl, PayU
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked: origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  })
);

/* -------------------- RATE LIMITING -------------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/admin", authLimiter);
app.use("/api/user/send-otp", authLimiter);
app.use("/api/user/forgot-password", authLimiter);

/* -------------------- ROUTES -------------------- */
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRouter);

/* -------------------- HEALTH CHECK -------------------- */
app.get("/", (req, res) => {
  res.status(200).send("API Working 🚀");
});

/* -------------------- SERVER START -------------------- */
const startServer = async () => {
  try {
    await connectDB();
    connectCloudinary();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
