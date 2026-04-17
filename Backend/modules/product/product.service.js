const { sequelize } = require("../../config/database");
const Product = require("../../models/Product");

// Create new bulk products or creating many products at once
const createBulkProducts = async (productData) => {
  if (!Array.isArray(productData) || productData.length === 0) {
    throw new Error("Product data must be a non-empty array");
  }
  //validation each product data object
  let errors = [];
  productData.forEach((product, index) => {
    if (!product.name || typeof product.name !== "string") {
      errors.push(`Product at index ${index} is missing a valid name`);
    }
    if (
      product.unit &&
      ![
        "piece",
        "pack",
        "bottle",
        "can",
        "carton",
        "box",
        "bag",
        "kg",
        "g",
        "L",
        "ml",
        "loaf",
      ].includes(product.unit)
    ) {
      errors.push(`Product at index ${index} has an invalid unit`);
    }
  });

  if (errors.length > 0) {
    console.error("Validation errors:", errors);
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

    const transaction = await sequelize.transaction();
  try {
    const createdProducts = await Product.bulkCreate(productData, {
      transaction,
      validate: true,
      returning: true,
    });
    await transaction.commit();
    return createdProducts;
  } catch (error) {
    console.error("Error creating products:", error);
    await transaction.rollback();
    throw error;
  }
};

const getAllProducts = async () => {
  return await Product.findAll();
};

const getProductById = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    console.error(`Product with id ${id} not found`);
    throw new Error("Product not found");
  }
  return product;
};


const updateProduct = async (id, updateData) => {
  const product = await getProductById(id);

    if(!updateData.name && !updateData.unit){
        throw new Error("No valid fields to update");
    }

    if(!product){
        console.error(`Product with id ${id} not found for update`);
        throw new Error("Product not found");
    }

    if (updateData.name) {
        product.name = updateData.name;
    }
    if (updateData.unit) {
        if (![
            "piece",
            "pack",
            "bottle",
            "can",
            "carton",
            "box",
            "bag",
            "kg",
            "g",
            "L",
            "ml",
            "loaf",
        ].includes(updateData.unit)) {
            console.error(`Product with id ${id} has an invalid unit`);
            throw new Error("Invalid unit");
        }
        product.unit = updateData.unit;
    }
    await product.save();
    return product;
};


const deleteProduct = async (id) => {
  const product = await getProductById(id);
    if (!product) {
        console.error(`Product with id ${id} not found for deletion`);
        throw new Error("Product not found");
    }
    await product.destroy();
    return product;
};


module.exports = {
  createBulkProducts,
  getAllProducts,
  getProductById,
  updateProduct,
    deleteProduct,
};
