const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

/**
 * POST /api/settings/payment-keys
 * Save payment API keys to .env file
 */
router.post("/payment-keys", async (req, res) => {
  try {
    const { razorpayKey, razorpaySecret, stripeKey, stripeSecret, upiId, upiName } = req.body;

    const envPath = path.join(__dirname, "..", ".env");
    let envContent = fs.readFileSync(envPath, "utf-8");

    const updateEnvVar = (content, key, value) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value || ""}`);
      }
      return content + `\n${key}=${value || ""}`;
    };

    if (razorpayKey !== undefined) envContent = updateEnvVar(envContent, "RAZORPAY_KEY_ID", razorpayKey);
    if (razorpaySecret !== undefined) envContent = updateEnvVar(envContent, "RAZORPAY_KEY_SECRET", razorpaySecret);
    if (stripeKey !== undefined) envContent = updateEnvVar(envContent, "STRIPE_PUBLISHABLE_KEY", stripeKey);
    if (stripeSecret !== undefined) envContent = updateEnvVar(envContent, "STRIPE_SECRET_KEY", stripeSecret);

    fs.writeFileSync(envPath, envContent);

    res.json({ success: true, message: "Payment keys updated" });
  } catch (err) {
    console.error("Save payment keys error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/settings/payment-keys/status
 * Check which payment keys are configured (without exposing values)
 */
router.get("/payment-keys/status", (req, res) => {
  res.json({
    razorpay: !!process.env.RAZORPAY_KEY_ID,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
  });
});

module.exports = router;
