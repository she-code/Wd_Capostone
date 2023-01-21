/**This routes handles any requests starting with /elections */
const express = require("express");
const passport = require("passport");

const electionController = require("../controllers/electionsController");
const voterController = require("../controllers/voterController");
const resultController = require("../controllers/resultController");

const authenticateJWT = require("../middelwares/authenticateJWT");
const passIdToUrl = require("../middelwares/passUrl");
const checkElectionStatus = require("../middelwares/checkElectionStatus");
const initiatePassport = require("../auth/passport/index");

const router = express.Router();

router.get("/", authenticateJWT, electionController.renderElectionsPage);
router.post(
  "/createElection",
  authenticateJWT,

  electionController.createElection
);
router.post("/:id/voters", authenticateJWT, voterController.addVoters);
router.delete("/:id", authenticateJWT, electionController.deleteElection);
router.put("/:id", authenticateJWT, electionController.updateElection);
router.get("/:id/voters", authenticateJWT, voterController.renderVotersPage);
router.put("/:id/launch", authenticateJWT, electionController.launchElection);
router.put("/:id/end", authenticateJWT, electionController.endElection);
router.get("/:id/preview", authenticateJWT, electionController.previewResults);
router.post("/:id/preview", authenticateJWT, resultController.previewResult);

router.get(
  "/:id",
  authenticateJWT,
  electionController.renderElectionDetailsPage
);
router.get(
  "/:id/edit",
  authenticateJWT,
  electionController.renderUpdateElecPage
);

router.get(
  "/createElections/new",
  authenticateJWT,
  electionController.renderCreateElecPage
);
router.get(
  "/:id/questions",
  authenticateJWT,
  electionController.renderManageQuesPage
);
router.get(
  "/:id/questions/new",
  authenticateJWT,
  electionController.renderCreateQuesPage
);

//intialize passport
router.use(passport.initialize());
router.use(passport.session());

initiatePassport(passport);

router.get(
  "/e/:customString/vote",
  checkElectionStatus,
  passIdToUrl,
  //connectEnsureLogin.ensureLoggedIn("/voterLogin"),
  electionController.renderVotingPage
  // voterController.renderVotingPage
);
router.post(
  "/:id/vote/analyze",

  electionController.saveVotes
);
//intialize passport
router.use(passport.initialize());
router.use(passport.session());

initiatePassport(passport);

router.get(
  "/e/:customString/vote",
  checkElectionStatus,
  passIdToUrl,
  //connectEnsureLogin.ensureLoggedIn("/voterLogin"),
  electionController.renderVotingPage
  // voterController.renderVotingPage
);
router.post(
  "/:id/vote/analyze",

  electionController.saveVotes
);

router.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/voterLogin",
    failureFlash: true,
  }),
  async (request, response) => {
    //const { email, password } = request.body;
    //console.log(request.user.id);

    response.redirect(`/elections/e/${global.elecIdUrl}/vote`);
  }
);
module.exports = router;
