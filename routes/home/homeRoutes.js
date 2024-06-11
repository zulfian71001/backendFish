const router = require("express").Router();
const homeController = require("../../controllers/home/homeController.js")
router.get("/get-categories", homeController.get_categories);
router.get("/get-products", homeController.get_products);
router.get("/get-product/:productId", homeController.get_product);
router.get("/query-products", homeController.query_products);
router.get("/search-products", homeController.search_products);
router.post("/customer/submit-review", homeController.submit_review);
router.get("/customer/get-reviews/:productId", homeController.get_reviews);


module.exports = router;
