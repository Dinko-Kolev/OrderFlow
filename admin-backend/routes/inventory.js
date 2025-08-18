const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all inventory items
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        i.id,
        i.product_id,
        p.name as product_name,
        i.quantity,
        i.reorder_level,
        i.last_updated,
        CASE 
          WHEN i.quantity <= i.reorder_level THEN 'low_stock'
          WHEN i.quantity <= i.reorder_level * 1.5 THEN 'medium_stock'
          ELSE 'good_stock'
        END as stock_status
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      ORDER BY i.quantity ASC
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Inventory retrieved successfully"
    });
  } catch (error) {
    console.error("Inventory fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve inventory",
      message: error.message
    });
  }
});

// Get inventory item by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        i.*,
        p.name as product_name,
        p.base_price,
        p.image_url
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Inventory item not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Inventory item retrieved successfully"
    });
  } catch (error) {
    console.error("Inventory item fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve inventory item",
      message: error.message
    });
  }
});

// Get low stock items
router.get("/low-stock", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        i.id,
        i.product_id,
        p.name as product_name,
        i.quantity,
        i.reorder_level,
        i.last_updated
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.quantity <= i.reorder_level
      ORDER BY i.quantity ASC
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Low stock items retrieved successfully"
    });
  } catch (error) {
    console.error("Low stock fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve low stock items",
      message: error.message
    });
  }
});

// Get inventory alerts
router.get("/alerts", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        'low_stock' as alert_type,
        i.id,
        i.product_id,
        p.name as product_name,
        i.quantity,
        i.reorder_level,
        'Product stock is below reorder level' as message
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.quantity <= i.reorder_level
      
      UNION ALL
      
      SELECT 
        'out_of_stock' as alert_type,
        i.id,
        i.product_id,
        p.name as product_name,
        i.quantity,
        i.reorder_level,
        'Product is out of stock' as message
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE i.quantity = 0
      
      ORDER BY quantity ASC
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Inventory alerts retrieved successfully"
    });
  } catch (error) {
    console.error("Inventory alerts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve inventory alerts",
      message: error.message
    });
  }
});

// Update inventory quantity
router.put("/:id/quantity", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE inventory 
      SET quantity = $1, last_updated = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [quantity, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Inventory item not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Inventory quantity updated successfully"
    });
  } catch (error) {
    console.error("Inventory update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update inventory quantity",
      message: error.message
    });
  }
});

module.exports = router;
