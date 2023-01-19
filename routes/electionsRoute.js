const express = require("express");
const connectEnsureLogin = require("connect-ensure-login");
const electionController = require("../controllers/electionsController");
const voterController = require("../controllers/voterController");
const resultController = require("../controllers/resultController");

const authenticateJWT = require("../middelwares/authenticateJWT");
const passIdToUrl = require("../middelwares/passUrl");
const { Question } = require("../models");
const router = express.Router();

router.get(
  "/:id/vote",
  passIdToUrl,
  connectEnsureLogin.ensureLoggedIn("/voterLogin"),
  voterController.renderVotingPage
);
router.post(
  "/:id/vote/analyze",

  voterController.saveVotes
);

router.use(authenticateJWT);
router.get("/", electionController.renderElectionsPage);
router.post(
  "/createElection",

  electionController.createElection
);
router.post("/:id/voters", voterController.addVoters);
router.delete("/:id", electionController.deleteElection);
router.put("/:id", electionController.updateElectionTitle);
router.get("/:id/voters", voterController.renderVotersPage);
router.put("/:id/launch", electionController.launchElection);
router.put("/:id/end", electionController.endElection);
router.get("/:id/preview", electionController.previewResults);
router.post("/:id/preview", resultController.previewResult);

router.get("/:id", electionController.renderElectionDetailsPage);
router.get("/createElections/new", electionController.renderCreateElecPage);
router.get("/:id/questions", electionController.renderManageQuesPage);
router.get("/:id/questions/new", electionController.renderCreateQuesPage);
module.exports = router;
