const express = require('express')
const connectEnsureLogin = require("connect-ensure-login");
const questionsController = require('../controllers/questionsController')
const router = express.Router()
router.post('/createQuestion',connectEnsureLogin.ensureLoggedIn(),questionsController.createQuestion)
module.exports = router