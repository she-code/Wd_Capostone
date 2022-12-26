const express = require('express')
const route = express.Router();
const adminController = require("../controllers/adminController")
route.post('/signup',adminController.signup)




//export route
module.exports = route