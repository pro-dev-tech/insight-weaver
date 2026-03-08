require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const datasetRoutes = require("./routes/dataset");
const aiRoutes = require("./routes/ai");
const settingsRoutes = require("./routes/settings");
const emailRoutes = require("./routes/email");

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api", datasetRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/email", emailRoutes);

// Health check
app.get("/health", (req, res) => res.json({
  status: "ok",
  ai: {
    gemini: !!process.env.GEMINI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
  },
}));

app.listen(PORT, () => {
  console.log(`PayRecovery AI backend running on http://localhost:${PORT}`);
  console.log(`AI providers: Gemini=${!!process.env.GEMINI_API_KEY} OpenRouter=${!!process.env.OPENROUTER_API_KEY} Groq=${!!process.env.GROQ_API_KEY}`);
});
