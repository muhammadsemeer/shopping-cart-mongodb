var db = require("../config/connection");
var collection = require("../config/collections");
var bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { response } = require("express");

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
    const { id, variant } = details;
    let proObj = {
      item: ObjectId(id),
      variant: variant,
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
        console.log(prodExist);
        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { "products.item": ObjectId(id) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then((response) => {
              resolve();
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
              resolve();
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
};
