const jwt = require("jsonwebtoken");

const createToken = (data) => {
  const token = jwt.sign(data, process.env.SECRET, {
    expiresIn: "1d",
  });
  return token;
};

module.exports = { createToken };
