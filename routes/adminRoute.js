const express = require("express");
const route = express.Router();
const adminController = require("../controllers/adminController");
route.post("/signup", adminController.signup);
route.get("/list", adminController.getAllAdmins);
route.post("/register", adminController.register);
route.post("/login", adminController.login);
route.post("/logout", adminController.logout);
route.post("/forgotPassword", adminController.forgotPassword);
route.post("/resetPassword/:token", adminController.resetPassword);
route.get("/resetPassword/:token", async (req, res) => {
  //check if user is logged in
  // for this u need to have a middelware to return the userID
  const token = req.params.token;
  res.render("resetPassword", {
    title: "Online Election Platform",
    token,
    csrfToken: req.csrfToken(),
  });
});
//export route
module.exports = route;
