const express = require("express");
const path = require("path");
const app = express();
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const bodyParser = require("body-parser");
const controller = require("./controllers/mgController");
const mongoose = require("mongoose");
const session = require("express-session");
const multer = require("multer"); //image download
const csrf = require("csurf");
const flash = require("connect-flash");
const MongoDBStore = require("connect-mongodb-session")(session);
const User = require("./models/mgUser");
//global variables
require("dotenv").config();
const store = new MongoDBStore({
  uri: `${process.env.MONGO_DB}`,
  collection: "sessions"
});

const csurfProtection = csrf();

//set up file upload
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "assets"); //where to store
  },
  filename: (req, file, callback) => {
    callback(null, new Date().toISOString() + "-" + file.originalname);
  }
});
const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

app.set("view engine", "pug");
app.set("views", "views"); //path to the views folder

app.use(bodyParser.urlencoded({ extended: true })); //text parser
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image") //file downloader
);
app.use("/assets", express.static(path.join(__dirname, "assets"))); //public folder for images

app.use(
  session({
    store: store,
    secret: `${process.env.SECRET}`,
    resave: false,
    saveUninitialized: false
  })
);

//set after session
app.use(csurfProtection); //protection token
app.use(flash()); // error messages

//after session, before user
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

//find a user by session, store it in req object
app.use((req, res, next) => {
  //skip if no session
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      //skip if no user
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      throw new Error(err);
    });
});

app.use(adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(controller.get404);

//catch errors (should be at the bottom)
app.use((error, req, res, next) => {
  res.status(500).render("500");
});

mongoose
  .connect(`${process.env.MONGO_DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    app.listen(3000);
  })
  .catch(err => console.log(err));
mongoose.set("useFindAndModify", false);
