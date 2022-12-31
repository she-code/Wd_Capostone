const express = require('express')
const connectEnsureLogin = require("connect-ensure-login");
const electionController = require('../controllers/electionsController')
const voterController = require('../controllers/voterController')

const router = express.Router()
router.post('/createElection',connectEnsureLogin.ensureLoggedIn(),electionController.createElection)
router.post('/:id/voters',connectEnsureLogin.ensureLoggedIn(),voterController.addVoters)
router.get('/:id/voters',connectEnsureLogin.ensureLoggedIn(),voterController.getVoters)

module.exports = router
