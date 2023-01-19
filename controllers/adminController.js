const { Admin } = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Op } = require("sequelize");
const Email = require("./../utils/email");

const { generateJwtToken, generateHashedPassword } = require("../utils/index");
//register admin
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const salt = await bcrypt.genSalt(process.env.HASH_NUMBER);
    const hashedPassword = await bcrypt.hash(password, salt);
    //check empty inputs
    if (
      firstName == null ||
      lastName == null ||
      email == null ||
      password == null
    ) {
      return res
        .status()
        .json({ status: 401, message: "Cant have empty fields" });
    }

    //search if email exists
    const emailExists = await Admin.findOne({ where: { email } });
    if (emailExists) {
      return res
        .status()
        .json({ status: 409, message: "Email already exist ! LOGIN instead" });
    }
    //create admin
    const admin = Admin.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPassword,
    });

    if (!admin) {
      return res
        .status()
        .json({ status: 501, message: "Unable to create account. Try later" });
    }

    //jwt,cookie will be added todo
  } catch (error) {
    return res.status().json({ status: 501, message: error.message });
  }
};

//register admin
exports.register = async (request, response) => {
  const { firstName, lastName, email, password } = request.body;
  const hashedPwd = await generateHashedPassword(password);
  //create user
  try {
    const admin = await Admin.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hashedPwd,
    });
    // const token = generateJwtToken(user.id, "admin");
    const token = generateJwtToken(admin.id, "admin");
    const cookieOPtions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV == "production") cookieOPtions.secure = true;

    response.cookie("jwt", token, cookieOPtions);
    const url = `${request.protocol}://${request.get("host")}/me`;
    // console.log(url);
    await new Email(admin, url).sendWelcome();

    request.logIn(admin, (err) => {
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
};

// login
exports.login = async (request, response) => {
  const { email, password } = request.body;
  try {
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      request.flash("error", "No user found");
      response.redirect("/login");
    }
    const passWordCorrect = await bcrypt.compare(password, admin.password);
    if (!passWordCorrect) {
      request.flash("error", "Incorrect password");
    }
    if (passWordCorrect) {
      const token = generateJwtToken(admin.id, "voter");

      const cookieOPtions = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
      };
      if (process.env.NODE_ENV == "production") cookieOPtions.secure = true;

      response.cookie("jwt", token, cookieOPtions);
      request.logIn(admin, (err) => {
        if (err) {
          console.log("from", err);
        }
        response.redirect("/elections");
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.logout = (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  // res.status(200).json({ status: "success" });
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

// get admin details
exports.getAdminDetails = async (req, res) => {
  const userId = req.user.id;
  const admin = await Admin.findByPk({ where: { id: userId } });
  if (!admin) {
    res.status(404).json({ status: 404, message: "User not found" });
  }
  return admin;
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
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  //get the user by email
  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return next("no user");
  }
  //create hashed token
  const resetToken = admin.createPasswordResetToken();
  //update admin
  await admin.save();

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/admins/resetPassword/${resetToken}`;
  await new Email(admin, resetUrl).sendPasswordReset();
  if (!admin) {
    req.flash("error", "No user found with this email");
  }

  req.flash(
    "success",
    "An email to reset your password has been sent please check your inbox"
  );
  res.redirect("back");
};

exports.resetPassword = async (req, res, next) => {
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
    return next("no user found");
  }
  //update user
  const hashedPassword = await generateHashedPassword(req.body.password);
  admin.password = hashedPassword;
  admin.passwordResetToken = "undefined";
  admin.PasswordResetExpires = null;
  await admin.save();
  const token = generateJwtToken(admin.id, "admin");
  const cookieOPtions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV == "production") cookieOPtions.secure = true;

  res.cookie("jwt", token, cookieOPtions);
  // const url = `${req.protocol}://${req.get("host")}/me`;
  // // console.log(url);
  // await new Email(admin, url).sendWelcome();
  req.logIn(admin, (err) => {
    if (err) {
      console.log("from", err);
    }
    res.redirect("/elections");
  });
  //res.send(admin);
  //check if token has expired
  //update chagedPasswordAt
  //log the user,send jwt
};
