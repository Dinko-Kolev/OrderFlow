const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all orders
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id, 
        o.user_id,
        u.email as customer_email,
        u.first_name,
        u.last_name,
        o.total_amount, 
        o.status, 
        o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.user_id, u.email, u.first_name, u.last_name, o.total_amount, o.status, o.created_at
      ORDER BY o.created_at DESC 
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Orders retrieved successfully"
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve orders",
      message: error.message
    });
  }
});

// Get order by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        o.*,
        u.email as customer_email,
        u.first_name,
        u.last_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Order retrieved successfully"
    });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve order",
      message: error.message
    });
  }
});

// Get order items
router.get("/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.base_price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Order items retrieved successfully"
    });
  } catch (error) {
    console.error("Order items fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve order items",
      message: error.message
    });
  }
});

// Update order status
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Order status updated successfully"
    });
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
      message: error.message
    });
  }
});

module.exports = router;
