const router = require("express").Router();
const { protect, authorize } = require("../../middleware/auth.middleware");
const { getDebts, getDebt, addPayment, createLegacyDebt } = require("./debt.controller");

router.use(protect);

router.get("/", authorize("ADMIN", "USER"), getDebts);
router.get("/:id", authorize("ADMIN", "USER"), getDebt);
router.post("/:id/payments", authorize("ADMIN", "USER"), addPayment);
router.post("/legacy", authorize("ADMIN", "USER"), createLegacyDebt);   // new endpoint for old debts

module.exports = router;