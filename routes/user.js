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

router.get("/cart", verifylogin, (req, res) => {
  res.render("user/cart");
});

module.exports = router;
