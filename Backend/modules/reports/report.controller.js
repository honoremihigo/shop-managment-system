// modules/reports/report.controller.js
const {
    getDashboardStats,
    getSalesReport,
    getPurchaseReport,
    getProfitReport,
    getTopProducts,
    getLowStockProducts,
    getDailySalesReport
} = require('./report.service');

/**
 * Get dashboard overview statistics
 * GET /api/reports/dashboard
 */
const getDashboardStatsHandler = async (req, res) => {
    try {
        const stats = await getDashboardStats();
        
        res.status(200).json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get sales report with date range
 * GET /api/reports/sales?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20
 */
const getSalesReportHandler = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 20 } = req.query;
        
        const result = await getSalesReport(startDate, endDate, parseInt(page), parseInt(limit));
        
        res.status(200).json({
            success: true,
            summary: result.summary,
            salesByDate: result.salesByDate,
            data: result.sales,
            pagination: result.pagination
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get purchase report with date range
 * GET /api/reports/purchases?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20
 */
const getPurchaseReportHandler = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 20 } = req.query;
        
        const result = await getPurchaseReport(startDate, endDate, parseInt(page), parseInt(limit));
        
        res.status(200).json({
            success: true,
            summary: result.summary,
            data: result.purchases,
            pagination: result.pagination
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get profit report
 * GET /api/reports/profit?startDate=2024-01-01&endDate=2024-01-31
 */
const getProfitReportHandler = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const result = await getProfitReport(startDate, endDate);
        
        res.status(200).json({
            success: true,
            data: result
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get top selling products
 * GET /api/reports/top-products?limit=10&startDate=2024-01-01&endDate=2024-01-31
 */
const getTopProductsHandler = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;
        
        const topProducts = await getTopProducts(parseInt(limit), startDate, endDate);
        
        res.status(200).json({
            success: true,
            data: topProducts
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get low stock products
 * GET /api/reports/low-stock?threshold=10&page=1&limit=20
 */
const getLowStockProductsHandler = async (req, res) => {
    try {
        const { threshold = 10, page = 1, limit = 20 } = req.query;
        
        const result = await getLowStockProducts(
            parseInt(threshold),
            parseInt(page),
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            data: result.lowStockItems,
            totalItems: result.totalItems,
            pagination: result.pagination
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get daily sales report (last 7/30 days)
 * GET /api/reports/daily-sales?days=7
 */
const getDailySalesReportHandler = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        
        const result = await getDailySalesReport(parseInt(days));
        
        res.status(200).json({
            success: true,
            data: result
        });
        
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDashboardStats: getDashboardStatsHandler,
    getSalesReport: getSalesReportHandler,
    getPurchaseReport: getPurchaseReportHandler,
    getProfitReport: getProfitReportHandler,
    getTopProducts: getTopProductsHandler,
    getLowStockProducts: getLowStockProductsHandler,
    getDailySalesReport: getDailySalesReportHandler
};