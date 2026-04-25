// modules/sales/sale.service.js - CORRECTED VERSION
const { Op } = require("sequelize");
const { sequelize } = require("../../config/database");
const { Sale, Stock, Product, User } = require("../../models");

/**
 * Create multiple sales in one go (bulk sales)
 * @param {Array<{
 *  stockId:string,
 *  quantity:number,
 *  soldPrice:number
 * }>} salesData - array of all sales
 * @param {string} userId - the id of the one making the sale
 */
const createBulkSales = async (salesData, userId) => {
  // First we check if the salesData is an array
  if (!Array.isArray(salesData)) {
    throw new Error("salesData should be an array of sales");
  }

  // Then we check if the salesData is empty
  if (salesData.length === 0) {
    throw new Error("salesData should not be empty");
  }

  // We continue with validations to see if the datas provided are there
  let errors = [];
  let stockIds = [];

  salesData.forEach((sale, i) => {
    if (!sale.stockId) {
      errors.push(`sale${i} stockId should not be empty`);
    }
    if (!sale.quantity) {
      errors.push(`sale${i} quantity should not be empty`);
    }
    if (!sale.soldPrice && sale.soldPrice !== 0) {
      errors.push(`sale${i} sold price should not be empty`);
    }
    if (sale.quantity < 0) {
      errors.push(`sale${i} quantity should not be negative`);
    }
    if (sale.soldPrice < 0) {
      errors.push(`sale${i} sold price should not be negative`);
    }

    if (sale.stockId) {
      stockIds.push(sale.stockId);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  if (stockIds.length === 0) {
    throw new Error("stockIds should not be empty");
  }

  // Here is checking all the stockIds are in the database before adding any record
  const stocks = await Stock.findAll({
    where: { id: stockIds },
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "unit"],
      },
    ],
  });

  // Here am going to check the one which was not found
  let foundIds = stocks.map((s) => s.id);
  let missingIds = stockIds.filter((id) => !foundIds.includes(id));
  console.log("foundIds:", foundIds);
  console.log("missingIds:", missingIds);

  // Check stock availability for found stocks
  let availabilityErrors = [];
  let validStocks = [];

  stocks.forEach((stock) => {
    const matchingSale = salesData.find((sale) => sale.stockId === stock.id);
    if (matchingSale && stock.quantity < matchingSale.quantity) {
      availabilityErrors.push(
        `Insufficient stock for ${stock.product.name}: Available ${stock.quantity}, Requested ${matchingSale.quantity}`,
      );
    } else if (matchingSale) {
      validStocks.push({
        stock: stock,
        sale: matchingSale,
      });
    }
  });

  if (availabilityErrors.length > 0) {
    throw new Error(availabilityErrors.join("; "));
  }

  // Here we create an array of final sale datas which were found and filtered
  const finalSalesData = validStocks.map(({ stock, sale }) => {
    const soldPrice = parseFloat(sale.soldPrice);
    const quantity = parseInt(sale.quantity);
    const totalPrice = soldPrice * quantity;

    return {
      stockId: stock.id,
      userId: userId,
      quantity: quantity,
      soldPrice: soldPrice,
      totalPrice: totalPrice,
    };
  });

  if (foundIds.length === 0) {
    throw new Error("no sale happened because all stockIds were invalid");
  }

  // On this line of code we are starting the transaction
  const transaction = await sequelize.transaction();

  try {
    // Create all sale records
    const createdSales = await Sale.bulkCreate(finalSalesData, {
      transaction,
      validate: true,
    });

    // Update stock quantities for each sale
    for (const { stock, sale } of validStocks) {
      const newQuantity = stock.quantity - parseInt(sale.quantity);
      await Stock.update(
        { quantity: newQuantity },
        { where: { id: stock.id }, transaction },
      );
    }

    await transaction.commit();

    // Fetch the created sales with their relations
    const saleIds = createdSales.map((sale) => sale.id);
    const completeSales = await Sale.findAll({
      where: { id: saleIds },
      include: [
        {
          model: Stock,
          as: "stock",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "unit"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "role"],
        },
      ],
    });

    // Calculate summary
    const summary = {
      totalSales: finalSalesData.length,
      totalItems: finalSalesData.reduce((sum, s) => sum + s.quantity, 0),
      totalRevenue: finalSalesData.reduce((sum, s) => sum + s.totalPrice, 0),
    };

    return {
      count: createdSales.length,
      failed: missingIds.length,
      missingStockIds: missingIds,
      summary: summary,
      sales: completeSales,
    };
  } catch (error) {
    console.error("error creating sales:", error);
    await transaction.rollback();
    throw error;
  }
};

/**
 * Create a single sale (wrapper for bulk sales)
 */
const createSale = async (saleData, userId) => {
  const result = await createBulkSales([saleData], userId);
  return {
    count: result.count,
    sale: result.sales[0],
    summary: result.summary,
  };
};

/**
 * Get all sales with pagination
 */
const getAllSales = async (page, limit) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Sale.findAndCountAll({
    include: [
      {
        model: Stock,
        as: "stock",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "unit"],
          },
        ],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "role"],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset: offset,
    limit: limit,
  });

  const totalPages = Math.ceil(count / limit);

  // Calculate summary for current page
  const pageSummary = rows.reduce(
    (acc, sale) => {
      acc.totalRevenue += parseFloat(sale.totalPrice);
      acc.totalItems += sale.quantity;
      acc.totalSales = rows.length;
      return acc;
    },
    { totalRevenue: 0, totalItems: 0 , totalSales: 0},
  );

  return {
    sales: rows,
    totalItems: count,
    itemsPerPage: limit,
    currentPage: page,
    totalPages: totalPages,
    prevPage: page > 1,
    nextPage: page < totalPages,
    summary: pageSummary,
  };
};

/**
 * Get sale by ID
 */
const getSale = async (id) => {
  const sale = await Sale.findOne({
    where: { id: id },
    include: [
      {
        model: Stock,
        as: "stock",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "unit"],
          },
        ],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "email", "role"],
      },
    ],
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  return sale;
};

/**
 * Get today's sales summary
 */
const getTodaySales = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, rows } = await Sale.findAndCountAll({
    where: {
      createdAt: {
        [Op.gte]: today,
      },
    },
    include: [
      {
        model: Stock,
        as: "stock",
        include: [
          {
            model: Product,
            as: "product",
            attributes: ["id", "name", "unit"],
          },
        ],
      },
    ],
  });

  const summary = rows.reduce(
    (acc, sale) => {
      acc.totalRevenue += parseFloat(sale.totalPrice);
      acc.totalSales += 1;
      return acc;
    },
    { totalRevenue: 0, totalSales: 0 },
  );

  return {
    totalSales: count,
    summary: summary,
    sales: rows,
  };
};

module.exports = {
  createBulkSales,
  createSale,
  getAllSales,
  getSale,
  getTodaySales,
};
