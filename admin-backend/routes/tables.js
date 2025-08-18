const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all restaurant tables
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id,
        table_number,
        name,
        capacity,
        min_party_size,
        is_active,
        table_type,
        location_description,
        created_at
      FROM restaurant_tables 
      ORDER BY table_number ASC
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Restaurant tables retrieved successfully"
    });
  } catch (error) {
    console.error("Tables fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve restaurant tables",
      message: error.message
    });
  }
});

// Get table by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        id,
        table_number,
        name,
        capacity,
        min_party_size,
        is_active,
        table_type,
        location_description,
        created_at
      FROM restaurant_tables 
      WHERE id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Table not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Table retrieved successfully"
    });
  } catch (error) {
    console.error("Table fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve table",
      message: error.message
    });
  }
});

// Get table availability
router.get("/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        tr.*,
        u.email as customer_email,
        u.first_name,
        u.last_name
      FROM table_reservations tr
      LEFT JOIN users u ON tr.user_id = u.id
      WHERE tr.table_id = $1 
      AND tr.reservation_date >= CURRENT_DATE
      ORDER BY tr.reservation_date, tr.reservation_time
    `, [id]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Table availability retrieved successfully"
    });
  } catch (error) {
    console.error("Table availability error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve table availability",
      message: error.message
    });
  }
});

// Get table statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        COUNT(tr.id) as total_reservations,
        COUNT(CASE WHEN tr.reservation_date >= CURRENT_DATE THEN 1 END) as upcoming_reservations,
        AVG(tr.party_size) as average_party_size,
        MIN(tr.reservation_date) as first_reservation,
        MAX(tr.reservation_date) as last_reservation
      FROM table_reservations tr
      WHERE tr.table_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: rows[0],
      message: "Table statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Table stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve table statistics",
      message: error.message
    });
  }
});

module.exports = router;
