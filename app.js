//import packages
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const passport = require("passport");
const bcrypt = require("bcrypt");
const csurf = require("tiny-csrf");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const localStrategy = require("passport-local");

//import files
const { Admin } = require("./models");

//import routes
const adminRoute = require('./routes/adminRoute')
// create express application
const app = express();
dotenv.config({ path: "./config.env" });

app.use(bodyParser.json());
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser("process.env.SECRET_STRING"));

app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

//authenticate user with passport
passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => [
      Admin.findOne({ where: { email: username } })
        .then(async (admin) => {
          if (!admin) {
            return done(null, false, { message: "No Admin found" });
          }
          const result = await bcrypt.compare(password, admin.password);
          if (result) {
            return done(null, admin);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(error);
        }),
    ]
  )
);

passport.serializeUser((user, done) => {
  console.log("Seralizing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => done(error, null));
});
// app.post(
//     "/register",
//     passport.authenticate("local", { 
//     failureRedirect: "/login" ,   
//     failureFlash: true,
//   }),
//     async (request, response) => {
//       console.log(request.user);
//       response.redirect("/elections");
//     }
//   );
//set default view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//render views

app.get("/", async (req, res) => {
    res.render("index", {
      title: "Online Election Site",
      csrfToken: req.csrfToken(),
    });
  });
app.get("/signup", (request, response) => {
    response.render("signup", {
      title: "Sign Up",
      csrfToken: request.csrfToken(),
    });
  });
app.get("/login", (request, response) => {
    response.render("login", {
      title: "Login",
      csrfToken: request.csrfToken(),
    });
  })
app.get("/elections",connectEnsureLogin.ensureLoggedIn(), (request, response) => {
    response.render("elections", {
      title: "Online Election Site",
      csrfToken: request.csrfToken(),
    });
  })
//routes
app.route('/admins',adminRoute)

//export application
module.exports = app;
