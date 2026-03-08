const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

/**
 * POST /api/email/send
 * Send email via SMTP
 */
router.post("/send", async (req, res) => {
  try {
    const { smtp, to, subject, message } = req.body;

    if (!smtp || !to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields: smtp, to, subject, message" });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host || "smtp.gmail.com",
      port: smtp.port || 587,
      secure: smtp.port === 465,
      auth: {
        user: smtp.username || smtp.email,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: smtp.email,
      to,
      subject,
      text: message,
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/send-bulk
 * Send emails to multiple recipients
 */
router.post("/send-bulk", async (req, res) => {
  try {
    const { smtp, recipients } = req.body;

    if (!smtp || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: "Missing smtp config or recipients array" });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host || "smtp.gmail.com",
      port: smtp.port || 587,
      secure: smtp.port === 465,
      auth: {
        user: smtp.username || smtp.email,
        pass: smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const results = [];
    for (const r of recipients) {
      try {
        const info = await transporter.sendMail({
          from: smtp.email,
          to: r.to,
          subject: r.subject,
          text: r.message,
        });
        results.push({ to: r.to, success: true, messageId: info.messageId });
      } catch (err) {
        results.push({ to: r.to, success: false, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error("Bulk email error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
