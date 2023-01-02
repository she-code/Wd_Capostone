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
const { Admin, Election, Question, Answer, Voter } = require("./models");

//import routes
const adminRoute = require("./routes/adminRoute");
const electionRoute = require("./routes/electionsRoute");
const questionsRoute = require("./routes/questionsRoute");
const answersRoute = require("./routes/answerRoute");

// create express application
const app = express();
dotenv.config({ path: "./config.env" });

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
app.get(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminId = request.user.id;
    const id = request.params.id;
    // const admin = await Admin.getAdminDetails(loggedInUser);
    const question = await Question.getQuestion(adminId, id);
    const questionId = id;
    const election = 1;
    console.log({ questionId });
    const answers = await Answer.getAnswers({ adminId, questionId });
    response.render("questionDetailsPage", {
      title: "Questions Details",
      //admin,
      election,
      question,
      answers,
      csrfToken: request.csrfToken(),
    });
  }
);
app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const id = request.params.id;
    const admin = await Admin.getAdminDetails(loggedInUser);
    const questions = await Question.getQuestions(loggedInUser, id);
    const election = await Election.getElectionDetails(loggedInUser, id);

    response.render("listQuestions", {
      title: "Online Voting Platform",
      admin,
      election,
      questions,
      csrfToken: request.csrfToken(),
    });
  }
);
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
//routes
//register user
app.post("/users", async (request, response) => {
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
        if (
          error.errors[key].message === "Validation isEmail on email failed"
        ) {
          request.flash("error", "Invalid Email");
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
app.use("/admins", adminRoute);
app.use("/elections", electionRoute);
app.use("/questions", questionsRoute);
app.use("/answers", answersRoute);

//export application
module.exports = app;
