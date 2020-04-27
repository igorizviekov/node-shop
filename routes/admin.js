const express = require("express");
const router = express.Router();
const controller = require("../controllers/mgController");
const isAuth = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
//validator
const validation = require("../helpers/validation");

router.get("/admin/add-product", isAuth, isAdmin, controller.getAddProduct);
router.post("/new-product", validation.product, controller.postAddProduct);
router.post(
  "/update-product",
  validation.product,
  controller.postUpdateProduct
);
router.post("/delete-product", controller.postDeleteProduct);
router.get("/admin/products", isAuth, isAdmin, controller.adminProducts);
router.get("/admin/edit-product", isAuth, isAdmin, controller.adminEditProduct);

module.exports = router;
