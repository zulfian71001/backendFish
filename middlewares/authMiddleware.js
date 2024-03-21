const jwt = require("jsonwebtoken");
const authMidleware = async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    return res.status(401).json({ error: "Silahkan login terlebih dahulu" });
  } else {
    try {
      const decodedToken = jwt.verify(accessToken, process.env.SECRET);
      req.role = decodedToken.role;
      req.id = decodedToken.id;
      next();
    } catch (error) {
      return res.status(409).json({ error: "Silahkan login" });
    }
  }
};
module.exports = { authMidleware };
