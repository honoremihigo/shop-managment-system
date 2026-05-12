const { protect, authorize } = require("../../middleware/auth.middleware");
const { getProducts, getOneProduct, createProducts, editProduct, removeProduct } = require("./product.controller");

const router = require("express").Router();



router.get("/", protect, authorize("ADMIN", "USER"), getProducts)
router.get("/:id", protect, authorize("ADMIN", "USER"), getOneProduct)
router.post("/", protect, authorize("ADMIN",'USER'), createProducts)
router.put("/:id", protect, authorize("ADMIN", 'USER'), editProduct)
router.delete("/:id", protect, authorize("ADMIN"), removeProduct)

module.exports = router;