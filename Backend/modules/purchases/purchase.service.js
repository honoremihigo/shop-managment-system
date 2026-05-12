// modules/purchase/purchase.service.js
const { sequelize } = require("../../config/database");
const { Purchase, PurchasedItems, Product, Stock, User } = require("../../models");

/**
 * Create a single purchase with multiple items
 * @param {Object} purchaseData - Purchase data
 * @param {string} purchaseData.supplier - Supplier name
 * @param {string} purchaseData.supply_date - Date of supply
 * @param {Array} purchaseData.items - Array of purchased items
 * @param {string} purchaseData.userId - ID of user making the purchase
 */
const createPurchase = async (purchaseData) => {
    const { supplier, supply_date, items, userId } = purchaseData;
    
    // First we check if the items is an array
    if (!Array.isArray(items)) {
        throw new Error("Items should be an array of purchased items");
    }
    
    // Then we check if items is empty
    if (items.length === 0) {
        throw new Error("Items should not be empty");
    }
    
    // We continue with validations to see if the datas provided are there
    let errors = [];
    let productIds = [];
    
    items.forEach((item, i) => {
        if (!item.productId) {
            errors.push(`item${i} productId should not be empty`);
        }
        if (!item.quantity) {
            errors.push(`item${i} quantity should not be empty`);
        }
        if (!item.price) {
            errors.push(`item${i} price should not be empty`);
        }
        if (item.quantity < 0) {
            errors.push(`item${i} quantity should not be negative`);
        }
        if (item.price < 0) {
            errors.push(`item${i} price should not be negative`);
        }
        
        if (item.productId) {
            productIds.push(item.productId);
        }
    });
    
    if (errors.length > 0) {
        throw new Error(errors[0]);
    }
    
    if (productIds.length === 0) {
        throw new Error("Product IDs should not be empty");
    }
    
    // Here is checking all the productIds are in the database before adding any record
    const products = await Product.findAll({
        where: { id: productIds }
    });
    
    // Here am going to check the one which was not found
    let foundIds = products.map(p => p.id);
    let missingIds = productIds.filter(id => !foundIds.includes(id));
    console.log("foundIds:", foundIds);
    console.log("missingIds:", missingIds);
    
    if (missingIds.length > 0) {
        throw new Error(`Products with IDs [${missingIds.join(", ")}] were not found`);
    }
    
    // Create a map for quick product lookup
    const productMap = {};
    products.forEach(p => {
        productMap[p.id] = p;
    });
    
    // Prepare final items with calculated totalPrice
    const finalItems = items
        .filter(item => foundIds.includes(item.productId))
        .map((item) => {
            const quantity = parseInt(item.quantity);
            const price = parseFloat(item.price);
            const totalPrice = quantity * price;
            
            return {
                productId: item.productId,
                quantity: quantity,
                price: price,
                totalPrice: totalPrice
            };
        });
    
    // Calculate purchase total
    const purchaseTotal = finalItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // On this line of code we are starting the transaction
    const transaction = await sequelize.transaction();
    
    try {
        // 1. Create the purchase record
        const purchase = await Purchase.create({
            supplier: supplier || null,
            supply_date: supply_date || new Date(),
            userId: userId
        }, { transaction });
        
        // 2. Create all purchased items with the purchaseId
        const purchasedItemsWithId = finalItems.map(item => ({
            ...item,
            purchaseId: purchase.id
        }));
        
        const createdItems = await PurchasedItems.bulkCreate(purchasedItemsWithId, {
            transaction,
            validate: true
        });
        
        // 3. Update stock for each product
        for (const item of finalItems) {
            // Find existing stock for this product
            let stock = await Stock.findOne({
                where: { productId: item.productId },
                transaction
            });
            
            if (stock) {
                // If stock exists, add to existing quantity
                stock.quantity = stock.quantity + item.quantity;
                await stock.save({ transaction });
            } else {
                // If stock doesn't exist, create new stock record
                await Stock.create({
                    productId: item.productId,
                    quantity: item.quantity,
                    costPrice: item.price,
                    sellingPrice: item.price * 1.3, // Default selling price (30% markup)
                    addedBy: userId
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        // Fetch the complete purchase with all relations
        const completePurchase = await Purchase.findOne({
            where: { id: purchase.id },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email', 'role']
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
            ]
        });
        
        return {
            count: createdItems.length,
            failed: missingIds.length,
            missingProductIds: missingIds,
            purchaseTotal: purchaseTotal,
            purchase: completePurchase
        };
        
    } catch (error) {
        console.error("error creating purchase:", error);
        await transaction.rollback();
        throw error;
    }
};

/**
 * Get all purchases with pagination
 */
const getAllPurchases = async (page, limit) => {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Purchase.findAndCountAll({
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'role']
            },
            {
                model: PurchasedItems,           // ← uncomment this
                as: 'purchasedItems',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'unit']
                }]
            }
        ],
        order: [['createdAt', 'DESC']],
        offset: offset,
        limit: limit
    });
    
    const totalPages = Math.ceil(count / limit);
    
    // Calculate proper summary for the current page
    const pageSummary = rows.reduce((acc, purchase) => {
        const purchaseTotal = purchase.purchasedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        acc.totalPurchases++;
        acc.totalItems += purchase.purchasedItems.reduce((sum, item) => sum + item.quantity, 0);
        acc.totalAmount += purchaseTotal;
        return acc;
    }, { totalPurchases: 0, totalItems: 0, totalAmount: 0 });
    
    return {
        purchases: rows,
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
        prevPage: page > 1,
        nextPage: page < totalPages,
        summary: pageSummary
    };
};

/**
 * Get purchase by ID
 */
const getPurchase = async (id) => {
    const purchase = await Purchase.findOne({
        where: { id: id },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'role']
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
        ]
    });
    
    if (!purchase) {
        throw new Error("Purchase not found");
    }
    
    return purchase;
};

/**
 * Get purchases by date range
 */
const getPurchasesByDateRange = async (startDate, endDate, page, limit) => {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Purchase.findAndCountAll({
        where: {
            supply_date: {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            }
        },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'email', 'role']
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
        offset: offset,
        limit: limit
    });
    
    const totalPages = Math.ceil(count / limit);
    
    const summary = rows.reduce((acc, purchase) => {
        const purchaseTotal = purchase.purchasedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        acc.totalPurchases++;
        acc.totalItems += purchase.purchasedItems.reduce((sum, item) => sum + item.quantity, 0);
        acc.totalAmount += purchaseTotal;
        return acc;
    }, { totalPurchases: 0, totalItems: 0, totalAmount: 0 });
    
    return {
        purchases: rows,
        totalItems: count,
        itemsPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
        prevPage: page > 1,
        nextPage: page < totalPages,
        summary: summary,
        dateRange: { startDate, endDate }
    };
};

module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchase,
    getPurchasesByDateRange
};