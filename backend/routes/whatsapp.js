const express = require("express");
const router = express.Router();

/**
 * POST /api/whatsapp/verify
 * Verify WhatsApp Business API credentials
 */
router.post("/verify", async (req, res) => {
  try {
    const { apiKey, phoneNumberId } = req.body;
    if (!apiKey || !phoneNumberId) {
      return res.status(400).json({ success: false, error: "Missing credentials" });
    }

    // Verify by calling the WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const data = await response.json();

    if (data.error) {
      return res.json({ success: false, error: data.error.message });
    }

    res.json({
      success: true,
      phoneNumber: data.display_phone_number || data.verified_name,
      verifiedName: data.verified_name,
    });
  } catch (err) {
    console.error("WhatsApp verify error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/register
 * Store WhatsApp API credentials and business docs
 */
router.post("/register", async (req, res) => {
  try {
    const { apiKey, phoneNumberId, businessAccountId, businessDocs, userId } = req.body;

    // Store in memory / env for this session (in production, use DB)
    process.env.WA_API_KEY = apiKey;
    process.env.WA_PHONE_NUMBER_ID = phoneNumberId;
    if (businessAccountId) process.env.WA_BUSINESS_ACCOUNT_ID = businessAccountId;

    console.log(`[WhatsApp] API registered for user ${userId}, phone: ${phoneNumberId}`);
    console.log(`[WhatsApp] Business: ${businessDocs?.businessName}`);

    res.json({ success: true, message: "WhatsApp API credentials registered" });
  } catch (err) {
    console.error("WhatsApp register error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message via the Cloud API
 */
router.post("/send", async (req, res) => {
  try {
    const { to, message, apiKey: userKey, phoneNumberId: userPhoneId } = req.body;
    const token = userKey || process.env.WA_API_KEY;
    const phoneId = userPhoneId || process.env.WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      return res.status(400).json({ success: false, error: "WhatsApp API not configured" });
    }
    if (!to) {
      return res.status(400).json({ success: false, error: "Recipient phone number required" });
    }

    // Format phone number (remove non-digits, ensure country code)
    let phone = to.replace(/[^0-9]/g, "");
    if (phone.length === 10) phone = "91" + phone; // Default to India

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("[WhatsApp] Send error:", data.error);
      return res.json({ success: false, error: data.error.message });
    }

    console.log(`[WhatsApp] Message sent to ${phone}, id: ${data.messages?.[0]?.id}`);
    res.json({ success: true, messageId: data.messages?.[0]?.id });
  } catch (err) {
    console.error("WhatsApp send error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
