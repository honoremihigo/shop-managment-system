// modules/reports/report.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth.middleware');
const { getLowStockProducts, getProfitReport, getPurchaseReport, getTopProducts, getDailySalesReport, getSalesReport, getDashboardStats } = require('./report.controller');

// All report routes require authentication
router.use(protect);

// Dashboard overview
router.get('/dashboard', getDashboardStats);

// Sales reports
router.get('/sales', getSalesReport);
router.get('/daily-sales', getDailySalesReport);
router.get('/top-products', getTopProducts);

// Purchase reports
router.get('/purchases', getPurchaseReport);

// Profit reports
router.get('/profit', getProfitReport);

// Stock reports
router.get('/low-stock', getLowStockProducts);

module.exports = router;