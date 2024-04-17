const express = require("express");
const { db } = require("./utils/db");
const app = express();
const cors = require("cors");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const port = process.env.PORT;

app.use(cors({
    origin: "http://localhost:3000",
    credentials:true
}));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser())
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/dashboard/categoryRoutes"));
app.use("/api", require("./routes/dashboard/productRoutes"));
app.use("/api", require("./routes/dashboard/sellerRoutes"));
app.get("/", (_, res) => {
  res.send("hello world");
});
db()
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
