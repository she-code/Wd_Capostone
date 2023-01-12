const { Voter, Election } = require("../models");
const bcrypt = require("bcrypt");

exports.addVoters = async (req, res) => {
  const { voter_Id, password } = req.body;
  const electionId = req.params.id;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(req.params);

  try {
    //check if voter already exists
    const voterExists = await Voter.findOne({ where: { voter_Id } });
    // if (voterExists) {
    //   req.flash("voter already exists");
    //   return res.redirect(`/elections/${electionId}/voters`);
    // }
    const voter = await Voter.addVoter({
      electionId,
      voter_Id,
      password: hashedPassword,
    });
    if (!voter) {
      res.status(401).json({ status: "fail", message: "Unable to add voter" });
    }
    console.log(voter);
    return res.redirect(`/elections/${electionId}/voters`);
  } catch (error) {
    console.log(error.message);
    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        console.log(error.errors[key].message);

        if (
          error.errors[key].message === "Validation notEmpty on voter_Id failed"
        ) {
          req.flash("error", "Username can't be empty");
        }
        if (
          error.errors[key].message ===
          "Validation error: Voter Id must be unique"
        ) {
          req.flash("error", "Description must atleaset have 5 characters");
        }
      }
      res.redirect(`/elections/${electionId}/voters`);
    }
  }
};
exports.getVoters = async (req, res) => {
  const electionId = req.params.id;
  const voters = await Voter.getVoters(electionId);
  const adminId = req.user.id;
  const election = await Election.getElectionDetails(adminId, electionId);
  if (req.accepts("html")) {
    res.render("displayVoters", {
      voters,
      election,
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      voters,
    });
  }
};

exports.vote = async (req, res) => {
  res.send("hi");
};
