const express = require("express");
const router = express.Router();

// Import feature-based route modules
router.use("/products", require("./products"));
router.use("/orders", require("./orders"));
router.use("/customers", require("./customers"));
router.use("/categories", require("./categories"));
router.use("/dashboard", require("./dashboard"));
router.use("/tables", require("./tables"));
router.use("/reservations", require("./reservations"));
router.use("/inventory", require("./inventory"));

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
