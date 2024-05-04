const router = require("express").Router();
const authController = require("../controllers/authController");
const {authMidleware} = require("../middlewares/authMiddleware");
router.post("/admin-login", authController.admin_login);
router.get("/get-user",authMidleware, authController.getUser);
router.post("/seller-register", authController.seller_register);
router.post("/seller-login",authController.seller_login)
router.post("/customer-login",authController.customer_login)
router.post("/customer-register", authController.customer_register);
router.post("/upload-image-profile",authMidleware,authController.upload_image_profile)
router.post("/add-info-profile",authMidleware,authController.add_info_profile)

module.exports = router;
