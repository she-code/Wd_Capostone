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

//export route
module.exports = route;
