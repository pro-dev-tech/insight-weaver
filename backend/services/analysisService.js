/**
 * Analysis Service
 * Handles column type detection, statistics computation, and correlations
 */

/**
 * Detect column type by sampling values
 */
function detectColumnType(rows, columnName) {
  let numericCount = 0;
  let dateCount = 0;
  let missing = 0;
  const uniqueVals = new Set();

  const sampleSize = Math.min(rows.length, 500);
  for (let i = 0; i < sampleSize; i++) {
    const val = rows[i][columnName];
    if (val === null || val === undefined || val === "") {
      missing++;
      continue;
    }
    uniqueVals.add(val);

    if (typeof val === "number" || (!isNaN(val) && typeof val === "string" && val.trim() !== "")) {
      numericCount++;
    }

    // Check for date patterns
    if (typeof val === "string" && isDateLike(val)) {
      dateCount++;
    }
  }

  const validCount = sampleSize - missing;
  // Scale missing to full dataset
  const fullMissing = Math.round((missing / sampleSize) * rows.length);
  const fullUnique = uniqueVals.size;

  let type = "categorical";
  if (validCount > 0) {
    if (dateCount / validCount > 0.7) {
      type = "datetime";
    } else if (numericCount / validCount > 0.8) {
      type = "numeric";
    }
  }

  return { type, missing: fullMissing, unique: fullUnique };
}

/**
 * Check if a string looks like a date
 */
function isDateLike(str) {
  // Common date patterns
  const patterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/,   // 2024-01-15
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/,  // 01/15/2024
    /^\w{3,}\s+\d{1,2},?\s+\d{4}/,     // January 15, 2024
  ];
  return patterns.some((p) => p.test(str));
}

/**
 * Compute statistics for a numeric column
 */
function computeNumericStats(rows, columnName) {
  const values = rows
    .map((r) => r[columnName])
    .filter((v) => v !== null && v !== undefined && typeof v === "number" && !isNaN(v));

  const missing = rows.length - values.length;

  if (values.length === 0) {
    return { name: columnName, type: "numeric", mean: 0, median: 0, min: 0, max: 0, std: 0, missing };
  }

  values.sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 === 0 ? (values[n / 2 - 1] + values[n / 2]) / 2 : values[Math.floor(n / 2)];
  const min = values[0];
  const max = values[n - 1];
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);

  // Detect outliers using IQR method
  const q1 = values[Math.floor(n * 0.25)];
  const q3 = values[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = values.filter((v) => v < lowerBound || v > upperBound);

  return {
    name: columnName,
    type: "numeric",
    mean: parseFloat(mean.toFixed(4)),
    median: parseFloat(median.toFixed(4)),
    min,
    max,
    std: parseFloat(std.toFixed(4)),
    missing,
    outliers: outliers.slice(0, 20), // Return up to 20 outlier values
  };
}

/**
 * Compute statistics for a categorical column
 */
function computeCategoricalStats(rows, columnName) {
  const valueCounts = {};
  let missing = 0;

  for (const row of rows) {
    const val = row[columnName];
    if (val === null || val === undefined || val === "") {
      missing++;
      continue;
    }
    const key = String(val);
    valueCounts[key] = (valueCounts[key] || 0) + 1;
  }

  // Sort by frequency descending and take top 20
  const sorted = Object.entries(valueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  const topCounts = Object.fromEntries(sorted);

  return {
    name: columnName,
    type: "categorical",
    unique: Object.keys(valueCounts).length,
    missing,
    valueCounts: topCounts,
  };
}

/**
 * Compute Pearson correlation matrix between numeric columns
 */
function computeCorrelations(rows, numericColumns) {
  if (numericColumns.length < 2) return {};

  const correlations = {};

  for (const col1 of numericColumns) {
    correlations[col1] = {};
    for (const col2 of numericColumns) {
      if (col1 === col2) {
        correlations[col1][col2] = 1;
        continue;
      }
      correlations[col1][col2] = pearsonCorrelation(rows, col1, col2);
    }
  }

  return correlations;
}

/**
 * Compute Pearson correlation coefficient between two columns
 */
function pearsonCorrelation(rows, col1, col2) {
  const pairs = rows
    .map((r) => [r[col1], r[col2]])
    .filter(([a, b]) => a !== null && b !== null && typeof a === "number" && typeof b === "number");

  const n = pairs.length;
  if (n < 3) return 0;

  const sumX = pairs.reduce((s, [x]) => s + x, 0);
  const sumY = pairs.reduce((s, [, y]) => s + y, 0);
  const sumXY = pairs.reduce((s, [x, y]) => s + x * y, 0);
  const sumX2 = pairs.reduce((s, [x]) => s + x * x, 0);
  const sumY2 = pairs.reduce((s, [, y]) => s + y * y, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  if (den === 0) return 0;
  return parseFloat((num / den).toFixed(4));
}

module.exports = {
  detectColumnType,
  computeNumericStats,
  computeCategoricalStats,
  computeCorrelations,
};
