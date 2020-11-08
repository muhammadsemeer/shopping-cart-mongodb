var db = require("../config/connection");
var collection = require("../config/collections");
var bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const { resolve } = require("path");
const { response } = require("express");
require("dotenv").config();
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_KEY_SCRET,
});
module.exports = {
  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        reject({ msg: "User Already Registered" });
      } else {
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.ops[0]);
          });
      }
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            resolve(user);
          } else {
            reject({ msg: "Password is incorrect" });
          }
        });
      } else {
        reject({ msg: "User not found" });
      }
    });
  },
  addToCart: (details, userId) => {
    const { id } = details;
    let proObj = {
      item: ObjectId(id),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (userCart) {
        let prodExist = userCart.products.findIndex(
          (product) => product.item == id
        );
        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId), "products.item": ObjectId(id) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then((response) => {
              resolve("inc");
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve(true);
            });
        }
      } else {
        let cartObj = {
          user: ObjectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$products", 0] },
            },
          },
        ])
        .toArray();
      resolve(cartItems);
    });
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuanity: (details) => {
    const { cartId, prodId, func } = details;
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(cartId), "products.item": ObjectId(prodId) },
          {
            $inc: { "products.$.quantity": parseInt(func) },
          }
        )
        .then((response) => {
          if (func === "1") {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  },
  deleteCartItem: (detials) => {
    return new Promise((resolve, reject) => {
      const { cartId, prodId } = detials;
      console.log(detials);
      db.get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: ObjectId(cartId) },
          {
            $pull: { products: { item: ObjectId(prodId) } },
          }
        )
        .then((response) => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  getTotalAmountCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$products", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
            },
          },
        ])
        .toArray();
      resolve(total[0].total);
    });
  },
  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: ObjectId(userId) });
      resolve(cart.products);
    });
  },
  placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      let status = order.paymentmethod === "COD" ? "Placed" : "Pending";
      var orderdate = new Date();
      var deliverydate = new Date();
      deliverydate.setDate(deliverydate.getDate() + 7);
      let orderObj = {
        deliveryDetials: {
          mobile: order.mobileno,
          address: order.address,
          pincode: order.pincode,
        },
        userId: ObjectId(order.userId),
        paymentmethod: order.paymentmethod,
        products: products,
        total: total,
        orderdate: orderdate.toDateString(),
        deliverydate: deliverydate.toDateString(),
        status: status,
        paid: "Not Paid",
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collection.CART_COLLECTION)
            .removeOne({ user: ObjectId(order.userId) });
          resolve(response.ops[0]._id);
        });
    });
  },
  getMyorders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { userId: ObjectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              deliveryDetials: "$deliveryDetials",
              userId: "$userId",
              paymentmethod: "$paymentmethod",
              total: "$total",
              item: "$products.item",
              quantity: "$products.quantity",
              orderdate: "$orderdate",
              deliverydate: "$deliverydate",
              status: "$status",
              paid: "$paid",
              razorpay_order_id: "$razorpay_order_id",
              razorpay_payment_id: "$razorpay_payment_id",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "products",
            },
          },
          {
            $project: {
              deliveryDetials: 1,
              userId: 1,
              paymentmethod: 1,
              total: 1,
              product: { $arrayElemAt: ["$products", 0] },
              quantity: 1,
              orderdate: 1,
              deliverydate: 1,
              status: 1,
              paid: 1,
              razorpay_order_id: 1,
              razorpay_payment_id: 1,
            },
          },
        ])
        .toArray();
      resolve(orderItems);
    });
  },
  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: orderId.toString(),
      };
      instance.orders.create(options, function (err, order) {
        order.razkey = process.env.RAZORPAY_KEY;
        resolve(order);
      });
    });
  },
  verifyPayment: (details) => {
    const crypto = require("crypto");
    return new Promise((resolve, reject) => {
      var hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SCRET);
      hmac.update(
        details.payment.razorpay_order_id +
          "|" +
          details.payment.razorpay_payment_id
      );
      hmac = hmac.digest("hex");
      if (hmac == details.payment.razorpay_signature) {
        resolve({
          razorpayOrderId: details.payment.razorpay_order_id,
          razorpayPaymentId: details.payment.razorpay_payment_id,
        });
      } else {
        reject();
      }
    });
  },
  changePaymentStatus: (payment, orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderId) },
          {
            $set: {
              status: "Placed",
              razorpay_order_id: payment.razorpayOrderId,
              razorpay_payment_id: payment.razorpayPaymentId,
              paid: "Paid",
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  getProfile: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userDetails = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find(
          { _id: ObjectId(userId) },
          {
            projection: {
              name: true,
              email: true,
            },
          }
        )
        .toArray();
      resolve(userDetails[0]);
    });
  },
  changeProfile: (details, userId) => {
    return new Promise(async (resolve, reject) => {
      const { name, email } = details;
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: ObjectId(userId) },
          {
            $set: {
              name: name,
              email: email,
            },
          }
        )
        .then((response) => {
          resolve();
        })
        .catch((err) => {
          reject({ msg: "Given Email Id already exists" });
        });
    });
  },
  changePassword: (passwords, userId) => {
    return new Promise(async (resolve, reject) => {
      var { expassword, newpassword, conpassword } = passwords;
      let expass = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find(
          { _id: ObjectId(userId) },
          {
            projection: {
              _id: false,
              password: true,
            },
          }
        )
        .toArray();
      bcrypt.compare(expassword, expass[0].password).then(async (status) => {
        if (status) {
          newpassword = await bcrypt.hash(newpassword, 10);
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne(
              { _id: ObjectId(userId) },
              {
                $set: {
                  password: newpassword,
                },
              }
            )
            .then((response) => {
              resolve();
            });
        } else {
          reject({ msg: "Current Password is Wrong" });
        }
      });
    });
  },
  CancelOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .removeOne({ _id: ObjectId(orderId) })
        .then((response) => {
          resolve(true);
        })
        .catch((err) => {
          reject(false);
        });
    });
  },
};
