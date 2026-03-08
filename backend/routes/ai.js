const express = require("express");
const router = express.Router();
const aiService = require("../services/aiService");

/**
 * POST /api/ai/risk-explain
 * Generate AI risk explanation for a customer
 */
router.post("/risk-explain", async (req, res) => {
  try {
    const { customer, invoices } = req.body;
    if (!customer) {
      return res.status(400).json({ error: "Customer data required" });
    }

    const explanation = await aiService.generateRiskExplanation(customer, invoices || []);
    if (!explanation) {
      return res.status(503).json({ error: "AI service unavailable. Check API keys in backend/.env" });
    }

    res.json({ explanation });
  } catch (err) {
    console.error("Risk explain error:", err);
    res.status(500).json({ error: err.message || "AI service error" });
  }
});

/**
 * POST /api/ai/reminder-message
 * Generate personalized reminder message
 */
router.post("/reminder-message", async (req, res) => {
  try {
    const { invoice, customer, tone } = req.body;
    if (!invoice || !customer) {
      return res.status(400).json({ error: "Invoice and customer data required" });
    }

    const message = await aiService.generateReminderMessage(invoice, customer, tone || "friendly");
    if (!message) {
      return res.status(503).json({ error: "AI service unavailable" });
    }

    res.json({ message, tone });
  } catch (err) {
    console.error("Reminder message error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/dashboard-insights
 * Generate AI insights from dashboard stats
 */
router.post("/dashboard-insights", async (req, res) => {
  try {
    const { stats } = req.body;
    if (!stats) {
      return res.status(400).json({ error: "Stats data required" });
    }

    const insights = await aiService.generateDashboardInsights(stats);
    if (!insights) {
      return res.status(503).json({ error: "AI service unavailable" });
    }

    res.json({ insights });
  } catch (err) {
    console.error("Dashboard insights error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ai/chat
 * General AI chat for the platform
 */
router.post("/chat", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt required" });
    }

    const systemPrompt = context
      ? `You are an AI assistant for an MSME payment recovery platform. Context: ${context}`
      : "You are an AI assistant for an MSME payment recovery platform in India. Help with invoice management, payment collection, and financial analysis.";

    const result = await aiService.callAI(prompt, systemPrompt);
    if (!result) {
      return res.status(503).json({ error: "AI service unavailable. Add API keys to backend/.env" });
    }

    res.json({ response: result.content, provider: result.provider });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
