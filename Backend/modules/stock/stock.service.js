//here we will add multiple stock on many stocks at the same time
//and we get there id to add them according to there

const { sequelize } = require("../../config/database")
const { Product, Stock } = require("../../models")


/** 
 * the properties of one stock
 * @param {Array<{
 *  product_id:string,
 *  quantity:number,
 *  costPrice:number,
 *  sellingPrice:number
 * }>} stockData - array of all stocks
 * @param {string} userId - the id of the one adding the stock
*/


const addingBulkStocks = async (stockData, userId) => {
    //first we check if the stockData is an array
    if(!Array.isArray(stockData)){
        throw new Error("stockData should be an array of stocks")
    }
    //then we check if the stockData is empty
    if(stockData.length === 0){
        throw new Error("stockData should not be empty")
    }
    //we continue with validations to see if the datas provided are there
    let errors = []
    let productIds = []
    stockData.forEach((stock, i)=>{
        if(!stock.product_id){
            errors.push(`stock${i} product id should not be empty`)
        }
        if(!stock.quantity){
            errors.push(`stock${i} quantity should not be empty`)
        }
        if(!stock.costPrice){
             errors.push(`stock${i} cost price should not be empty`)
        }
        if(!stock.sellingPrice){
             errors.push(`stock${i} selling price should not be empty`)
        }

        if(!stock.costPrice < 0 && !stock.sellingPrice < 0 ){
            errors.push(`stock${i} selling price or cost price  should not be negative`)
        }
        productIds.push(stock.product_id)
    })

    if(errors.length > 0){
        throw new Error(errors[0])
        console.log(errors)
    }

    if(productIds.length === 0){
        throw new Error("product should not be empty")
    }

    //here is checking all the  productIds are in the database before adding any record
    const products = await Product.findAll({
        where: { id: productIds }
    })

    //here am going to check the one which was not found
    let foundIds = products.map(p=> p.id)
    let missingIds = productIds.filter(id => !foundIds.includes(id))
    console.log("foundIds:", foundIds)
    console.log("missingIds:", missingIds)

    //here we create an array of final stock datas which were found and filtered
    const finalStockData = stockData
    .filter(stock=> foundIds.includes(stock.product_id))
    .map((stock)=>{
        return{
            productId: stock.product_id,
            quantity: stock.quantity,
            sellingPrice: stock.sellingPrice,
            costPrice: stock.costPrice
        }
    })

    //on this line of code we are starting the transaction
    const transaction = await sequelize.transaction()
    try {
        const createdStocks = await Stock.bulkCreate(finalStockData,{
            transaction,
            validate: true,
            returning: true
        })

        await transaction.commit()
        return{
            count: createdStocks.length,
            failed: missingIds.length
        }
    } catch (error) {
        console.error("error creating stocks:", error)
        await transaction.rollback()
        throw error
    }
}

/**
 * Get all stock records
 */
const getAllStock = async (page, limit) => {
    const offset = (page - 1) * limit
    const { count, rows } = await Stock.findAndCountAll({
        include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'unit']
        }],
        order: [['createdAt', 'DESC']],
        offset:offset,
        limit: limit
    });

    const totalPages = Math.ceil(count/limit)

    return{
        stocks: rows,
        totalItems: count,
        itemPerPage: limit,
        currentPage: page,
        totalPages: totalPages,
        prevPage: page > 1,
        nextPage: page < totalPages
    }
};

/**
 * Get stock by product ID
 */
const getStock = async (id) => {
    const stock = await Stock.findOne({
        where: { id: id },
        include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'unit']
        }]
    });
    
    if (!stock) {
        throw new Error("Stock not found for this product");
    }
    
    return stock;
};

/**
 * Update stock for a single product
 */
const updateStock = async (id, updateData) => {
    const stock = await Stock.findOne({
        where: { id: id }
    });
    
    if (!stock) {
        throw new Error("Stock not found for this product");
    }
    
    if (!updateData.quantity && !updateData.costPrice && !updateData.sellingPrice) {
        throw new Error("No valid fields to update");
    }
    
    if (updateData.quantity !== undefined) {
        if (updateData.quantity < 0) {
            throw new Error("Quantity cannot be negative");
        }
        stock.quantity = updateData.quantity;
    }
    
    if (updateData.costPrice !== undefined) {
        if (updateData.costPrice < 0) {
            throw new Error("Cost price cannot be negative");
        }
        stock.costPrice = updateData.costPrice;
    }
    
    if (updateData.sellingPrice !== undefined) {
        if (updateData.sellingPrice < 0) {
            throw new Error("Selling price cannot be negative");
        }
        stock.sellingPrice = updateData.sellingPrice;
    }
    
    await stock.save();
    return stock;
};

/**
 * Delete stock
 */
const deleteStock = async (id) => {
    const stock = await Stock.findOne({
        where: { id: id }
    });
    
    if (!stock) {
        throw new Error("Stock not found for this product");
    }
    
    await stock.destroy();
    return true;
};

module.exports = {
    addingBulkStocks,
    getAllStock,
    getStock,
    updateStock,
    deleteStock
};