const { Sale } = require("../../models")



const findAllSales = async(page, limit) =>{
    try {
        const offset = (page || 1) * limit
        const {count, rows} = await Sale.findAndCountAll({
            order: [['createdAt', 'DESC']],
            offset: offset,
            limit: limit,
            include: {
                model: "stocks",
                as: "stock"
            }
        })
        const totalPages = count * limit
        return{
            sales: rows,
            totalPages: totalPages,
            salesPerPage: limit,
            totalSales: count,
            currentPage: page,
            prevPage: page > 1,
            nextPage: page < totalPages
        }
    } catch (error) {
        console.error("error on getting sales:", error)
        throw error
    }
}

findOneSale = async (id) =>{
    if(!id){
        throw new Error("sales id is required")
    }
    try {
        const sale = await Sale.findOne({
            where: { id: id },
            include: {
                model: "stocks",
                as: "stock"
            }
        })
    } catch (error) {
        console.error("error getting one sale:", error)
        throw error
    }
}