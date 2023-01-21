//import packages
const express = require("express");
const bodyParser = require("body-parser");
const flash = require("connect-flash");

const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const csurf = require("tiny-csrf");
const session = require("express-session");
dotenv.config({ path: "./config.env" });

//import files
const authenticateJwt = require("./middelwares/authenticateJWT");
const globalErrorHandler = require("./controllers/errorController");

//import routes
const adminRoute = require("./routes/adminRoute");
const electionRoute = require("./routes/electionsRoute");
const questionsRoute = require("./routes/questionsRoute");
const answersRoute = require("./routes/answerRoute");
const votersRoute = require("./routes/votersRoute");
const resultsRoute = require("./routes/resultsRoute");

// create express application
const app = express();

//parse jsom
app.use(bodyParser.json());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SESSION_SECRET));

// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  console.log("cookie", req.cookies);
  console.log(process.env.NODE_ENV);
  next();
});
app.use(csurf(process.env.CSURF_SECRET, ["POST", "PUT", "DELETE"]));

//initialize session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
    },
  })
);

app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

//set default view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//render views
app.get("/", async (req, res) => {
  res.render("index", {
    title: "Online Voting Platform",
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
});

app.get("/voterLogin", async (req, res) => {
  //check if user is logged in
  res.render("voterLogin", {
    title: "Online Voting Platform",
    csrfToken: req.csrfToken(),
  });
});
app.get("/forgotPassword", async (req, res) => {
  //check if user is logged in
  res.render("forgotPassword", {
    title: "Online Voting Platform",
    csrfToken: req.csrfToken(),
  });
});
app.get("/resetPassword", async (req, res) => {
  //check if user is logged in
  res.render("resetPassword", {
    title: "Online Voting Platform",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signout", (request, response) => {
  response.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  response.redirect("/");
});

//routes
app.use("/admins", adminRoute);
app.use("/questions", authenticateJwt, questionsRoute);
app.use("/answers", answersRoute);
app.use("/voters", votersRoute);
app.use("/results", resultsRoute);
app.use("/elections", electionRoute);

//handles non existing paths
// app.all("*", (req, res, next) => {
//   // console.log(req.originalUrl);
//   res.render("pageNotFound", {
//     title: "Online Voting Platform",
//     csrfToken: req.csrfToken(),
//   });
// });
app.use(globalErrorHandler);

//export application
module.exports = app;
