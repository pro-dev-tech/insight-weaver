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

    // Normalize password — Google App Passwords work with or without spaces
    const password = (smtp.password || "").trim();
    const username = (smtp.username || smtp.email || "").trim();
    const port = parseInt(smtp.port) || 587;

    const transporter = nodemailer.createTransport({
      host: smtp.host || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Verify connection first
    await transporter.verify();

    const info = await transporter.sendMail({
      from: smtp.email || username,
      to,
      subject,
      text: message,
      html: message.replace(/\n/g, "<br/>"),
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("Email send error:", err.message);
    res.status(500).json({ 
      error: err.message,
      hint: err.code === "EAUTH" 
        ? "Authentication failed. For Gmail, use an App Password (not your regular password). Enable 2FA first, then generate one at myaccount.google.com/apppasswords." 
        : err.code === "ECONNREFUSED" 
        ? "Could not connect to SMTP server. Check the server address and port."
        : undefined
    });
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

    const password = (smtp.password || "").trim();
    const username = (smtp.username || smtp.email || "").trim();
    const port = parseInt(smtp.port) || 587;

    const transporter = nodemailer.createTransport({
      host: smtp.host || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.verify();

    const results = [];
    for (const r of recipients) {
      try {
        const info = await transporter.sendMail({
          from: smtp.email || username,
          to: r.to,
          subject: r.subject,
          text: r.message,
          html: r.message.replace(/\n/g, "<br/>"),
        });
        results.push({ to: r.to, success: true, messageId: info.messageId });
      } catch (err) {
        results.push({ to: r.to, success: false, error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error("Bulk email error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
