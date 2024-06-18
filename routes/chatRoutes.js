const router = require("express").Router();
const chatController = require("../controllers/chatController");
const {authMidleware} = require("../middlewares/authMiddleware");
router.post("/chat/customer/add-customer-friend", chatController.add_customer_friend);
router.post("/chat/customer/send-message-to-seller", chatController.add_customer_message);

router.get("/chat/seller/get-customers/:sellerId", chatController.get_customers);
router.get("/chat/seller/get-customer-message/:customerId",authMidleware, chatController.get_customer_seller_message);
router.post("/chat/seller/send-message-to-customer", chatController.add_seller_message);


module.exports = router;
