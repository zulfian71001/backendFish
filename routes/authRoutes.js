const router = require("express").Router();
const authController = require("../controllers/authController");
const {authMidleware} = require("../middlewares/authMiddleware");
router.post("/admin-login", authController.admin_login);
router.get("/get-user",authMidleware, authController.getUser);

module.exports = router;
