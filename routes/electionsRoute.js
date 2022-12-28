const express = require('express')
const connectEnsureLogin = require("connect-ensure-login");
const electionController = require('../controllers/electionsController')
const router = express.Router()
router.post('/createElection',connectEnsureLogin.ensureLoggedIn(),electionController.createElection)
module.exports = router