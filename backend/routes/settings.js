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
    const { razorpayKey, razorpaySecret, paypalClientId, paypalSecret, upiId, upiName } = req.body;

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
    if (paypalClientId !== undefined) envContent = updateEnvVar(envContent, "PAYPAL_CLIENT_ID", paypalClientId);
    if (paypalSecret !== undefined) envContent = updateEnvVar(envContent, "PAYPAL_CLIENT_SECRET", paypalSecret);

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
    paypal: !!process.env.PAYPAL_CLIENT_ID,
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
  });
});

module.exports = router;
