const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");

const { Admin, Election, Question, Voter, Answer } = require("../models");
const Email = require("./../utils/email");
const AppError = require("../utils/AppError");
const { generateJwtToken, generateHashedPassword } = require("../utils/index");

//creates token and saves it in cookies
const createSendToken = (admin, req, res) => {
  //generate jwt token
  const token = generateJwtToken(admin.id, "admin");

  const cookieOPtions = {
    expiresIn: "60d",
    httpOnly: true,
  };
  if (process.env.NODE_ENV == "production") cookieOPtions.secure = true;

  res.cookie("jwt", token, cookieOPtions);

  //redirect to elections page
  res.redirect("/elections");
};

//register admin
exports.register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  //encrypt password
  const hashedPwd = await generateHashedPassword(password);

  //create user
  try {
    const admin = await Admin.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPwd,
    });
    createSendToken(admin, req, res);
  } catch (error) {
    console.log(error.message);
    if (error.name === "SequelizeUniqueConstraintError") {
      req.flash("error", "Email already exists");
      res.redirect("/signup");
    }
    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        console.log(error.errors[key].message);
        if (
          error.errors[key].message === "Validation len on firstName failed"
        ) {
          req.flash("error", "First name must have minimum of 2 characters");
        }
        if (error.errors[key].message === "Validation len on lastName failed") {
          req.flash("error", "Last name must have minimum of 2 characters");
        }
        if (
          error.errors[key].message === "Validation isEmail on email failed"
        ) {
          req.flash("error", "Invalid Email");
        }
        if (error.errors[key].message === "Email address already in use!") {
          req.flash("error", "Email address already in use!");
        }
      }
      //   res.redirect("/todos");
      res.redirect("/signup");
    }
  }
};

// login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    //search admin using email
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      req.flash("error", "No user found");
      res.redirect("/login");
    }
    //compare password
    const passWordCorrect = await bcrypt.compare(password, admin.password);
    if (!passWordCorrect) {
      req.flash("error", "Invalid username or password");
      res.redirect("/login");
    }
    if (passWordCorrect) {
      createSendToken(admin, req, res);
    }
  } catch (error) {
    console.log(error.message);
  }
};

//logout user
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.redirect("/");
};

// get admin details
exports.getAdminDetails = async (req, res, next) => {
  const userId = req.user;
  const admin = await Admin.findByPk(userId);
  if (!admin) {
    //req.flash("error", "No User found");
    return next(new AppError("No admin found", 404));
  }
  const elections = await Election.getElections(admin.id);
  const questions = await Question.findAll({ where: { adminId: admin.id } });
  const answers = await Answer.findAll({ where: { adminId: admin.id } });
  const voters = await Voter.findAll({ where: { adminId: admin.id } });

  if (req.accepts("html")) {
    res.render("profilePage", {
      admin,
      elections,
      voters,
      questions,
      answers,
      title: "My Profile",
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      admin,
    });
  }
};
//get all admins
exports.getAllAdmins = async (req, res) => {
  const admins = await Admin.getAllAdmins();
  if (req.accepts("html")) {
    res.render("displayAdminsPage", {
      admins,
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      admins,
    });
  }
};

//forgot password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  //get the user by email
  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    req.flash("error", "No user found with this email");
    res.redirect("back");
    return;
  }
  //create hashed token
  const resetToken = admin.createPasswordResetToken();
  //update admin
  await admin.save();

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/admins/resetPassword/${resetToken}`;
  await new Email(admin, resetUrl).sendPasswordReset();

  req.flash(
    "success",
    "An email to reset your password has been sent please check your inbox"
  );
  res.redirect("back");
};

//reset password
exports.resetPassword = async (req, res) => {
  //get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const admin = await Admin.findOne({
    where: {
      passwordResetToken: hashedToken,

      PasswordResetExpires: {
        [Op.gt]: Date.now(),
      },
    },
  });
  if (!admin) {
    req.flash("error", "Invalid token");
    res.redirect("back");
    return;
  }
  //update user
  const hashedPassword = await generateHashedPassword(req.body.password);
  admin.password = hashedPassword;
  admin.passwordResetToken = "undefined";
  admin.PasswordResetExpires = null;
  await admin.save();
  const token = generateJwtToken(admin.id, "admin");
  const cookieOPtions = {
    expiresIn: "60d",

    httpOnly: true,
  };
  if (process.env.NODE_ENV == "production") cookieOPtions.secure = true;

  //save cookies
  res.cookie("jwt", token, cookieOPtions);

  //redirect to elections page
  res.redirect("/elections");
};
