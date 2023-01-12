const { Election } = require("../models");

//get elections
exports.getElections = async (req, res) => {
  const loggedInUser = req.user.id;
  const electionss = await Election.getElections(loggedInUser);
  if (req.accepts("html")) {
    res.render("elections", {
      electionss,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      electionss,
    });
  }
};
//create elections
exports.createElection = async (req, res) => {
  try {
    const { title } = req.body;
    const adminId = req.user.id;
    const election = await Election.addElection({
      title: title,
      status: "created",
      adminId,
    });
    if (!election) {
      res.status(401).json({
        status: "fail",
        message: "Unable to create election",
      });
    }
    return res.redirect(`/elections/${election.id}`);
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        console.log(error.errors[key].message);

        if (
          error.errors[key].message === "Validation notEmpty on title failed"
        ) {
          req.flash("error", "Title can't be empty");
        }
      }
    }
    res.redirect("/elections/new");
  }
};

//change the status of election to launch election
exports.launchElection = async (req, res) => {
  const electionId = req.params.id;
  try {
    const election = await Election.findByPk(electionId);
    console.log({ election });
    const updatedElection = await election.updateElectionStatus();
    if (!updatedElection) {
      console.log("error");
    }
    console.log(updatedElection);
    return res.json(updatedElection);
  } catch (error) {
    console.log(error.message);
    res.status(501).json({
      status: "fail",
      message: error.message,
    });
  }
};
