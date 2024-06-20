const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel");
const sellerModel = require("../models/sellerModel");
const { createToken } = require("../utils/tokenCreate");
const responseReturn = require("../utils/response");
const sellerCustomersModel = require("../models/chat/sellerCustomersModel");
const sellerToCustomersMsg = require("../models/chat/sellerToCustomerMsg");
const adminSellersMsg = require("../models/chat/adminSellersMsg");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const customerModel = require("../models/customerModel");
const upload = multer();

const add_customer_friend = async (req, res) => {
  const { sellerId, userId } = req.body;
  try {
    if (sellerId !== "") {
      const seller = await sellerModel.findById(sellerId);
      const user = await customerModel.findById(userId);
      const checkSeller = await sellerCustomersModel.findOne({
        $and: [
          { myId: { $eq: userId } },
          {
            myFriend: {
              $elemMatch: {
                fdId: sellerId,
              },
            },
          },
        ],
      });
      if (!checkSeller) {
        await sellerCustomersModel.updateOne(
          {
            myId: userId,
          },
          {
            $push: {
              myFriend: {
                fdId: sellerId,
                name: seller.shopInfo?.shopName,
                image: seller.image,
              },
            },
          }
        );
      }
      const checkUser = await sellerCustomersModel.findOne({
        $and: [
          { myId: { $eq: sellerId } },
          {
            myFriend: {
              $elemMatch: {
                fdId: userId,
              },
            },
          },
        ],
      });
      if (!checkUser) {
        await sellerCustomersModel.updateOne(
          {
            myId: sellerId,
          },
          {
            $push: {
              myFriend: {
                fdId: userId,
                name: user.name,
                image: "",
              },
            },
          }
        );
      }
      const messages = await sellerToCustomersMsg.find({
        $or: [
          {
            $and: [
              { senderId: { $eq: userId } },
              { receiverId: { $eq: sellerId } },
            ],
          },
          {
            $and: [
              { senderId: { $eq: sellerId } },
              { receiverId: { $eq: userId } },
            ],
          },
        ],
      });
      const myFriend = await sellerCustomersModel.findOne({
        myId: userId,
      });
      const currentFd = myFriend.myFriend.find((s) => s.fdId == sellerId);
      responseReturn(res, 201, {
        myFriend: myFriend.myFriend,
        currentFd,
        messages,
      });
    } else {
      const myFriend = await sellerCustomersModel.findOne({
        myId: userId,
      });

      responseReturn(res, 201, { myFriend: myFriend.myFriend });
    }
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const add_customer_message = async (req, res) => {
  const { userId, sellerId, message, name } = req.body;
  try {
    const messages = await sellerToCustomersMsg.create({
      senderId: userId,
      senderName: name,
      receiverId: sellerId,
      message,
    });

    const data = await sellerCustomersModel.findOne({
      myId: userId,
    });
    const myFriends = data.myFriend;
    const index = myFriends.findIndex((s) => s.fdId == sellerId);
    while (index > 0) {
      let temp = myFriends[index];
      myFriends[index] = myFriends[index - 1];
      myFriends[index - 1] = temp;
      index--;
    }
    await sellerCustomersModel.updateOne(
      {
        myId: userId,
      },
      {
        myFriend: myFriends,
      }
    );
    const data1 = await sellerCustomersModel.findOne({ myId: sellerId });
    let myFriends1 = data1.myFriend;
    const index1 = myFriends1.findIndex((s) => s.fdId == userId);
    while (index1 > 0) {
      let temp1 = myFriends1[index1];
      myFriends1[index1] = myFriends1[index1 - 1];
      myFriends1[index1 - 1] = temp1;
      index1--;
    }
    await sellerCustomersModel.updateOne(
      {
        myId: sellerId,
      },
      {
        myFriend: myFriends1,
      }
    );
    responseReturn(res, 201, { messages });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const get_customers = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const data = await sellerCustomersModel.findOne({
      myId: sellerId,
    });

    responseReturn(res, 200, { customers: data.myFriend });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const get_customer_seller_message = async (req, res) => {
  const { customerId } = req.params;
  const { id } = req;
  try {
    const messages = await sellerToCustomersMsg.find({
      $or: [
        {
          $and: [
            { senderId: { $eq: id } },
            { receiverId: { $eq: customerId } },
          ],
        },
        {
          $and: [
            { senderId: { $eq: customerId } },
            { receiverId: { $eq: id } },
          ],
        },
      ],
    });
    const currentCustomer = await customerModel.findById(customerId);
    console.log(currentCustomer);
    responseReturn(res, 200, { messages, currentCustomer });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const add_seller_message = async (req, res) => {
  const { userId, receiverId, message, name } = req.body;
  try {
    const messages = await sellerToCustomersMsg.create({
      senderId: userId,
      senderName: name,
      receiverId,
      message,
    });

    const data = await sellerCustomersModel.findOne({
      myId: userId,
    });
    const myFriends = data.myFriend;
    const index = myFriends.findIndex((s) => s.fdId == receiverId);
    while (index > 0) {
      let temp = myFriends[index];
      myFriends[index] = myFriends[index - 1];
      myFriends[index - 1] = temp;
      index--;
    }
    await sellerCustomersModel.updateOne(
      {
        myId: userId,
      },
      {
        myFriend: myFriends,
      }
    );
    const data1 = await sellerCustomersModel.findOne({ myId: receiverId });
    let myFriends1 = data1.myFriend;
    const index1 = myFriends1.findIndex((s) => s.fdId == userId);
    while (index1 > 0) {
      let temp1 = myFriends1[index1];
      myFriends1[index1] = myFriends1[index1 - 1];
      myFriends1[index1 - 1] = temp1;
      index1--;
    }
    await sellerCustomersModel.updateOne(
      {
        myId: receiverId,
      },
      {
        myFriend: myFriends1,
      }
    );
    responseReturn(res, 201, { messages });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const get_sellers = async (req, res) => {
  try {
    const sellers = await sellerModel.find({});
    responseReturn(res, 200, { sellers });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const send_message_seller_admin = async (req, res) => {
  const { userId, receiverId, message, senderName } = req.body;
  try {
    const messagesData = await adminSellersMsg.create({
      senderId: userId,
      senderName,
      receiverId,
      message,
    });

    responseReturn(res, 201, { messages: messagesData });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
};

const get_admin_message = async (req, res)=>{
  const { receiverId } = req.params;
  const id =''

  try {
    const messages = await adminSellersMsg.find({
      $or: [
        {
          $and: [
            { senderId: { $eq: id } },
            { receiverId: { $eq: receiverId } },
          ],
        },
        {
          $and: [
            { senderId: { $eq: receiverId } },
            { receiverId: { $eq: id } },
          ],
        },
      ],
    });
    let currentSeller = {}
    if(receiverId){
      currentSeller = await sellerModel.findById(receiverId);
    }

    responseReturn(res, 200, { messages, currentSeller });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
}

const get_seller_message = async (req, res)=>{
  const receiverId = ''
  const { id } = req;
  console.log(id)

  try {
    const messages = await adminSellersMsg.find({
      $or: [
        {
          $and: [
            { senderId: { $eq: receiverId } },
            { receiverId: { $eq:  id} },
          ],
        },
        {
          $and: [
            { senderId: { $eq: id } },
            { receiverId: { $eq:  receiverId } },
          ],
        },
      ],
    });

    responseReturn(res, 200, { messages });
  } catch (error) {
    responseReturn(res, 500, { error: error.message });
  }
}

module.exports = {
  add_customer_friend,
  add_customer_message,
  get_customers,
  get_customer_seller_message,
  add_seller_message,
  get_sellers,
  send_message_seller_admin,
  get_admin_message,
  get_seller_message
};
