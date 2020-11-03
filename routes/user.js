var express = require("express");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
var userHelpers = require("../helpers/user-helpers");
const verifylogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render("user/view-products", { products, user: req.session.user });
  });
});

router.get("/login", (req, res, next) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { error: req.session.loginErr });
    req.session.loginErr = null;
  }
});

router.post("/login", (req, res) => {
  userHelpers
    .doLogin(req.body)
    .then((response) => {
      req.session.loggedIn = true;
      req.session.user = response;
      res.redirect("/");
    })
    .catch((err) => {
      req.session.loginErr = err.msg;
      res.redirect("/login");
    });
});

router.get("/signup", verifylogin, (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/signup", { error: req.session.loginErr });
    req.session.loginErr = null;
  }
});

router.post("/signup", verifylogin, (req, res) => {
  userHelpers
    .doSignUp(req.body)
    .then((response) => {
      req.session.loggedIn = true;
      req.session.user = response;
      res.redirect("/");
    })
    .catch((err) => {
      req.session.loginErr = err.msg;
      res.redirect("/signup");
    });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.get("/cart", verifylogin, async (req, res) => {
  let user = req.session.user;
  let count = 0;
  let product = {};
  // if (user) {
  //   // count = await userHelpers.getCartCount(req.session.user.userid);
  // }
  // await userHelpers
  //   .getCartProducts(req.session.user.userid)
  //   .then(async (response) => {
  //     if (response) {
  //       product = response.result;
  //     }
  //   });
  let total;
  if (product) {
    // total = await userHelpers.getTotalAmountCart(req.session.user.userid);
  }
  res.render("user/cart", { product, user, count, total });
});

router.get("/add-to-cart/:id/:variant", (req, res) => {
  if (req.session.user) {
    userHelpers
      .addToCart(req.params, req.session.user._id)
      .then((response) => {
        res.json({ status: true });
      });
  } else {
    res.json({ status: false });
  }
});
module.exports = router;
