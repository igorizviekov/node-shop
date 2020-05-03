//validator
const { check, body } = require("express-validator");

exports.password = [
  check("password")
    .isLength({ min: 5 })
    .trim()
    .withMessage("The password should be at least 5 characters."),
  body("confirmPassword")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords have to match.");
      }
      return true;
    })
    .trim()
];

exports.product = [
  body("title")
    .isString()
    .isLength({ min: 3 })
    .trim()
    .withMessage("Title should be minimum 3 alphabetic characters."),
  body("description")
    .isLength({ min: 8, max: 200 })
    .trim()
    .withMessage("Description should be at least 8 characters."),
  body("price")
    .isLength({ min: 1 })
    .withMessage("Please add the price value.")
];
