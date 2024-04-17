const router = require("express").Router();
const { authMidleware } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/dashboard/productController");
router.post("/add-product", authMidleware, productController.add_product);
router.get("/get-products", authMidleware, productController.get_products);
router.get("/get-product/:productId", authMidleware, productController.get_product);
router.post("/update-product", authMidleware, productController.update_product);
router.post("/update-product-image", authMidleware, productController.update_product_image);

module.exports = router;
