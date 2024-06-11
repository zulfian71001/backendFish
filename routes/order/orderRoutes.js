const router = require("express").Router();
const orderController = require("../../controllers/order/orderController.js")
router.post("/order/place-order", orderController.place_order);
router.get("/order/get-orders/:customerId/:status", orderController.get_orders);
router.get("/order/get-order/:orderId", orderController.get_order);
router.get("/customer/get-dashboard-data/:userId", orderController.get_customer_dashboard_data);


module.exports = router;
