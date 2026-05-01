// modules/purchase/purchase.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth.middleware');
const { getAllPurchases, getPurchase, getPurchasesByDateRange, createPurchase } = require('./purchase.controller');

// All routes require authentication
router.use(protect);

// Admin only routes (purchases should be admin only)
router.post('/', authorize('ADMIN'), createPurchase);
router.get('/reports', authorize('ADMIN'), getPurchasesByDateRange);
router.get('/', authorize('ADMIN'),getAllPurchases);
router.get('/:id', authorize('ADMIN'), getPurchase);

module.exports = router;