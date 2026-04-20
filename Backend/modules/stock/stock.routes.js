const { protect, authorize } = require("../../middleware/auth.middleware");
const { createStocks, getStocks, getOneStock, editStock, removeStock } = require("./stock.controller");

const router = require("express").Router();

// All routes require authentication
router.use(protect);

// Read routes - Any authenticated user
router.get("/", authorize("ADMIN", "USER"), getStocks);
router.get("/:id", authorize("ADMIN", "USER"), getOneStock);

// Write routes - Admin only
router.post("/", authorize("ADMIN","USER"), createStocks);
router.put("/:id", authorize("ADMIN","USER   "), editStock);
router.delete("/:id", authorize("ADMIN"), removeStock);

module.exports = router;