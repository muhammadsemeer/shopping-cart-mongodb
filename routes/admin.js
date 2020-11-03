var express = require("express");
const productHelpers = require("../helpers/product-helpers");
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
var fs = require("fs");
/* GET users listing. */
router.get("/", function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, admin: true });
  });
});

router.get("/add-product", (req, res) => {
  res.render("admin/add-products", { admin: true });
});

router.post("/add-product", (req, res) => {
  productHelpers.addProducts(req.body, req.files.image).then((id) => {
    let image = req.files.image;
    for (let i = 0; i < image.length; i++) {
      image[i].mv(
        "./public/images/product-images/" + image[i].name + id + ".jpg",
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    res.redirect("/admin");
  });
});

router.get("/delete-product/:id/:image1/:image2/:image3", (req, res) => {
  let prodId = req.params.id;
  let image1 = req.params.image1;
  let image2 = req.params.image2;
  let image3 = req.params.image3;
  productHelper.deleteProduct(prodId).then((response) => {
    fs.unlink(
      "./public/images/product-images/" + image1 + prodId + ".jpg",
      (error) => {
        if (error) throw error;
      }
    );
    fs.unlink(
      "./public/images/product-images/" + image2 + prodId + ".jpg",
      (error) => {
        if (error) throw error;
      }
    );
    fs.unlink(
      "./public/images/product-images/" + image3 + prodId + ".jpg",
      (error) => {
        if (error) throw error;
      }
    );
    res.redirect("/admin");
  });
});

router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelper.getProductDetails(req.params.id);
  res.render("admin/edit-product", { product, admin: true });
});

router.post("/edit-product/:id", async (req, res) => {
  productHelper
    .updateProductDetails(req.params.id, req.body)
    .then((response) => {
      res.redirect("/admin");
    });
});

router.get("/edit-images/:imageno/:prodID/:image", (req, res) => {
  res.render("admin/edit-image", {
    image: req.params,
    admin: true,
  });
});

router.post("/edit-images/:imageno/:prodID/:image", (req, res) => {
  let image = req.files.image;
  let id = req.params.prodID;
  let oldImage = req.params.image;
  if (image) {
    productHelpers.editProductImage(req.params, image).then((response) => {
      image.mv(
        "./public/images/product-images/" + image.name + id + ".jpg",
        (err) => {
          if (err) {
            console.log(err);
          }
          fs.unlink(
            "./public/images/product-images/" + oldImage + id + ".jpg",
            (error) => {
              if (error) throw error;
            }
          );
        }
      );
      res.redirect("/admin");
    });
  }
});

module.exports = router;
