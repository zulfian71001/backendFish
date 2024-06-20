const router = require("express").Router();
const chatController = require("../controllers/chatController");
const {authMidleware} = require("../middlewares/authMiddleware");
router.post("/chat/customer/add-customer-friend", chatController.add_customer_friend);
router.post("/chat/customer/send-message-to-seller", chatController.add_customer_message);

router.get("/chat/seller/get-customers/:sellerId", chatController.get_customers);
router.get("/chat/seller/get-customer-message/:customerId",authMidleware, chatController.get_customer_seller_message);
router.post("/chat/seller/send-message-to-customer", chatController.add_seller_message);
router.get("/chat/get-admin-message/:receiverId", chatController.get_admin_message);
router.get("/chat/get-seller-message",authMidleware, chatController.get_seller_message);

router.get("/chat/admin/get-sellers", chatController.get_sellers);
router.post("/chat/admin/send-message-seller-admin", chatController.send_message_seller_admin);



module.exports = router;
