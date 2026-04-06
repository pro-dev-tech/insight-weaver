const express = require("express");
const router = express.Router();

/**
 * POST /api/gsheet/sync
 * Diff-based sync: fetches sheet, compares with local snapshot, returns only changed/new rows
 */
router.post("/sync", async (req, res) => {
  try {
    const { sheetId, accessToken, existingHashes } = req.body;
    if (!sheetId || !accessToken) {
      return res.status(400).json({ error: "sheetId and accessToken are required" });
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `Google API error: ${errBody}` });
    }

    const data = await response.json();
    if (!data.values || data.values.length < 2) {
      return res.json({ rows: [], newRows: [], removedHashes: [], allHashes: [] });
    }

    const headers = data.values[0];
    const allRows = data.values.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ""; });
      return obj;
    });

    // Create hash for each row for diffing
    const hashRow = (row) => {
      return headers.map((h) => (row[h] || "").toString().trim()).join("|");
    };

    const allHashes = allRows.map(hashRow);
    const existingSet = new Set(existingHashes || []);
    const newHashes = new Set(allHashes);

    // New/changed rows
    const newRows = [];
    allRows.forEach((row, i) => {
      if (!existingSet.has(allHashes[i])) {
        newRows.push(row);
      }
    });

    // Removed rows (in existing but not in sheet anymore)
    const removedHashes = (existingHashes || []).filter((h) => !newHashes.has(h));

    res.json({
      rows: allRows,
      newRows,
      removedHashes,
      allHashes,
      totalRows: allRows.length,
      newCount: newRows.length,
      removedCount: removedHashes.length,
    });
  } catch (err) {
    console.error("Google Sheet sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/gsheet/push
 * Batch update: only push changed rows to Google Sheet
 */
router.post("/push", async (req, res) => {
  try {
    const { sheetId, accessToken, rows, headers } = req.body;
    if (!sheetId || !accessToken || !rows || !headers) {
      return res.status(400).json({ error: "sheetId, accessToken, rows, and headers are required" });
    }

    const values = [headers, ...rows.map((row) => headers.map((h) => row[h] || ""))];

    // Use batchUpdate for efficiency
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ range: "Sheet1", majorDimension: "ROWS", values }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `Google API error: ${errBody}` });
    }

    const data = await response.json();
    res.json({ success: true, updatedCells: data.updatedCells });
  } catch (err) {
    console.error("Google Sheet push error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
