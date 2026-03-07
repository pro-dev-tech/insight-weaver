const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const XLSX = require("xlsx");

/**
 * Parse a file (CSV or Excel) and return an array of row objects
 * @param {string} filePath - Path to the uploaded file
 * @param {string} originalName - Original file name for extension detection
 * @returns {Promise<object[]>} Array of parsed row objects
 */
async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === ".csv") {
    return parseCSV(filePath);
  } else if (ext === ".xlsx" || ext === ".xls") {
    return parseExcel(filePath);
  } else {
    throw new Error(`Unsupported file format: ${ext}`);
  }
}

/**
 * Parse a CSV file using csv-parser
 */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        // Convert numeric strings to numbers
        const cleaned = {};
        for (const [key, value] of Object.entries(row)) {
          const trimKey = key.trim();
          const trimVal = typeof value === "string" ? value.trim() : value;
          if (trimVal === "" || trimVal === "NA" || trimVal === "N/A" || trimVal === "null") {
            cleaned[trimKey] = null;
          } else if (!isNaN(trimVal) && trimVal !== "") {
            cleaned[trimKey] = parseFloat(trimVal);
          } else {
            cleaned[trimKey] = trimVal;
          }
        }
        rows.push(cleaned);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

/**
 * Parse an Excel file using xlsx
 */
function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Use first sheet
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // Clean values
  return rows.map((row) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(row)) {
      if (value === "" || value === "NA" || value === "N/A") {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  });
}

module.exports = { parseFile };
