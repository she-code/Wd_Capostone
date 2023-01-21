/* The bellow code is a route file for the admin. */
const express = require("express");
const route = express.Router();
const adminController = require("../controllers/adminController");
const authenticateJWT = require("../middelwares/authenticateJWT");

route.get("/list", adminController.getAllAdmins);
route.get("/myProfile", authenticateJWT, adminController.getAdminDetails);

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
