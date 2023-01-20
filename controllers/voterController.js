const { Voter, Election, Admin } = require("../models");
const { generateHashedPassword } = require("../utils/index");

//registers voters
exports.addVoters = async (req, res) => {
  const { voter_Id, password } = req.body;
  const electionId = req.params.id;
  const hashedPassword = await generateHashedPassword(password);

  try {
    //check if voter already exists
    // const voterExists = await Voter.findOne({ where: { voter_Id } });
    // if (voterExists) {
    //   console.log("voter exists");
    //   req.flash("voter already exists");
    //   return res.redirect(`/elections/${electionId}/voters`);
    // }
    const adminId = req.user;
    const voter = await Voter.addVoter({
      electionId,
      voter_Id,
      password: hashedPassword,
      adminId,
    });
    if (!voter) {
      res.status(401).json({ status: "fail", message: "Unable to add voter" });
    }
    console.log({ adminId }, voter);
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
        if (error.errors[key].message === "Voter Id must be unique") {
          req.flash("error", "Voter Id must be unique");
        }
      }
      res.redirect(`/elections/${electionId}/voters`);
    }
  }
};

//displays voters
exports.renderVotersPage = async (req, res) => {
  const electionId = req.params.id;
  const voters = await Voter.getVoters(electionId);
  const adminId = req.user;
  const election = await Election.getElectionDetails(adminId, electionId);
  const admin = await Admin.getAdminDetails(adminId);

  //return result
  if (req.accepts("html")) {
    res.render("displayVoters", {
      voters,
      election,
      admin,
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      voters,
    });
  }
};

//update voter

//delete voter
exports.deleteVoter = async (req, res) => {
  const id = req.params.id;
  const adminId = req.user;
  console.log(adminId);
  try {
    await Voter.deleteVoter(id, adminId);
    return res.json(true);
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Can't process you request");
    res.redirect("back");
  }
};
