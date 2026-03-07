/**
 * Insight Service
 * Generates human-readable insights from statistical analysis results
 */

let insightId = 0;
function nextId() {
  return `insight-${++insightId}`;
}

/**
 * Generate insights from computed stats and correlations
 * @param {object[]} stats - Column statistics
 * @param {object} correlations - Correlation matrix
 * @param {number} totalRows - Total row count
 * @returns {object[]} Array of insight objects
 */
function generateInsights(stats, correlations, totalRows) {
  insightId = 0;
  const insights = [];

  for (const stat of stats) {
    // Missing values
    if (stat.missing > 0) {
      const pct = ((stat.missing / totalRows) * 100).toFixed(1);
      insights.push({
        id: nextId(),
        type: pct > 20 ? "warning" : "info",
        message: `Column '${stat.name}' has ${stat.missing} missing values (${pct}% of data).`,
        column: stat.name,
        severity: pct > 50 ? "high" : pct > 20 ? "medium" : "low",
      });
    }

    if (stat.type === "numeric") {
      // Skewness detection (simple heuristic: compare mean vs median)
      if (stat.mean !== undefined && stat.median !== undefined && stat.std > 0) {
        const skewRatio = (stat.mean - stat.median) / stat.std;
        if (skewRatio > 0.5) {
          insights.push({
            id: nextId(),
            type: "distribution",
            message: `Column '${stat.name}' shows a right-skewed distribution (mean ${stat.mean.toFixed(2)} > median ${stat.median.toFixed(2)}).`,
            column: stat.name,
            severity: "low",
          });
        } else if (skewRatio < -0.5) {
          insights.push({
            id: nextId(),
            type: "distribution",
            message: `Column '${stat.name}' shows a left-skewed distribution (mean ${stat.mean.toFixed(2)} < median ${stat.median.toFixed(2)}).`,
            column: stat.name,
            severity: "low",
          });
        }
      }

      // Outliers
      if (stat.outliers && stat.outliers.length > 0) {
        insights.push({
          id: nextId(),
          type: "warning",
          message: `Column '${stat.name}' has ${stat.outliers.length} potential outlier${stat.outliers.length > 1 ? "s" : ""} detected using the IQR method.`,
          column: stat.name,
          severity: stat.outliers.length > 10 ? "medium" : "low",
        });
      }

      // Range info
      if (stat.min !== undefined && stat.max !== undefined) {
        insights.push({
          id: nextId(),
          type: "info",
          message: `Column '${stat.name}' ranges from ${stat.min.toLocaleString()} to ${stat.max.toLocaleString()} with std dev of ${stat.std?.toFixed(2)}.`,
          column: stat.name,
          severity: "low",
        });
      }
    }

    if (stat.type === "categorical") {
      insights.push({
        id: nextId(),
        type: "info",
        message: `Column '${stat.name}' contains ${stat.unique} unique categories.`,
        column: stat.name,
        severity: "low",
      });

      // High cardinality warning
      if (stat.unique > 100) {
        insights.push({
          id: nextId(),
          type: "warning",
          message: `Column '${stat.name}' has high cardinality (${stat.unique} unique values). Consider grouping or encoding.`,
          column: stat.name,
          severity: "medium",
        });
      }
    }
  }

  // Correlation insights
  if (correlations && Object.keys(correlations).length > 0) {
    const seen = new Set();
    for (const [col1, others] of Object.entries(correlations)) {
      for (const [col2, corr] of Object.entries(others)) {
        if (col1 === col2) continue;
        const key = [col1, col2].sort().join("__");
        if (seen.has(key)) continue;
        seen.add(key);

        const abs = Math.abs(corr);
        if (abs >= 0.7) {
          const direction = corr > 0 ? "positive" : "negative";
          const strength = abs >= 0.9 ? "very strong" : "strong";
          insights.push({
            id: nextId(),
            type: "correlation",
            message: `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} correlation detected between '${col1}' and '${col2}' (r = ${corr.toFixed(3)}).`,
            severity: abs >= 0.9 ? "high" : "medium",
          });
        }
      }
    }
  }

  // Sort: high severity first
  const severityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights;
}

module.exports = { generateInsights };
