const express = require('express')
const route = express.Router();
const adminController = require("../controllers/adminController")
route.route('/signup').post(adminController.signup)



//export route
module.exports = route