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
router.get("/", async (req, res, next) => {
  let count = 0;
  let user = req.session.user;
  if (user) {
    count = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelper.getAllProducts().then((products) => {
    res.render("user/view-products", { products, count, user });
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

router.get("/signup", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/signup", { error: req.session.loginErr });
    req.session.loginErr = null;
  }
});

router.post("/signup", (req, res) => {
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
  let product;
  if (user) {
    count = await userHelpers.getCartCount(req.session.user._id);
  }
  await userHelpers
    .getCartProducts(req.session.user._id)
    .then(async (response) => {
      if (response) {
        product = response;
      }
    });
  let total = 0;
  if (product.length > 0) {
    total = await userHelpers.getTotalAmountCart(req.session.user._id);
  }
  res.render("user/cart", { product, user, count, total });
});

router.get("/add-to-cart/:id", (req, res) => {
  if (req.session.user) {
    userHelpers.addToCart(req.params, req.session.user._id).then((response) => {
      res.json({ status: response });
    });
  } else {
    res.json({ status: false });
  }
});

router.get("/change-quantity/:cartId/:prodId/:func", (req, res) => {
  userHelpers.changeProductQuanity(req.params).then((response) => {
    res.json(response);
  });
});

router.get("/delete-cart-product/:cartId/:prodId", (req, res) => {
  userHelpers
    .deleteCartItem(req.params)
    .then((response) => {
      res.json({ status: true });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/place-order", verifylogin, async (req, res) => {
  let total = await userHelpers.getTotalAmountCart(req.session.user._id);
  let count = 0;
  if (req.session.user) {
    count = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render("user/place-order", { user: req.session.user, total, count });
});

router.post("/place-order", async (req, res) => {
  if (req.session.user) {
    let products = await userHelpers.getCartProductList(req.body.userId);
    let total = await userHelpers.getTotalAmountCart(req.body.userId);
    userHelpers.placeOrder(req.body, products, total).then((orderId) => {
      if (req.body.paymentmethod === "COD") {
        res.json({ status: "COD" });
      } else {
        userHelpers.generateRazorpay(orderId, total).then((response) => {
          res.json(response);
        });
      }
    });
  } else {
    res.json({ status: false });
  }
});

router.get("/myorders", verifylogin, async (req, res) => {
  let product = await userHelpers.getMyorders(req.session.user._id);
  res.render("user/my-orders", { user: req.session.user, product });
});

router.post("/verify-payment", verifylogin, (req, res) => {
  userHelpers
    .verifyPayment(req.body)
    .then((response) => {
      userHelpers
        .changePaymentStatus(response, req.body.order.receipt)
        .then((response) => {
          res.json({ status: true });
        });
    })
    .catch((err) => {
      res.json({ status: false });
    });
});

module.exports = router;
