const fileParser = require("../utils/fileParser");
const analysisService = require("../services/analysisService");
const chartService = require("../services/chartService");
const insightService = require("../services/insightService");

// In-memory store for current dataset (single-user demo)
let currentDataset = null;
let cachedAnalysis = null;

/**
 * POST /api/upload
 * Parse uploaded CSV/Excel file, detect column types, return metadata
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { path: filePath, originalname, size } = req.file;

    // Parse the file into an array of row objects
    const rows = await fileParser.parseFile(filePath, originalname);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "File is empty or could not be parsed" });
    }

    // Detect column types
    const columnNames = Object.keys(rows[0]);
    const columns = columnNames.map((name) => {
      const info = analysisService.detectColumnType(rows, name);
      return {
        name,
        type: info.type,
        missing: info.missing,
        unique: info.unique,
      };
    });

    // Store in memory
    currentDataset = {
      rows,
      fileName: originalname,
      fileSize: size,
      columns,
    };
    cachedAnalysis = null; // Clear cache

    res.json({
      totalRows: rows.length,
      totalColumns: columnNames.length,
      columns,
      fileName: originalname,
      fileSize: size,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to process file" });
  }
};

/**
 * GET /api/dataset/preview
 * Return first 100 rows of the dataset
 */
exports.getPreview = (req, res) => {
  if (!currentDataset) {
    return res.status(404).json({ error: "No dataset loaded. Upload a file first." });
  }
  const columns = Object.keys(currentDataset.rows[0]);
  const rows = currentDataset.rows.slice(0, 100);
  res.json({ columns, rows });
};

/**
 * GET /api/dataset/summary
 * Compute and return statistics for all columns
 */
exports.getSummary = (req, res) => {
  if (!currentDataset) {
    return res.status(404).json({ error: "No dataset loaded" });
  }

  if (cachedAnalysis) {
    return res.json(cachedAnalysis);
  }

  const { rows, columns } = currentDataset;

  // Compute per-column stats
  const stats = columns.map((col) => {
    if (col.type === "numeric") {
      return analysisService.computeNumericStats(rows, col.name);
    } else {
      return analysisService.computeCategoricalStats(rows, col.name);
    }
  });

  // Compute correlations between numeric columns
  const numericCols = columns.filter((c) => c.type === "numeric").map((c) => c.name);
  const correlations = analysisService.computeCorrelations(rows, numericCols);

  cachedAnalysis = { stats, correlations };
  res.json(cachedAnalysis);
};

/**
 * GET /api/dataset/charts
 * Generate chart configurations based on the dataset
 */
exports.getCharts = (req, res) => {
  if (!currentDataset) {
    return res.status(404).json({ error: "No dataset loaded" });
  }
  const charts = chartService.generateCharts(currentDataset.rows, currentDataset.columns);
  res.json(charts);
};

/**
 * GET /api/dataset/insights
 * Generate human-readable insights
 */
exports.getInsights = (req, res) => {
  if (!currentDataset) {
    return res.status(404).json({ error: "No dataset loaded" });
  }

  // Ensure analysis is computed
  if (!cachedAnalysis) {
    const { rows, columns } = currentDataset;
    const stats = columns.map((col) => {
      if (col.type === "numeric") {
        return analysisService.computeNumericStats(rows, col.name);
      } else {
        return analysisService.computeCategoricalStats(rows, col.name);
      }
    });
    const numericCols = columns.filter((c) => c.type === "numeric").map((c) => c.name);
    const correlations = analysisService.computeCorrelations(rows, numericCols);
    cachedAnalysis = { stats, correlations };
  }

  const insights = insightService.generateInsights(
    cachedAnalysis.stats,
    cachedAnalysis.correlations,
    currentDataset.rows.length
  );
  res.json(insights);
};

/**
 * GET /api/dataset/export
 * Export cleaned dataset as CSV
 */
exports.exportDataset = (req, res) => {
  if (!currentDataset) {
    return res.status(404).json({ error: "No dataset loaded" });
  }

  const { rows } = currentDataset;
  const columns = Object.keys(rows[0]);

  // Build CSV
  const header = columns.map((c) => `"${c}"`).join(",");
  const csvRows = rows.map((row) =>
    columns.map((c) => {
      const val = row[c];
      if (val === null || val === undefined) return "";
      return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(",")
  );

  const csv = [header, ...csvRows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=dataset_cleaned.csv");
  res.send(csv);
};
