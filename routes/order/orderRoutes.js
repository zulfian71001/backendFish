const router = require("express").Router();
const orderController = require("../../controllers/order/orderController.js")
router.post("/home/order/place-order", orderController.place_order);
router.get("/home/order/get-orders/:customerId/:status", orderController.get_orders);
router.get("/home/order/get-order/:orderId", orderController.get_order);
router.get("/home/customer/get-dashboard-data/:userId", orderController.get_customer_dashboard_data);
router.put("/home/order/order-status-acceptance/:orderId", orderController. update_status_customer_acceptance);

router.get("/admin/get-dashboard-data", orderController.get_admin_dashboard_data);
router.get("/admin/get-orders", orderController.get_admin_orders);
router.get("/admin/get-order/:orderId", orderController.get_admin_order);
router.put("/admin/order-status/update/:orderId", orderController.admin_order_status_update);

router.get("/seller/get-orders/:sellerId", orderController.get_seller_orders);
router.get("/seller/get-dashboard-data/:userId", orderController.get_seller_dashboard_data);
router.get("/seller/get-order/:orderId", orderController.get_seller_order);
router.put("/seller/order-status/update/:orderId", orderController.seller_order_status_update);

module.exports = router;
