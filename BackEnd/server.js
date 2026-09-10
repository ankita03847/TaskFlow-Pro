require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const authRoutes = require("./routes/AuthRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Trust reverse proxies (Render, Railway, Vercel, Nginx) so req.protocol and client IP work correctly
app.set("trust proxy", 1);

// Connect Database on standalone startup (handled per-request on serverless)
if (!process.env.VERCEL) {
  connectDB();
}

// Middleware to handle CORS (supports single URL, multiple comma-separated URLs, or wildcard '*')
const clientUrl = process.env.CLIENT_URL;
const allowedOrigins = clientUrl
  ? clientUrl.includes(",")
    ? clientUrl.split(",").map((url) => url.trim())
    : clientUrl
  : "*";

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware to parse JSON
app.use(express.json());

// Serve static uploaded files (supports both uploads, Uploads, and /tmp on Vercel)
const os = require("os");
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "uploads")
  : fs.existsSync(path.join(__dirname, "Uploads"))
    ? path.join(__dirname, "Uploads")
    : path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Root API Health Check Route (always responds immediately with 200 OK)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "TaskFlow Pro Backend API is running smoothly 🚀",
  });
});

// Ensure MongoDB connection is established before handling API requests
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err);
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", userRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/tasks", taskRoutes);


app.use("/api/report", reportRoutes);
app.use("/api/reports", reportRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Handle malformed JSON body sent in request
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Malformed JSON in request body. Please check your JSON syntax (ensure double quotes on keys/strings and no trailing commas).",
      details: err.message,
    });
  }

  console.error("Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// Export app for Vercel Serverless deployment
module.exports = app;

// Start Server in standalone / local development environments
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
