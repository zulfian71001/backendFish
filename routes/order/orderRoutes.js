const router = require("express").Router();
const orderController = require("../../controllers/order/orderController.js")
router.post("/order/place-order", orderController.place_order);


module.exports = router;
