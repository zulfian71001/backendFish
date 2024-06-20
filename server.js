const express = require("express");
const { db } = require("./utils/db");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const socket = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "https://iwak-mart.vercel.app",
    credentials: true,
  })
);

const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

let allCustomer = [];
let allSeller = [];
const addUser = (customerId, socketId, userInfo) => {
  const checkUser = allCustomer.some((u) => u.customerId === customerId);
  if (!checkUser) {
    allCustomer.push({ customerId, socketId, userInfo });
  }
};

const addSeller = (sellerId, socketId, userInfo) => {
  const checkSeller = allSeller.some((u) => u.sellerId === sellerId);
  if (!checkSeller) {
    allSeller.push({ sellerId, socketId, userInfo });
  }
};

const findCustomer = (customerId) => {
  return allCustomer.find((f) => f.customerId === customerId);
};
const findSeller = (sellerId) => {
  return allSeller.find((f) => f.sellerId === sellerId);
};

const remove = (socketId)=>{
  allCustomer = allCustomer.filter(c=>c.socketId !== socketId)
  allSeller = allSeller.filter(c=>c.socketId !== socketId)
}

const removeAdmin = (socketId)=>{
  if(admin.socketId === socketId){
    admin = {}
  }
}

let admin = {}

io.on("connection", (socket) => {
  console.log("socket server is connected");
 
  socket.on("add_user", (customerId, userInfo) => {
    addUser(customerId, socket.id, userInfo);
    io.emit('activeSeller', allSeller)
    io.emit('activeCustomer', allCustomer)
  });
  socket.on("add_seller", (sellerId, userInfo) => {
    addSeller(sellerId, socket.id, userInfo);
    io.emit('activeSeller', allSeller)
  });
  socket.on("add_admin", (adminInfo) => {
    delete adminInfo.email
    admin = adminInfo
    admin.socketId = socket.id
    io.emit('activeSeller', allSeller)
    io.emit('activeAdmin', {status:true})

  });
  socket.on("send_seller_message", (msg) => {
    const customer = findCustomer(msg.receiverId);
    if (customer !== undefined) {
      socket.to(customer.socketId).emit("seller_message", msg);
    }
  });
  socket.on("send_customer_message", (msg) => {
    const seller = findSeller(msg.receiverId);
    console.log(seller)
    if (seller !== undefined) {
      socket.to(seller.socketId).emit("customer_message", msg);
    }
  });
  socket.on("send_message_admin_to_seller", (msg) => {
    const seller = findSeller(msg.receiverId);
    if (seller !== undefined) {
      socket.to(seller.socketId).emit("received_admin_message", msg);
    }
  });
  socket.on("send_message_seller_to_admin", (msg) => {
    if (admin.socketId) {
      socket.to(admin.socketId).emit("received_seller_message", msg);
    }
  });
  socket.on('disconnect', ()=>{
    console.log('user disconnect')
    remove(socket.id)
    removeAdmin(socket.id)
    io.emit('activeAdmin', {status:false})
    io.emit('activeSeller', allSeller)
    io.emit('activeCustomer', allCustomer)
  })
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());  

app.use("/api", require("./routes/chatRoutes"));
app.use("/api/home", require("./routes/payment/paymentRoutes"));
app.use("/api", require("./routes/home/cartRoutes"));
app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api", require("./routes/order/orderRoutes"));
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/dashboard/categoryRoutes"));
app.use("/api", require("./routes/dashboard/productRoutes"));
app.use("/api", require("./routes/dashboard/sellerRoutes"));

app.get("/", (_, res) => {
  res.send("Hello world");
});

(async () => {
  try {
    await db();
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  }
})();
