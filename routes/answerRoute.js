const express = require('express')
const answerControler = require('../controllers/answerControler')
const connectEnsureLogin = require('connect-ensure-login')
const router = express.Router()
router.post('/createAnswers',connectEnsureLogin.ensureLoggedIn(),answerControler.createAnswer)
module.exports=router