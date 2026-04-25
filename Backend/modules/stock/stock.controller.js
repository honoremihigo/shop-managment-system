const { addingBulkStocks, getAllStock, getStockByProductId, updateStock, deleteStock, getStock } = require('./stock.service');

/**
 * Create bulk stocks
 * POST /api/stock
 */
const createStocks = async (req, res) => {
    const stockData = req.body;
    const userId = req.user.id;
    
    try {
        const result = await addingBulkStocks(stockData, userId);
        
        res.status(201).json({
            success: true,
            message: `Successfully created ${result.count.length} stock records`,
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
 * Get all stock records
 * GET /api/stock
 */
const getStocks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = 5
        const stocks = await getAllStock(page, limit);
        res.status(200).json({
            success: true,
            message: "Stock records retrieved successfully",
            data: stocks.stocks,
            totalPages: stocks.totalPages,
            totalItems:stocks.totalItems,
            currentPage: stocks.currentPage,
            itemPerPage: stocks.itemPerPage,
            prevPage:stocks.prevPage,
            nextPage:stocks.nextPage
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Get single stock by product ID
 * GET /api/stock/:productId
 */
const getOneStock = async (req, res) => {
    const { id } = req.params;
    
    try {
        const stock = await getStock(id);
        
        res.status(200).json({
            success: true,
            message: "Stock record retrieved successfully",
            data: stock
        });
    } catch (error) {
        if (error.message === 'Stock not found for this product') {
            return res.status(404).json({ 
                success: false,
                message: error.message 
            });
        }
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Update stock
 * PUT /api/stock/:productId
 */
const editStock = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    try {
        const updatedStock = await updateStock(id, updateData);
        
        res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            data: updatedStock
        });
    } catch (error) {
        if (error.message === 'Stock not found for this product') {
            return res.status(404).json({ 
                success: false,
                message: error.message 
            });
        }
        if (error.message.includes('cannot be negative') || error.message.includes('No valid fields')) {
            return res.status(400).json({ 
                success: false,
                message: error.message 
            });
        }
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Delete stock
 * DELETE /api/stock/:productId
 */
const removeStock = async (req, res) => {
    const { id } = req.params;
    
    try {
        await deleteStock(id);
        
        res.status(200).json({
            success: true,
            message: "Stock deleted successfully"
        });
    } catch (error) {
        if (error.message === 'Stock not found for this product') {
            return res.status(404).json({ 
                success: false,
                message: error.message 
            });
        }
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    createStocks,
    getStocks,
    getOneStock,
    editStock,
    removeStock
};