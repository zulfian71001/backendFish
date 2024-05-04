const router = require("express").Router();
const {authMidleware} = require("../../middlewares/authMiddleware")
const categoryController = require("../../controllers/dashboard/categoryController");
router.post("/add-category",authMidleware, categoryController.add_category);
router.get("/get-category/:categoryId",authMidleware, categoryController.get_category);
router.get("/get-categories",authMidleware, categoryController.get_categories);
router.post("/update-categories",authMidleware, categoryController.get_categories);
router.delete("/delete-category/:categoryId",authMidleware, categoryController.delete_category);

module.exports = router