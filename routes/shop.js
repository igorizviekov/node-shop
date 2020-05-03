const express = require("express");
const router = express.Router();
const controller = require("../controllers/mgController");
const isAuth = require("../middleware/isAuth");

router.get("/", controller.mainProducts); //link in html
// // router.get("/shop/products", controller.shopProducts);
router.get("/shop/cart", isAuth, controller.shopCart);
router.post("/add-to-cart", isAuth, controller.postAddToCart);
router.post("/delete", controller.postDeleteFromCart);
// // router.get("/shop/checkout", controller.shopCheckout);
router.get("/shop/orders", isAuth, controller.shopOrders);
router.post("/add-to-order", controller.postAddToOrder);
router.get("/shop/details/:id", controller.shopProductDetails);
router.get("/shop/orders/:orderId", isAuth, controller.getInvoice); //invoice
module.exports = router;
