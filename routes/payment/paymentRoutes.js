const router = require("express").Router();
const paymentController = require("../../controllers/payment/paymentController.js")
router.post("/payment/process-transaction", paymentController.process_transaction);
router.post("/payment/notification-transaction", paymentController.notification_transaction);


module.exports = router;
