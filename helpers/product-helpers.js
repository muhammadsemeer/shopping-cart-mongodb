var db = require("../config/connection");
var collection = require("../config/collections");
const { response } = require("express");
var objectId = require("mongodb").ObjectID;

module.exports = {
  addProducts: (product, image) => {
    return new Promise((resolve, reject) => {
      product.price = parseFloat(product.price);
      product.image1 = image[0].name;
      product.image2 = image[1].name;
      product.image3 = image[2].name;
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(product)
        .then((data) => {
          resolve(data.ops[0]._id);
        });
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },
  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .removeOne({ _id: objectId(prodId) })
        .then((response) => {
          console.log(response);
          resolve();
        });
    });
  },
  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(prodId) })
        .then((product) => {
          resolve(product);
        });
    });
  },
  updateProductDetails: (prodId, details) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(prodId) },
          {
            $set: {
              name: details.name,
              brand: details.brand,
              category: details.category,
              description: details.description,
              price: details.price,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },
  editProductImage: (details, file) => {
    return new Promise((resolve, reject) => {
      const { imageno, prodID } = details;
      if (imageno === "image1") {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodID) },
            {
              $set: {
                image1: file.name,
              },
            }
          )
          .then((response) => {
            resolve();
          });
        console.log("here if");
      } else if (imageno === "image2") {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodID) },
            {
              $set: {
                image2: file.name,
              },
            }
          )
          .then((response) => {
            resolve();
          });
      } else {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .updateOne(
            { _id: objectId(prodID) },
            {
              $set: {
                image3: file.name,
              },
            }
          )
          .then((response) => {
            resolve();
          });
      }
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {},
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
            $lookup: {
              from: collection.USER_COLLECTION,
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $project: {
              deliveryDetials: 1,
              userId: 1,
              paymentmethod: 1,
              total: 1,
              product: { $arrayElemAt: ["$products", 0] },
              user: { $arrayElemAt: ["$user", 0] },
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
      resolve(orders);
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find({ admin: { $ne: true } })
        .toArray();
      resolve(users);
    });
  },
};
