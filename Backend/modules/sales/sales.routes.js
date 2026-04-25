// modules/sales/sale.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const { createBulkSales, getTodaySales, getAllSales, getSale } = require('./sales.controller');

// All routes require authentication
router.use(protect);

// Bulk create route (must come before /:id)
router.post('/', createBulkSales);

// Today's sales (must come before /:id)
router.get('/today', getTodaySales);


router.get('/', getAllSales);
router.get('/:id',getSale);

module.exports = router;