const express = require("express");
const router = express.Router();

// Import authentication middleware
const { authenticateAdmin } = require("../middleware/auth");

// Import feature-based route modules
router.use("/auth", require("./auth")); // Authentication routes (no auth required)
router.use("/products", authenticateAdmin, require("./products"));
router.use("/orders", authenticateAdmin, require("./orders"));
router.use("/customers", authenticateAdmin, require("./customers"));
router.use("/categories", authenticateAdmin, require("./categories"));
router.use("/dashboard", authenticateAdmin, require("./dashboard"));
router.use("/tables", authenticateAdmin, require("./tables"));
router.use("/reservations", authenticateAdmin, require("./reservations"));
router.use("/inventory", authenticateAdmin, require("./inventory"));
router.use("/restaurant", authenticateAdmin, require("./restaurant"));

// Legacy endpoints for backward compatibility
router.get("/products", async (req, res) => {
  // Redirect to new products route
  res.redirect("/api/admin/products");
});

router.get("/orders", async (req, res) => {
  // Redirect to new orders route
  res.redirect("/api/admin/orders");
});

router.get("/customers", async (req, res) => {
  // Redirect to new customers route
  res.redirect("/api/admin/customers");
});

router.get("/categories", async (req, res) => {
  // Redirect to new categories route
  res.redirect("/api/admin/categories");
});

router.get("/dashboard", async (req, res) => {
  // Redirect to new dashboard route
  res.redirect("/api/admin/dashboard");
});

module.exports = router;
