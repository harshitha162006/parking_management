const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "harshitha_parking_lot",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

// Only these table/column names are accepted by the API.
const tables = {
  users: {
    primary: "user_id",
    columns: ["user_id", "name", "phone", "email", "role"],
    required: ["name", "phone", "email", "role"]
  },
  parking_slots: {
    primary: "slot_id",
    columns: ["slot_id", "slot_number", "vehicle_type", "location", "status"],
    required: ["slot_number", "vehicle_type", "location", "status"]
  },
  vehicles: {
    primary: "vehicle_id",
    columns: ["vehicle_id", "user_id", "vehicle_number", "vehicle_type", "vehicle_model"],
    required: ["user_id", "vehicle_number", "vehicle_type", "vehicle_model"]
  },
  parking_records: {
    primary: "record_id",
    columns: ["record_id", "vehicle_id", "slot_id", "entry_time", "exit_time", "parking_fee", "status"],
    required: ["vehicle_id", "slot_id", "entry_time", "status"]
  }
};

function getTable(name) {
  if (!tables[name]) throw new Error("Invalid table name");
  return tables[name];
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ connected: true, message: "MySQL connection successful" });
  } catch (err) {
    res.status(500).json({ connected: false, message: err.message });
  }
});

// READ all records
app.get("/api/:table", async (req, res) => {
  try {
    const config = getTable(req.params.table);
    const [rows] = await pool.query(`SELECT * FROM \`${req.params.table}\` ORDER BY \`${config.primary}\` DESC`);
    res.json(rows);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// CREATE a record
app.post("/api/:table", async (req, res) => {
  try {
    const tableName = req.params.table;
    const config = getTable(tableName);
    const fields = config.columns.filter(c => c !== config.primary && req.body[c] !== undefined);
    const missing = config.required.filter(c => req.body[c] === undefined || req.body[c] === "");
    if (missing.length) return res.status(400).json({ message: `Required fields: ${missing.join(", ")}` });
    if (!fields.length) return res.status(400).json({ message: "No data provided" });

    const values = fields.map(c => req.body[c] === "" ? null : req.body[c]);
    const sql = `INSERT INTO \`${tableName}\` (${fields.map(c => `\`${c}\``).join(",")}) VALUES (${fields.map(() => "?").join(",")})`;
    const [result] = await pool.execute(sql, values);
    res.status(201).json({ message: "Record created successfully", id: result.insertId });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE a record
app.put("/api/:table/:id", async (req, res) => {
  try {
    const tableName = req.params.table;
    const config = getTable(tableName);
    const fields = config.columns.filter(c => c !== config.primary && req.body[c] !== undefined);
    if (!fields.length) return res.status(400).json({ message: "No fields to update" });
    const values = fields.map(c => req.body[c] === "" ? null : req.body[c]);
    values.push(req.params.id);
    const sql = `UPDATE \`${tableName}\` SET ${fields.map(c => `\`${c}\` = ?`).join(", ")} WHERE \`${config.primary}\` = ?`;
    const [result] = await pool.execute(sql, values);
    if (!result.affectedRows) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record updated successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a record
app.delete("/api/:table/:id", async (req, res) => {
  try {
    const tableName = req.params.table;
    const config = getTable(tableName);
    const [result] = await pool.execute(
      `DELETE FROM \`${tableName}\` WHERE \`${config.primary}\` = ?`,
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
