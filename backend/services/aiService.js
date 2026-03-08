/**
 * AI Service - Gemini, OpenRouter, Groq integration
 * Fallback chain: Gemini -> OpenRouter -> Groq
 */
const OpenAI = require("openai");

const providers = {
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.5-flash",
    getKey: () => process.env.GEMINI_API_KEY,
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    model: "google/gemma-3-12b-it:free",
    getKey: () => process.env.OPENROUTER_API_KEY,
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    getKey: () => process.env.GROQ_API_KEY,
  },
};

function getClient(providerName) {
  const p = providers[providerName];
  if (!p) return null;
  const key = p.getKey();
  if (!key) return null;
  return { client: new OpenAI({ apiKey: key, baseURL: p.baseURL }), model: p.model };
}

/**
 * Call AI with automatic fallback
 */
async function callAI(prompt, systemPrompt = "You are a financial analyst AI for an MSME payment recovery system in India. Provide concise, actionable insights.", maxTokens = 500) {
  const order = ["gemini", "openrouter", "groq"];

  for (const providerName of order) {
    const setup = getClient(providerName);
    if (!setup) continue;

    try {
      const response = await setup.client.chat.completions.create({
        model: setup.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        return { provider: providerName, content };
      }
    } catch (err) {
      console.error(`AI ${providerName} failed:`, err.message);
      continue;
    }
  }

  return null;
}

/**
 * Generate risk explanation for a customer
 */
async function generateRiskExplanation(customer, invoices) {
  const prompt = `Analyze this customer's payment risk:

Customer: ${customer.name}
Total Invoices: ${customer.totalInvoices}
Outstanding: ₹${customer.totalOutstanding?.toLocaleString("en-IN")}
Total Paid: ₹${customer.totalPaid?.toLocaleString("en-IN")}
Avg Payment Delay: ${customer.avgPaymentDelay} days
Risk Score: ${(customer.riskScore * 100).toFixed(0)}%
Risk Level: ${customer.riskLevel}

Invoice Details:
${invoices.map((i) => `- ${i.invoiceNumber}: ₹${i.amount} | Status: ${i.status} | Due: ${i.dueDate} | Reminders: ${i.remindersSent}`).join("\n")}

Provide:
1. Why this customer is rated ${customer.riskLevel} risk
2. Payment pattern analysis
3. Key risk factors
4. Actionable recommendations for the MSME owner
Keep it concise and practical.`;

  const result = await callAI(prompt);
  return result?.content || null;
}

/**
 * Generate personalized reminder message
 */
async function generateReminderMessage(invoice, customer, tone) {
  const toneMap = {
    friendly: "Write a friendly, warm payment reminder",
    professional: "Write a professional, business-like payment reminder",
    firm: "Write a firm but polite payment reminder emphasizing urgency",
    escalation: "Write a final escalation notice warning of consequences",
  };

  const prompt = `${toneMap[tone] || toneMap.friendly} for:

Customer: ${customer.name}
Invoice: ${invoice.invoiceNumber}
Amount: ₹${invoice.amount?.toLocaleString("en-IN")}
Due Date: ${invoice.dueDate}
Days Overdue: ${Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000))}

Write the message in a conversational Indian business style. Keep it under 100 words. Include a call to action.`;

  const result = await callAI(prompt, undefined, 200);
  return result?.content || null;
}

/**
 * Generate dashboard insights from invoice data
 */
async function generateDashboardInsights(stats) {
  const prompt = `Given these MSME receivables stats, provide 3-5 key actionable insights:

Total Receivables: ₹${stats.totalReceivables?.toLocaleString("en-IN")}
Overdue Invoices: ${stats.overdueInvoices}
Paid Invoices: ${stats.paidInvoices}
Recovery Rate: ${stats.recoveryRate?.toFixed(1)}%
Aging: 0-30 days: ₹${stats.aging?.["0-30"]?.toLocaleString("en-IN")}, 31-60: ₹${stats.aging?.["31-60"]?.toLocaleString("en-IN")}, 61-90: ₹${stats.aging?.["61-90"]?.toLocaleString("en-IN")}, 90+: ₹${stats.aging?.["90+"]?.toLocaleString("en-IN")}

Be specific and actionable. Format as numbered list.`;

  const result = await callAI(prompt);
  return result?.content || null;
}

module.exports = {
  callAI,
  generateRiskExplanation,
  generateReminderMessage,
  generateDashboardInsights,
};
