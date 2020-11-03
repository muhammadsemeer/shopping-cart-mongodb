var db = require("../config/connection");
var collection = require("../config/collections");
const { response } = require("express");
var objectId = require("mongodb").ObjectID;

module.exports = {
  addProducts: (product, image) => {
    return new Promise((resolve, reject) => {
      product.price = parseInt(product.price);
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
};
