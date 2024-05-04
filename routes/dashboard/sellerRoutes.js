const router = require("express").Router();
const {authMidleware} = require("../../middlewares/authMiddleware")
const sellerController = require("../../controllers/dashboard/sellerController");
// router.post("/add-seller",authMidleware, sellerController.add_seller);
router.get("/get-request-seller",authMidleware, sellerController.get_request_seller);
router.post("/update-status-seller",authMidleware, sellerController.update_status_seller);
router.get("/get-seller/:sellerId",authMidleware, sellerController.get_seller);
router.get("/get-sellers",authMidleware, sellerController.get_sellers);

module.exports = router