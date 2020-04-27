const Product = require("../models/mgProduct");
const Order = require("../models/mgOrder");
const User = require("../models/mgUser");
const keys = require("../data/sensitive");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
var salt = bcrypt.genSaltSync(10);
const crypto = require("crypto");
//validator
const { validationResult } = require("express-validator");
//files
const fs = require("fs");
const path = require("path");
const fileHelper = require("../utils/file");
//pagination
const pagination = require("../helpers/pagination");
//emails
const nodemailer = require("nodemailer");
const sendGrid = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport(
  sendGrid({
    auth: {
      api_key: keys.api
    }
  })
);
//================================================PRODUCTS

exports.mainProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalNum;
  Product.find()
    //get number of products for pagination
    .countDocuments()
    .then(prodNum => {
      totalNum = prodNum;
      return Product.find()
        .skip((page - 1) * pagination.itemsPerPage)
        .limit(pagination.itemsPerPage);
    })
    .then(products => {
      const paginate = {
        currentPage: page,
        hasNextPage: page * pagination.itemsPerPage < totalNum,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalNum / pagination.itemsPerPage)
      };
      res.render("shop/product-list", {
        products,
        paginate
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.shopProductDetails = (req, res) => {
  const id = req.params.id;
  Product.findById(id) //mongoose method
    .then(product => {
      res.render("shop/product-details", { product });
    })
    .catch(err => {
      console.log(err);
    });
};

//================================================ADMIN

exports.getAddProduct = (req, res) => {
  //validation purpose
  const title = "";
  const image = "";
  res.render("admin/add-product", { title, image }); //file in views folder
};

exports.adminEditProduct = (req, res) => {
  const product = req.query;
  res.render("admin/edit-product", { product });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const description = req.body.description;
  const image = req.file;
  const userId = req.session.user;
  const errors = validationResult(req);
  //validate input and image
  if (!errors.isEmpty() || !image) {
    {
      !errors.isEmpty()
        ? (errorMessage = errors.array()[0].msg)
        : (errorMessage = "No image found.");
    }
    return res.status(422).render("admin/add-product", {
      errorMessage,
      title,
      description,
      price
    });
  }
  const imageURL = "/" + image.path;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageURL: imageURL,
    userId: userId
  });
  product
    .save() // method by mongoose
    .then(() => res.redirect("/"))
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postUpdateProduct = (req, res, next) => {
  const id = req.body.id;
  const price = req.body.price;
  const description = req.body.description;
  const title = req.body.title;
  const image = req.file;
  //validate input(in router)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array()[0].msg;
    const product = {
      id: id,
      price: price,
      description: description,
      title: title
    };
    return res.status(422).render("admin/edit-product", {
      errorMessage,
      product
    });
  }
  //save if valid
  Product.findById(id)
    .then(product => {
      (product.price = price),
        (product.description = description),
        (product.title = title);
      //update image path if image was updated
      if (image) {
        //delete old image
        const oldImage = product.imageURL.substring(1, 200); //trim / in the path
        fileHelper.deleteFile(oldImage);
        //save new path
        product.imageURL = "/" + image.path;
      }
      return product.save();
    })
    .then(() => {
      res.redirect("admin/products");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res) => {
  const id = req.body.id;
  oldImage = req.body.imageURL.substring(1, 200);
  fileHelper.deleteFile(oldImage);
  Product.findByIdAndRemove(id)
    .then(() => {
      res.redirect("/admin/products");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.adminProducts = (req, res) => {
  const page = +req.query.page || 1;
  let totalNum;
  Product.find()
    //get number of products for pagination
    .countDocuments()
    .then(prodNum => {
      totalNum = prodNum;
      return Product.find()
        .skip((page - 1) * pagination.itemsPerPage)
        .limit(pagination.itemsPerPage);
    })
    .then(products => {
      const paginate = {
        currentPage: page,
        hasNextPage: page * pagination.itemsPerPage < totalNum,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        prevPage: page - 1,
        lastPage: Math.ceil(totalNum / pagination.itemsPerPage)
      };
      res.render("admin/products", {
        products,
        paginate
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//================================================CART

exports.shopCart = (req, res) => {
  req.user
    .populate("cart.items.prodId")
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render("shop/cart", { products });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddToCart = (req, res) => {
  const prodId = req.body.id;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect("/shop/cart");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteFromCart = (req, res, next) => {
  const id = req.body.id;
  req.user
    .deleteFromCart(id)
    .then(() => {
      res.redirect("./shop/cart");
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//================================================ORDER

exports.shopOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then(orders => {
      const total = orders.map(order => order.price).reduce((a, b) => a + b, 0);

      res.render("shop/orders", { orders, total });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddToOrder = (req, res) => {
  req.user
    .populate("cart.items.prodId")
    .execPopulate()
    .then(user => {
      const orderPrice = user.cart.items
        .map(product => product.prodId.price * product.quantity)
        .reduce((a, b) => a + b, 0);
      const products = user.cart.items.map(item => {
        return {
          quantity: item.quantity,
          productData: { ...item.prodId._doc }
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products,
        price: orderPrice
      });
      return order
        .save()
        .then(() => req.user.clearCart())
        .then(() => res.redirect("./shop/orders"))
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error("No order found."));
      }
      // check if order belongs to the user
      if (order.user.userId.toString() !== req.user.id.toString()) {
        return next(new Error("Not Authorized."));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);
      //set PDF kit
      const PDF = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="' + invoiceName + '"'
      );
      PDF.pipe(fs.createWriteStream(invoicePath));
      PDF.pipe(res);
      //create PDF doc
      PDF.fontSize(24).text("Invoice", { underline: true });
      PDF.text("-------");
      order.products.forEach(item => {
        PDF.fontSize(12).text(
          item.productData.title +
            " X " +
            item.quantity +
            ", $" +
            item.productData.price
        );
      });
      PDF.text("-------");
      PDF.fontSize(20).text("Total price: $" + order.price);
      PDF.end();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//================================================AUTH

exports.authLogin = (req, res) => {
  const email = "";
  const password = "";
  const errorMessage = req.flash("error");
  res.render("auth/login", { errorMessage, email, password });
};

exports.postAuthLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array()[0].msg;
    return res
      .status(422)
      .render("auth/login", { errorMessage, email, password });
  }
  User.findOne({ email: email }).then(userData => {
    if (!userData) {
      req.flash("error", "Invalid Email.");
      return res.redirect("/login");
    }
    //compare hashed password with input password
    bcrypt
      .compare(password, userData.password)
      .then(doMatch => {
        //passwords match
        if (doMatch) {
          //pass admin data
          if (email === keys.admin) {
            req.session.isAdmin = true;
          }
          req.session.isLoggedIn = true;
          req.session.user = userData;
          return req.session.save(() => {
            return res.redirect("/");
          });
        }
        //passwords don't match
        res.redirect("/login", { email, password });
      })
      .catch(() => {
        res.redirect("/");
      });
  });
};

exports.postAuthLogout = (req, res, next) => {
  req.session.destroy(() => res.redirect("/"));
};

exports.authSignUp = (req, res) => {
  const email = "";
  const password = "";
  const errorMessage = req.flash("error");
  res.render("auth/sign-up", { email, password, errorMessage });
};

exports.postAuthSignUp = (req, res, next) => {
  const password = req.body.password;
  const email = req.body.email;
  //validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array()[0].msg;
    return res
      .status(422)
      .render("auth/sign-up", { errorMessage, email, password });
  }
  //create new user if none
  User.findOne({ email: email })
    .then(userData => {
      if (userData) {
        req.flash("error", "This email is already taken.");
        return res.redirect("/sign-up");
      }
      //encrypt user password
      const hashedPassword = bcrypt.hashSync(password, salt);
      const user = new User({
        password: hashedPassword,
        email: email,
        cart: { items: [] }
      });
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
      return transporter
        .sendMail({
          to: email,
          from: keys.email,
          subject: "Sign Up succeeded!",
          html: "<h1> You successfully signed up! </h1>"
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//render reset password page
exports.authResetPassword = (req, res, next) => {
  const errorMessage = req.flash("error");
  res.render("auth/resetPassword", { errorMessage });
};

//find a user and send an email with reset link
exports.postAuthResetPassword = (req, res, next) => {
  //create unique token
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset-password");
    }
    const token = buffer.toString("hex");
    //find user by email
    User.findOne({ email: req.body.email })
      .then(userData => {
        //if no such user
        if (!userData) {
          req.flash("error", "No account with this email found.");
          return res.redirect("/reset-password");
        }
        //if there is a valid user
        userData.resetToken = token;
        userData.resetTokenExpiration = Date.now() + 3600; //1 hour expiration
        return userData.save();
      })
      //send an email with a reset link
      .then(result => {
        res.redirect("/");
        transporter.sendMail({
          to: req.body.email,
          from: keys.email,
          subject: "Password Reset",
          html: `
        <h4>You requested password reset</h4>
        <p>Click this <a href="${keys.domain}reset-password/${token}" >link</a> to set a new password</p>
        `
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

//render reset password form from a link
exports.authResetPasswordForm = (req, res) => {
  const token = req.params.token;
  User.findOne({
    //find user by token
    resetToken: token
    // resetTokenExpiration: { $gt: new Date(Date.now()) } //token not expired
  })
    .then(userData => {
      if (!userData) {
        return res.redirect("/login");
      }
      //if there is a match
      const errorMessage = req.flash("error");
      const userId = userData.id;
      res.render("auth/resetPasswordForm", { userId, token, errorMessage });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//update password for a user
exports.postAuthNewPassword = (req, res) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const token = req.body.token;
  let userEmail;
  //validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors.array()[0].msg;
    return res
      .status(422)
      .render("auth/resetPasswordForm", { errorMessage, userId, token });
  }
  //find user by id and token
  User.findOne({
    _id: userId,
    resetToken: token
  })
    //update password and clear token
    .then(userData => {
      userEmail = userData.email;
      const hashedPassword = bcrypt.hashSync(newPassword, salt);
      userData.password = hashedPassword;
      userData.resetTokenExpiration = undefined;
      userData.resetToken = undefined;
      return userData.save();
    })
    //redirect and send confirmation email
    .then(() => {
      res.redirect("/login");
      transporter.sendMail({
        to: userEmail,
        from: keys.email,
        subject: "Password Successfully Updated",
        html: "<h1>You password has been successfully updated! </h1>"
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

//================================================ERRORS

exports.get404 = (req, res) => {
  res.status(404).render("404");
};
