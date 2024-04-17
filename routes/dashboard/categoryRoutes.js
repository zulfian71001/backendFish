const router = require("express").Router();
const {authMidleware} = require("../../middlewares/authMiddleware")
const categoryController = require("../../controllers/dashboard/categoryController");
router.post("/add-category",authMidleware, categoryController.add_category);
router.get("/get-category",authMidleware, categoryController.get_category);

module.exports = router