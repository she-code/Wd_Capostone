const express = require("express");
const connectEnsureLogin = require("connect-ensure-login");
const voterController = require("../controllers/voterController");
const { Voter } = require("../models");
const authenticateJWT = require("../middelwares/authenticateJWT");
const router = express.Router();
router.post(
  "/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  voterController.addVoters
);

router.get(
  "/:id/vote",
  connectEnsureLogin.ensureLoggedIn("/voterLogin"),
  voterController.renderVotingPage
);
router.get("/", async (req, res) => {
  const voter = await Voter.findAll({ raw: true });
  res.send(voter);
});
router.delete("/:id", authenticateJWT, voterController.deleteVoter);
module.exports = router;
