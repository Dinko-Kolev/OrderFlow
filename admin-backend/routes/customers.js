const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all customers
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        COUNT(o.id) as order_count,
        MAX(o.created_at) as last_order,
        u.created_at as customer_since
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.created_at
      ORDER BY last_order DESC NULLS LAST
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Customers retrieved successfully"
    });
  } catch (error) {
    console.error("Customers fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve customers",
      message: error.message
    });
  }
});

// Get customer by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        u.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Customer retrieved successfully"
    });
  } catch (error) {
    console.error("Customer fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve customer",
      message: error.message
    });
  }
});

// Get customer orders
router.get("/:id/orders", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id, o.total_amount, o.status, o.created_at
      ORDER BY o.created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Customer orders retrieved successfully"
    });
  } catch (error) {
    console.error("Customer orders fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve customer orders",
      message: error.message
    });
  }
});

// Get customer statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        AVG(o.total_amount) as average_order_value,
        MIN(o.created_at) as first_order,
        MAX(o.created_at) as last_order
      FROM orders o
      WHERE o.user_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: rows[0],
      message: "Customer statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Customer stats fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve customer statistics",
      message: error.message
    });
  }
});

module.exports = router;
