const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all products
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.base_price, 
        c.name as category_name,
        p.image_url, 
        p.is_available,
        p.preparation_time,
        p.calories,
        p.created_at 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC 
      LIMIT 100
    `);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Products retrieved successfully"
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve products",
      message: error.message
    });
  }
});

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        p.*, 
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: "Product retrieved successfully"
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve product",
      message: error.message
    });
  }
});

// Get products by category
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.base_price, 
        p.image_url, 
        p.is_available,
        p.preparation_time,
        p.calories,
        p.created_at 
      FROM products p
      WHERE p.category_id = $1 AND p.is_available = true
      ORDER BY p.name ASC
    `, [categoryId]);
    
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: "Products by category retrieved successfully"
    });
  } catch (error) {
    console.error("Products by category fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve products by category",
      message: error.message
    });
  }
});

module.exports = router;
