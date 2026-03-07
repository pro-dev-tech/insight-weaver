const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const controller = require("../controllers/datasetController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  // Also accept by extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(file.mimetype) || [".csv", ".xlsx", ".xls"].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV and Excel files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 },
});

// POST /api/upload - Upload and parse a file
router.post("/upload", upload.single("file"), controller.uploadFile);

// GET /api/dataset/preview - Get first 100 rows
router.get("/dataset/preview", controller.getPreview);

// GET /api/dataset/summary - Get statistics
router.get("/dataset/summary", controller.getSummary);

// GET /api/dataset/charts - Get auto-generated chart configs
router.get("/dataset/charts", controller.getCharts);

// GET /api/dataset/insights - Get auto-generated insights
router.get("/dataset/insights", controller.getInsights);

// GET /api/dataset/export - Export cleaned dataset as CSV
router.get("/dataset/export", controller.exportDataset);

module.exports = router;
