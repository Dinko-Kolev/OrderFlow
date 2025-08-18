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

// Create new product (POST)
router.post("/", async (req, res) => {
  try {
    const { name, description, base_price, category_id, image_url, is_available } = req.body;
    
    // Validate required fields
    if (!name || !base_price || !category_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, base_price, and category_id are required"
      });
    }

    // Validate price is a positive number
    if (isNaN(base_price) || parseFloat(base_price) <= 0) {
      return res.status(400).json({
        success: false,
        error: "base_price must be a positive number"
      });
    }

    // Check if category exists
    const categoryCheck = await pool.query("SELECT id FROM categories WHERE id = $1", [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid category_id: category does not exist"
      });
    }

    // Insert new product
    const { rows } = await pool.query(`
      INSERT INTO products (name, description, base_price, category_id, image_url, is_available, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, name, description, base_price, category_id, image_url, is_available, created_at
    `, [name, description || null, parseFloat(base_price), category_id, image_url || null, is_available !== false]);

    res.status(201).json({
      success: true,
      data: rows[0],
      message: "Product created successfully"
    });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create product",
      message: error.message
    });
  }
});

// Update product (PUT)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, category_id, image_url, is_available } = req.body;
    
    // Check if product exists
    const productCheck = await pool.query("SELECT id FROM products WHERE id = $1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    // Validate required fields
    if (!name || !base_price || !category_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, base_price, and category_id are required"
      });
    }

    // Validate price is a positive number
    if (isNaN(base_price) || parseFloat(base_price) <= 0) {
      return res.status(400).json({
        success: false,
        error: "base_price must be a positive number"
      });
    }

    // Check if category exists
    const categoryCheck = await pool.query("SELECT id FROM categories WHERE id = $1", [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid category_id: category does not exist"
      });
    }

    // Update product
    const { rows } = await pool.query(`
      UPDATE products 
      SET name = $1, description = $2, base_price = $3, category_id = $4, image_url = $5, is_available = $6
      WHERE id = $7
      RETURNING id, name, description, base_price, category_id, image_url, is_available, created_at
    `, [name, description || null, parseFloat(base_price), category_id, image_url || null, is_available !== false, id]);

    res.json({
      success: true,
      data: rows[0],
      message: "Product updated successfully"
    });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update product",
      message: error.message
    });
  }
});

// Delete product (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const productCheck = await pool.query("SELECT id, name FROM products WHERE id = $1", [id]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    // Delete product
    await pool.query("DELETE FROM products WHERE id = $1", [id]);

    res.json({
      success: true,
      message: `Product "${productCheck.rows[0].name}" deleted successfully`
    });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete product",
      message: error.message
    });
  }
});

module.exports = router;
