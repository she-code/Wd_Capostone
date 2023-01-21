//import packages
const express = require("express");
const bodyParser = require("body-parser");
const flash = require("connect-flash");

const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const passport = require("passport");
const csurf = require("tiny-csrf");
const session = require("express-session");
dotenv.config({ path: "./config.env" });

//import files
const { Voter, Election, Question } = require("./models");
const initiatePassport = require("./auth/passport/index");
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

app.use(bodyParser.json());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser("process.env.SECRET_STRING"));
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  console.log("cookie", req.cookies);
  console.log(process.env.NODE_ENV);
  next();
});
app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
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

// //intialize passport
// app.use(passport.initialize());
// app.use(passport.session());

// initiatePassport(passport);

// passport.serializeUser((voter, done) => {
//   console.log("Seralizing voter in session", voter.id);
//   done(null, voter.id);
// });

// passport.deserializeUser((id, done) => {
//   Voter.findByPk(id)
//     .then((user) => {
//       done(null, user);
//     })
//     .catch((error) => done(error, null));
// });

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
app.get("/lol", async (req, res) => {
  res.render("result", {
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
  // for this u need to have a middelware to return the userID
  res.render("voterLogin", {
    title: "Online Election Platform",
    csrfToken: req.csrfToken(),
  });
});
app.get("/forgotPassword", async (req, res) => {
  //check if user is logged in
  // for this u need to have a middelware to return the userID
  res.render("forgotPassword", {
    title: "Online Election Platform",
    csrfToken: req.csrfToken(),
  });
});
app.get("/resetPassword", async (req, res) => {
  //check if user is logged in
  // for this u need to have a middelware to return the userID
  res.render("resetPassword", {
    title: "Online Election Platform",
    csrfToken: req.csrfToken(),
  });
});
app.get("/vote", async (req, res) => {
  const currentVoter = req.user.id;
  const adminId = req.user.adminId;
  const electionId = req.user.electionId;
  const election = await Election.getElectionDetails(adminId, electionId);
  const questions = await Question.getQuestions(adminId, election.id);
  //get id
  console.log({ adminId }, { questions }, { election });
  res.render("vote", {
    title: "Online Election Platform",
    csrfToken: req.csrfToken(),
    election,
    currentVoter,
    // questions,
  });
});

//login voter
// app.post(
//   "/session",
//   passport.authenticate("local", {
//     failureRedirect: "/voterLogin",
//     failureFlash: true,
//   }),
//   async (request, response) => {
//     //const { email, password } = request.body;
//     //console.log(request.user.id);

//     response.redirect(`/elections/e/${global.elecIdUrl}/vote`);
//   }
// );
//sign out user
app.get("/signout", (request, response, next) => {
  response.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  // res.status(200).json({ status: "success" });
  // request.logOut((err) => {
  //   if (err) {
  //     return next(err);
  //   }
  response.redirect("/");
  // });
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
