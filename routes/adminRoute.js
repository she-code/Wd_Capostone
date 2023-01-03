const express = require("express");
const route = express.Router();
const adminController = require("../controllers/adminController");
route.post("/signup", adminController.signup);
route.get("/list", adminController.getAllAdmins);

//export route
module.exports = route;
