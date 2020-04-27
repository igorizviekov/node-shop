const express = require("express");
const router = express.Router();
const controller = require("../controllers/mgController");
const validation = require("../helpers/validation");

router.get("/login", controller.authLogin);
router.post("/login", validation.password, controller.postAuthLogin);
router.post("/logout", controller.postAuthLogout);
router.get("/sign-up", controller.authSignUp);
router.post("/sign-up", validation.password, controller.postAuthSignUp);
router.get("/reset-password", controller.authResetPassword);
router.post("/reset", controller.postAuthResetPassword);
router.get("/reset-password/:token", controller.authResetPasswordForm);
router.post(
  "/new-password",
  validation.password,
  controller.postAuthNewPassword
);

module.exports = router;
