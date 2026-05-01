// modules/purchase/purchase.controller.js
const { 
    createPurchase, 
    getAllPurchases, 
    getPurchase, 
    getPurchasesByDateRange 
} = require('./purchase.service');

/**
 * Create a purchase with multiple items
 * POST /api/purchases
 */
const createPurchaseHandler = async (req, res) => {
    try {
        const { supplier, supply_date, items } = req.body;
        const userId = req.user.id;
        
        const result = await createPurchase({
            supplier,
            supply_date,
            items,
            userId
        });
        
        res.status(201).json({
            success: true,
            message: `Purchase created successfully with ${result.count} items`,
            count: result.count,
            failed: result.failed,
            missingProductIds: result.missingProductIds,
            purchaseTotal: result.purchaseTotal,
            data: result.purchase
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all purchases with pagination
 * GET /api/purchases?page=1&limit=10
 */
const getAllPurchasesHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await getAllPurchases(page, limit);
        
        res.status(200).json({
            success: true,
            data: result.purchases,
            totalItems: result.totalItems,
            itemsPerPage: result.itemsPerPage,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            summary: result.summary
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get purchase by ID
 * GET /api/purchases/:id
 */
const getPurchaseHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await getPurchase(id);
        
        res.status(200).json({
            success: true,
            data: purchase
        });
        
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get purchases by date range
 * GET /api/purchases/reports?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=10
 */
const getPurchasesByDateRangeHandler = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }
        
        const result = await getPurchasesByDateRange(startDate, endDate, page, limit);
        
        res.status(200).json({
            success: true,
            data: result.purchases,
            totalItems: result.totalItems,
            itemsPerPage: result.itemsPerPage,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            summary: result.summary,
            dateRange: result.dateRange
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createPurchase: createPurchaseHandler,
    getAllPurchases: getAllPurchasesHandler,
    getPurchase: getPurchaseHandler,
    getPurchasesByDateRange: getPurchasesByDateRangeHandler
};