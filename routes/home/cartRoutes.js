const router = require("express").Router();
const cartController = require("../../controllers/home/cartController.js")
router.post("/home/product/add-to-cart", cartController.add_to_cart);
router.get("/home/product/get-products-cart/:userId", cartController.get_products_cart);
router.delete("/home/product/delete-products-cart/:cartId", cartController.delete_products_cart);
router.put("/home/product/quantity-inc/:cartId", cartController.quantity_inc);
router.put("/home/product/quantity-dec/:cartId", cartController.quantity_dec);


module.exports = router;
