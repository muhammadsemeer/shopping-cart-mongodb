var express = require("express");
const { Db } = require("mongodb");
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

router.post("/payment", (req, res) => {
  const { orderId, amount } = req.query;
  userHelpers.generateRazorpay(orderId, amount).then((response) => {
    res.json(response);
  });
});

router.get("/profile", verifylogin, async (req, res) => {
  let userDetails = await userHelpers.getProfile(req.session.user._id);
  res.render("user/profile", { user: req.session.user, userDetails });
});

router.get("/profile/edit", verifylogin, async (req, res) => {
  let userDetails = await userHelpers.getProfile(req.session.user._id);
  res.render("user/edit-profile", {
    user: req.session.user,
    userDetails,
    error: req.session.profileErr,
  });
  req.session.profileErr = null;
});

router.post("/profile/edit", (req, res) => {
  if (
    req.body.email === req.session.user.email &&
    req.body.name === req.session.user.name
  ) {
    req.session.profileErr = "Name and Email Id is same no need to change";
    res.redirect("/profile/edit");
  } else {
    userHelpers
      .changeProfile(req.body, req.session.user._id)
      .then((response) => {
        if (req.body.email !== req.session.user.email) {
          req.session.destroy();
          res.redirect("/login");
        } else {
          res.redirect("/profile");
        }
      })
      .catch((error) => {
        req.session.profileErr = error.msg;
        res.redirect("/profile/edit");
      });
  }
});

router.get("/change-password", verifylogin, (req, res) => {
  res.render("user/change-password", {
    user: req.session.user,
    error: req.session.passErr,
  });
  req.session.passErr = null;
});

router.post("/change-password", verifylogin, (req, res) => {
  userHelpers
    .changePassword(req.body, req.session.user._id)
    .then((response) => {
      req.session.destroy();
      res.redirect("/login");
    })
    .catch((error) => {
      req.session.passErr = error.msg;
      res.redirect("/change-password");
    });
});

router.post("/cancelorder/:id", (req, res) => {
  userHelpers
    .CancelOrder(req.params.id)
    .then((response) => {
      res.json({ status: response });
    })
    .catch((err) => {
      res.json({ status: err });
    });
});

module.exports = router;
