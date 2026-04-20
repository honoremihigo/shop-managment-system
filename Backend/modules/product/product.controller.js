const { createBulkProducts, getAllProducts, getProductById, updateProduct, deleteProduct } = require('./product.service');


const createProducts = async (req, res) => {
    const productData = req.body;
    try {
        const createdProducts = await createBulkProducts(productData);
        res.status(201).json({
            message: "Products created successfully",
            data: createdProducts,
            count: createdProducts.length
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


const getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    try {
        const products = await getAllProducts(page , limit);
        res.status(200).json({
            message: "Products retrieved successfully",
            data: products.products,
            totalProducts: products.totalProducts,
            totalPages: products.totalPages,
            productsPerPage: products.productsPerPage,
            currentPage: products.currentPage,
            prevPage: products.prevPage,
            nextPage: products.nextPage
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getOneProduct = async (req, res) => {
    const { id } = req.params;  
    try {
        const product = await getProductById(id);
        res.status(200).json({
            message: "Product retrieved successfully",
            data: product
        });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }   
}

const editProduct = async (req, res) => { 
    const { id } = req.params;
    const updateData = req.body;
    try {
        const updatedProduct = await updateProduct(id, updateData);
        res.status(200).json({  
            message: "Product updated successfully",
            data: updatedProduct
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const removeProduct = async (req, res) => {    
    const { id } = req.params;
    try {
        await deleteProduct(id);
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    createProducts,
    getProducts,
    getOneProduct,
    editProduct,
    removeProduct
}