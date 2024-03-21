const mongoose = require("mongoose");
const db = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, { useNewURLParser: true });
    console.log("connect to database");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { db };
