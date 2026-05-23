// modules/sales/sale.controller.js
// ✅ IMPORT the functions directly (NOT an object called saleService)
const { 
    createBulkSales, 
    createSale, 
    getAllSales, 
    getSale, 
    getTodaySales
} = require('./sales.service');

/**
 * Create bulk sales (multiple sales at once)
 * POST /api/sales/bulk
 */
const createBulkSalesHandler = async (req, res) => {
    try {
        const { sales, paymentMethod, customerName, customerPhone } = req.body;
        const userId = req.user.id;
        
        const result = await createBulkSales(sales, userId, {
            paymentMethod: paymentMethod || 'cash',
            customerName,
            customerPhone,
            isStockAdjusted: true,   // always true for normal sales; could be made configurable in future
        });
        
        res.status(201).json({
            success: true,
            message: `Successfully added ${result.count} sales`,
            count: result.count,
            failed: result.failed,
            missingStockIds: result.missingStockIds,
            summary: result.summary,
            data: result.sales,
            debt: result.debt || null,
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
/**
 * Create single sale
 * POST /api/sales
 */
const createSaleHandler = async (req, res) => {
    try {
        const { stockId, quantity, soldPrice } = req.body;
        const userId = req.user.id;
        
        // ✅ Use the imported function directly
        const result = await createSale({
            stockId,
            quantity,
            soldPrice
        }, userId);
        
        res.status(201).json({
            success: true,
            message: "Sale recorded successfully",
            count: result.count,
            summary: result.summary,
            data: result.sale
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all sales with pagination
 * GET /api/sales?page=1&limit=10
 */
const getAllSalesHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        // ✅ Use the imported function directly
        const result = await getAllSales(page, limit);
        
        res.status(200).json({
            success: true,
            data: result.sales,
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
 * Get sale by ID
 * GET /api/sales/:id
 */
const getSaleHandler = async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ Use the imported function directly
        const sale = await getSale(id);
        
        res.status(200).json({
            success: true,
            data: sale
        });
        
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get today's sales
 * GET /api/sales/today
 */
const getTodaySalesHandler = async (req, res) => {
    try {
        // ✅ Use the imported function directly
        const result = await getTodaySales();
        
        res.status(200).json({
            success: true,
            totalSales: result.totalSales,
            summary: result.summary,
            data: result.sales
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createBulkSales: createBulkSalesHandler,
    createSale: createSaleHandler,
    getAllSales: getAllSalesHandler,
    getSale: getSaleHandler,
    getTodaySales: getTodaySalesHandler
};