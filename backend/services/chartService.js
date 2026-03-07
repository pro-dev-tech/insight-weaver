/**
 * Chart Service
 * Automatically generates chart configurations based on column types
 */

let chartId = 0;
function nextId() {
  return `chart-${++chartId}`;
}

/**
 * Generate chart configs for the given dataset
 * @param {object[]} rows - Dataset rows
 * @param {object[]} columns - Column metadata [{name, type, ...}]
 * @returns {object[]} Array of chart configuration objects
 */
function generateCharts(rows, columns) {
  chartId = 0;
  const charts = [];
  const numericCols = columns.filter((c) => c.type === "numeric");
  const categoricalCols = columns.filter((c) => c.type === "categorical");
  const dateCols = columns.filter((c) => c.type === "datetime");

  // 1. Histograms for numeric columns (up to 4)
  for (const col of numericCols.slice(0, 4)) {
    charts.push(generateHistogram(rows, col.name));
  }

  // 2. Bar charts for categorical columns (up to 3)
  for (const col of categoricalCols.slice(0, 3)) {
    charts.push(generateBarChart(rows, col.name));
  }

  // 3. Pie chart for first categorical column with <= 10 unique values
  const pieCandiate = categoricalCols.find((c) => c.unique <= 10);
  if (pieCandiate) {
    charts.push(generatePieChart(rows, pieCandiate.name));
  }

  // 4. Line chart for date + numeric combinations
  if (dateCols.length > 0 && numericCols.length > 0) {
    charts.push(generateLineChart(rows, dateCols[0].name, numericCols[0].name));
  }

  // 5. Scatter plot for first two numeric columns
  if (numericCols.length >= 2) {
    charts.push(generateScatterPlot(rows, numericCols[0].name, numericCols[1].name));
  }

  // 6. Correlation heatmap if 2+ numeric columns
  if (numericCols.length >= 2) {
    charts.push(generateCorrelationHeatmap(rows, numericCols));
  }

  return charts;
}

/**
 * Generate histogram data by binning numeric values
 */
function generateHistogram(rows, columnName) {
  const values = rows
    .map((r) => r[columnName])
    .filter((v) => v !== null && typeof v === "number");

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binCount = Math.min(20, Math.max(5, Math.ceil(Math.sqrt(values.length))));
  const binWidth = (max - min) / binCount || 1;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    range: `${(min + i * binWidth).toFixed(1)}`,
    count: 0,
  }));

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[idx].count++;
  }

  return {
    id: nextId(),
    type: "histogram",
    title: `Distribution of ${columnName}`,
    description: `Histogram showing frequency distribution`,
    data: bins,
    xKey: "range",
    yKey: "count",
  };
}

/**
 * Generate bar chart from categorical column
 */
function generateBarChart(rows, columnName) {
  const counts = {};
  for (const row of rows) {
    const val = row[columnName];
    if (val === null || val === undefined) continue;
    const key = String(val);
    counts[key] = (counts[key] || 0) + 1;
  }

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, value]) => ({ name, value }));

  return {
    id: nextId(),
    type: "bar",
    title: `${columnName} Distribution`,
    description: `Top values by frequency`,
    data,
    xKey: "name",
    yKey: "value",
  };
}

/**
 * Generate pie chart from categorical column
 */
function generatePieChart(rows, columnName) {
  const counts = {};
  for (const row of rows) {
    const val = row[columnName];
    if (val === null) continue;
    const key = String(val);
    counts[key] = (counts[key] || 0) + 1;
  }

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  return {
    id: nextId(),
    type: "pie",
    title: `${columnName} Breakdown`,
    description: `Proportional distribution`,
    data,
  };
}

/**
 * Generate time series line chart
 */
function generateLineChart(rows, dateCol, numericCol) {
  // Sort by date and sample for performance
  const sorted = rows
    .filter((r) => r[dateCol] !== null && r[numericCol] !== null)
    .sort((a, b) => new Date(a[dateCol]) - new Date(b[dateCol]));

  // Sample if too many points
  const step = Math.max(1, Math.floor(sorted.length / 200));
  const data = sorted
    .filter((_, i) => i % step === 0)
    .map((r) => ({
      date: String(r[dateCol]),
      value: r[numericCol],
    }));

  return {
    id: nextId(),
    type: "line",
    title: `${numericCol} over Time`,
    description: `Time series trend`,
    data,
    xKey: "date",
    yKey: "value",
  };
}

/**
 * Generate scatter plot between two numeric columns
 */
function generateScatterPlot(rows, col1, col2) {
  // Sample for performance
  const valid = rows.filter(
    (r) => r[col1] !== null && r[col2] !== null && typeof r[col1] === "number" && typeof r[col2] === "number"
  );
  const step = Math.max(1, Math.floor(valid.length / 500));
  const data = valid.filter((_, i) => i % step === 0).map((r) => ({
    [col1]: r[col1],
    [col2]: r[col2],
  }));

  return {
    id: nextId(),
    type: "scatter",
    title: `${col1} vs ${col2}`,
    description: `Scatter plot showing relationship`,
    data,
    xKey: col1,
    yKey: col2,
  };
}

/**
 * Generate correlation heatmap data
 */
function generateCorrelationHeatmap(rows, numericCols) {
  const colNames = numericCols.map((c) => c.name).slice(0, 8); // Limit to 8 for readability
  const { computeCorrelations } = require("./analysisService");
  const corr = computeCorrelations(rows, colNames);

  const data = colNames.map((name) => {
    const row = { name };
    for (const other of colNames) {
      row[other] = corr[name]?.[other] ?? 0;
    }
    return row;
  });

  return {
    id: nextId(),
    type: "heatmap",
    title: "Correlation Matrix",
    description: "Pearson correlation between numeric columns",
    data,
    keys: colNames,
  };
}

module.exports = { generateCharts };
