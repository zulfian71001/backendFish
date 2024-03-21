const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel");
const { createToken } = require("../utils/tokenCreate");
const responseReturn = require("../utils/response");
const admin_login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await adminModel.findOne({ email }).select("+password");

    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      console.log(admin);
      if (match) {
        const token = createToken({
          id: admin.id,
          role: admin.role,
        });
        res.cookie("accessToken", token, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        console.log(token);
        return responseReturn(res, 200, { token, message: "login berhasil" });
      } else {
        console.log("password salah");
        return responseReturn(res, 400, { error: "password anda salah" });
      }
    } else {
      return responseReturn(res, 404, { error: "email tidak ditemukan" });
    }
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};
const getUser = async (req, res) => {
  const { id, role } = req;
  try {
    if (role === "admin") {
      const user = await adminModel.findById(id);
      responseReturn(res, 200, { userInfo: user });
    } else {
      console.log("seller");
    }
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = { admin_login, getUser };
