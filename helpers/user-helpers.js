var db = require("../config/connection");
var collection = require("../config/collections");
var bcrypt = require("bcrypt");

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
};
