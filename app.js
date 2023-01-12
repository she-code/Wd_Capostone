//import packages
const express = require("express");
const bodyParser = require("body-parser");
const flash = require("connect-flash");

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
const { Admin, Election, Question, Answer, Voter } = require("./models");

//import routes
const adminRoute = require("./routes/adminRoute");
const electionRoute = require("./routes/electionsRoute");
const questionsRoute = require("./routes/questionsRoute");
const answersRoute = require("./routes/answerRoute");
const votersRoute = require("./routes/votersRoute");
dotenv.config({ path: "./config.env" });

// create express application
const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser("process.env.SECRET_STRING"));

app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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

passport.serializeUser((admin, done) => {
  console.log("Seralizing admin in session", admin.id);
  done(null, admin.id);
});

passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => done(error, null));
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

//display elections for loggedin user
app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const admin = await Admin.getAdminDetails(loggedInUser);
    const elections = await Election.getElections(loggedInUser);
    if (request.accepts("html")) {
      response.render("elections", {
        title: "Online Voting Platform",
        admin,
        elections,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        elections,
      });
    }
  }
);

//create election page
app.get(
  "/elections/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("createElections", {
      title: "Create Elections",
      csrfToken: request.csrfToken(),
    });
  }
);

//election details page
app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const id = request.params.id;
    const admin = await Admin.getAdminDetails(loggedInUser);
    const questions = await Question.getQuestions(loggedInUser, id);
    const election = await Election.getElectionDetails(loggedInUser, id);
    const electionId = election.id;
    const voters = await Voter.getVoters(electionId);
    if (request.accepts("html")) {
      response.render("electionDetailsPage", {
        title: "Election Details",
        admin,
        election,
        questions,
        voters,

        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        election,
      });
    }
  }
);

// manage questions page
app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const id = request.params.id;
    const admin = await Admin.getAdminDetails(loggedInUser);
    const questions = await Question.getQuestions(loggedInUser, id);
    const election = await Election.getElectionDetails(loggedInUser, id);

    response.render("manageQuestions", {
      title: "Online Voting Platform",
      admin,
      election,
      questions,
      csrfToken: request.csrfToken(),
    });
  }
);

//create questions page
app.get(
  "/elections/:id/questions/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const id = request.params.id;

    const election = await Election.getElectionDetails(loggedInUser, id);

    response.render("createQuestions", {
      title: "Create Elections",
      election,
      csrfToken: request.csrfToken(),
    });
  }
);

//question details page
app.get(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminId = request.user.id;
    const id = request.params.id;
    // const admin = await Admin.getAdminDetails(loggedInUser);
    const question = await Question.getQuestion(adminId, id);
    const questionId = id;
    const electionId = question.electionId;
    const election = await Election.getElectionDetails(adminId, electionId);
    console.log({ election });
    const answers = await Answer.getAnswers({ adminId, questionId });
    response.render("questionDetailsPage", {
      title: "Online Voting Platform",
      //admin,
      election,
      question,
      answers,
      csrfToken: request.csrfToken(),
    });
  }
);

/// answers list page
app.get(
  "/answers",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const admin = await Admin.getAdminDetails(loggedInUser);
    const elections = await Election.getElections(loggedInUser);
    response.render("answers", {
      title: "Online Voting Platform",
      admin,
      elections,
      csrfToken: request.csrfToken(),
    });
  }
);
// app.get("/vote", async (req, res) => {
//   //check if user is logged in
//   // for this u need to have a middelware to return the userID
// });
//register user
app.post("/admins", async (request, response) => {
  const { firstName, lastName, email, password } = request.body;
  const hashedPwd = await bcrypt.hash(password, 10);
  //create user
  try {
    const user = await Admin.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPwd,
    });
    request.logIn(user, (err) => {
      if (err) {
        console.log("from", err);
      }
      response.redirect("/elections");
    });
  } catch (error) {
    console.log(error.message);
    if (error.name === "SequelizeUniqueConstraintError") {
      request.flash("error", "Email already exists");
      response.redirect("/signup");
    }
    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        console.log(error.errors[key].message);
        if (
          error.errors[key].message === "Validation len on firstName failed"
        ) {
          request.flash(
            "error",
            "First name must have minimum of 2 characters"
          );
        }
        if (error.errors[key].message === "Validation len on lastName failed") {
          request.flash("error", "Last name must have minimum of 2 characters");
        }
        if (
          error.errors[key].message === "Validation isEmail on email failed"
        ) {
          request.flash("error", "Invalid Email");
        }
        if (error.errors[key].message === "Email address already in use!") {
          request.flash("error", "Email address already in use!");
        }
      }
      //   response.redirect("/todos");
      response.redirect("/signup");
    }
  }
});

//login user
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (request, response) => {
    //const { email, password } = request.body;
    //console.log(request.user.id);
    response.redirect("/elections");
  }
);
//sign out user
app.get("/signout", (request, response, next) => {
  request.logOut((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

//routes
app.use("/admins", adminRoute);
app.use("/elections", electionRoute);
app.use("/questions", questionsRoute);
app.use("/answers", answersRoute);
app.use("/voters", votersRoute);

//export application
module.exports = app;
