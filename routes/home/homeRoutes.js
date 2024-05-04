const router = require("express").Router();
const homeController = require("../../controllers/home/homeController.js")
router.get("/get-categories", homeController.get_categories);
router.get("/get-products", homeController.get_products);
router.get("/get-product/:productId", homeController.get_product);


module.exports = router;
