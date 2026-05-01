// modules/reports/report.service.js
const { sequelize } = require("../../config/database");
const { Product, Stock, Sale, Purchase, PurchasedItems, User } = require("../../models");
const { Op } = require("sequelize");

/**
 * Get dashboard overview statistics
 */
const getDashboardStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Get counts
    const totalProducts = await Product.count();
    const totalStockItems = await Stock.count();
    
    // Get stock value
    const allStock = await Stock.findAll({
        include: [{
            model: Product,
            as: 'product',
            attributes: ['name']
        }]
    });
    
    const stockValue = allStock.reduce((sum, stock) => {
        return sum + (stock.quantity * parseFloat(stock.costPrice || 0));
    }, 0);
    
    // Get low stock count (less than 10 items)
    const lowStockCount = await Stock.count({
        where: { quantity: { [Op.lt]: 10 } }
    });
    
    // Get out of stock count (zero items)
    const outOfStockCount = await Stock.count({
        where: { quantity: 0 }
    });
    
    // Get sales statistics
    const todaySales = await Sale.findAll({
        where: { createdAt: { [Op.gte]: today } }
    });
    
    const weekSales = await Sale.findAll({
        where: { createdAt: { [Op.gte]: startOfWeek } }
    });
    
    const monthSales = await Sale.findAll({
        where: { createdAt: { [Op.gte]: startOfMonth } }
    });
    
    const yearSales = await Sale.findAll({
        where: { createdAt: { [Op.gte]: startOfYear } }
    });
    
    // Get purchase statistics
    const monthPurchases = await Purchase.findAll({
        where: { supply_date: { [Op.gte]: startOfMonth } },
        include: [{
            model: PurchasedItems,
            as: 'purchasedItems'
        }]
    });
    
    const calculateSaleSummary = (sales) => {
        return sales.reduce((acc, sale) => {
            acc.totalSales++;
            acc.totalItems += sale.quantity;
            acc.totalRevenue += parseFloat(sale.totalPrice || 0);
            return acc;
        }, { totalSales: 0, totalItems: 0, totalRevenue: 0 });
    };
    
    const calculatePurchaseSummary = (purchases) => {
        return purchases.reduce((acc, purchase) => {
            acc.totalPurchases++;
            const purchaseTotal = purchase.purchasedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
            acc.totalAmount += purchaseTotal;
            acc.totalItems += purchase.purchasedItems.reduce((sum, item) => sum + item.quantity, 0);
            return acc;
        }, { totalPurchases: 0, totalAmount: 0, totalItems: 0 });
    };
    
    return {
        overview: {
            totalProducts,
            totalStockItems,
            stockValue: stockValue.toFixed(2),
            lowStockCount,
            outOfStockCount
        },
        sales: {
            today: calculateSaleSummary(todaySales),
            thisWeek: calculateSaleSummary(weekSales),
            thisMonth: calculateSaleSummary(monthSales),
            thisYear: calculateSaleSummary(yearSales)
        },
        purchases: {
            thisMonth: calculatePurchaseSummary(monthPurchases)
        }
    };
};

/**
 * Get sales report with date range
 */
const getSalesReport = async (startDate, endDate, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    
    const where = {};
    if (startDate && endDate) {
        where.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }
    
    const { count, rows } = await Sale.findAndCountAll({
        where,
        include: [
            {
                model: Stock,
                as: 'stock',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'unit']
                }]
            },
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            }
        ],
        order: [['createdAt', 'DESC']],
        offset,
        limit
    });
    
    // Calculate totals
    const totals = rows.reduce((acc, sale) => {
        acc.totalRevenue += parseFloat(sale.totalPrice || 0);
        acc.totalItems += sale.quantity;
        acc.totalSales++;
        return acc;
    }, { totalRevenue: 0, totalItems: 0, totalSales: 0 });
    
    // Group by date
    const salesByDate = rows.reduce((acc, sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { date, totalSales: 0, totalItems: 0, totalRevenue: 0 };
        }
        acc[date].totalSales++;
        acc[date].totalItems += sale.quantity;
        acc[date].totalRevenue += parseFloat(sale.totalPrice || 0);
        return acc;
    }, {});
    
    return {
        sales: rows,
        summary: totals,
        salesByDate: Object.values(salesByDate),
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
        }
    };
};

/**
 * Get purchase report with date range
 */
const getPurchaseReport = async (startDate, endDate, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    
    const where = {};
    if (startDate && endDate) {
        where.supply_date = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }
    
    const { count, rows } = await Purchase.findAndCountAll({
        where,
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            },
            {
                model: PurchasedItems,
                as: 'purchasedItems',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'unit']
                }]
            }
        ],
        order: [['supply_date', 'DESC']],
        offset,
        limit
    });
    
    // Calculate totals
    const totals = rows.reduce((acc, purchase) => {
        const purchaseTotal = purchase.purchasedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
        acc.totalAmount += purchaseTotal;
        acc.totalItems += purchase.purchasedItems.reduce((sum, item) => sum + item.quantity, 0);
        acc.totalPurchases++;
        return acc;
    }, { totalAmount: 0, totalItems: 0, totalPurchases: 0 });
    
    return {
        purchases: rows,
        summary: totals,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
        }
    };
};

/**
 * Get profit report (Sales - Cost)
 */
const getProfitReport = async (startDate, endDate) => {
    const where = {};
    if (startDate && endDate) {
        where.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }
    
    const sales = await Sale.findAll({
        where,
        include: [{
            model: Stock,
            as: 'stock',
            attributes: ['costPrice']
        }]
    });
    
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    
    const dailyProfit = {};
    
    sales.forEach(sale => {
        const date = sale.createdAt.toISOString().split('T')[0];
        const revenue = parseFloat(sale.totalPrice || 0);
        const cost = (sale.quantity * parseFloat(sale.stock?.costPrice || 0));
        const profit = revenue - cost;
        
        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;
        
        if (!dailyProfit[date]) {
            dailyProfit[date] = { date, revenue: 0, cost: 0, profit: 0 };
        }
        dailyProfit[date].revenue += revenue;
        dailyProfit[date].cost += cost;
        dailyProfit[date].profit += profit;
    });
    
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
        summary: {
            totalRevenue: totalRevenue.toFixed(2),
            totalCost: totalCost.toFixed(2),
            totalProfit: totalProfit.toFixed(2),
            profitMargin: profitMargin.toFixed(2)
        },
        dailyProfit: Object.values(dailyProfit),
        totalSales: sales.length
    };
};

/**
 * Get top selling products
 */
const getTopProducts = async (limit = 10, startDate, endDate) => {
    const where = {};
    if (startDate && endDate) {
        where.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }
    
    const sales = await Sale.findAll({
        where,
        include: [{
            model: Stock,
            as: 'stock',
            include: [{
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'unit']
            }]
        }]
    });
    
    const productSales = {};
    
    sales.forEach(sale => {
        const productId = sale.stock?.product?.id;
        const productName = sale.stock?.product?.name;
        
        if (productId) {
            if (!productSales[productId]) {
                productSales[productId] = {
                    productId,
                    productName,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[productId].quantity += sale.quantity;
            productSales[productId].revenue += parseFloat(sale.totalPrice || 0);
        }
    });
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
    
    return topProducts;
};

/**
 * Get low stock products (for alerts)
 */
const getLowStockProducts = async (threshold = 10, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Stock.findAndCountAll({
        where: {
            quantity: { [Op.lt]: threshold }
        },
        include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'unit']
        }],
        order: [['quantity', 'ASC']],
        offset,
        limit
    });
    
    return {
        lowStockItems: rows,
        totalItems: count,
        pagination: {
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
        }
    };
};

/**
 * Get daily sales report (last 7/30 days)
 */
const getDailySalesReport = async (days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const sales = await Sale.findAll({
        where: {
            createdAt: { [Op.gte]: startDate }
        },
        include: [{
            model: Stock,
            as: 'stock',
            include: [{
                model: Product,
                as: 'product'
            }]
        }]
    });
    
    const dailyData = {};
    
    // Initialize last 'days' days
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = {
            date: dateStr,
            sales: 0,
            items: 0,
            revenue: 0
        };
    }
    
    sales.forEach(sale => {
        const dateStr = sale.createdAt.toISOString().split('T')[0];
        if (dailyData[dateStr]) {
            dailyData[dateStr].sales++;
            dailyData[dateStr].items += sale.quantity;
            dailyData[dateStr].revenue += parseFloat(sale.totalPrice || 0);
        }
    });
    
    return Object.values(dailyData).reverse();
};

module.exports = {
    getDashboardStats,
    getSalesReport,
    getPurchaseReport,
    getProfitReport,
    getTopProducts,
    getLowStockProducts,
    getDailySalesReport
};