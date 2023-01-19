const {
  Election,
  Admin,
  Voter,
  Question,
  Answer,
  Result,
} = require("../models");
const { fn, col } = require("sequelize");

//get elections
exports.getElections = async (req, res) => {
  const loggedInUser = req.user;
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

//creates elections
exports.createElection = async (req, res) => {
  try {
    const { title } = req.body;
    const adminId = req.user;
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
    res.redirect("/elections/createElections/new");
  }
};

//change the status of election to launch election
exports.launchElection = async (req, res, next) => {
  const electionId = req.params.id;
  const adminId = req.user;
  let answersWithQuestion = [];
  let error = false;

  try {
    const election = await Election.getElectionDetails(adminId, electionId);
    //console.log({ election });
    //check if every question contains atleast two answers
    const questions = await Question.getQuestions(adminId, electionId);
    for (var i in questions) {
      answersWithQuestion.push(
        await Answer.findAll({
          where: { questionId: questions[i].id },
          include: [
            {
              model: Question,
              required: true,
            },
          ],
        })
      );
    }
    //extract the anwsers from the given data it's in [[{}],[{}]] format
    for (var l = 0; l < answersWithQuestion.length; l++) {
      console.log(answersWithQuestion[l].length);
      if (answersWithQuestion[l].length < 2) {
        error = true;
      }
    }
    //todo add flash message
    if (error) {
      // req.flash(
      //   "error",
      //   "Every question in an election must have atleast two answers"
      // );
      // res.redirect("back");
      console.log(
        "Every question in an election must have atleast two answers"
      );
      return;
    }
    const updatedElection = await election.updateElectionStatus("launched");
    if (!updatedElection) {
      console.log("error");
      return next();
    }
    console.log(updatedElection);
    return res.json(updatedElection);
    // res.send("hi");
  } catch (error) {
    console.log(error.message);
    res.status(501).json({
      status: "fail",
      message: error.message,
    });
  }
};
//end election
exports.endElection = async (req, res, next) => {
  const electionId = req.params.id;
  const adminId = req.user;
  try {
    const election = await Election.getElectionDetails(adminId, electionId);
    const updatedElection = await election.updateElectionStatus("ended");
    if (!updatedElection) {
      return next("Cant update");
    }
    return res.json(updatedElection);
  } catch (error) {
    console.log(error.message);
  }
};
//delete election
exports.deleteElection = async (req, res) => {
  const electionId = req.params.id;
  const adminId = req.user;
  console.log(adminId);
  try {
    await Election.deleteElection(electionId, adminId);
    return res.json(true);
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Can't process you request");
  }
};

//edit election
exports.updateElectionTitle = async (req, res) => {
  const { title } = req.body;
  const id = req.params.id;
  console.log(id);
  try {
    const election = await Election.findByPk(id);
    const updatedElection = await election.updateElectionTitle(title);
    console.log(title, election);

    // res.json(updatedElection);
    res.json(updatedElection);
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Can't process you request");
  }
};

//render elections page
exports.renderElectionsPage = async (request, response) => {
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const elections = await Election.getElections(loggedInUser);
  if (request.accepts("html")) {
    response.render("elections", {
      title: "Online Voting Platform",
      admin,
      elections,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      elections,
    });
  }
};

//create election page
exports.renderCreateElecPage = async (request, response) => {
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  response.render("createElections", {
    title: "Create Elections",
    admin,
    csrfToken: request.csrfToken(),
  });
};

//election details page
exports.renderElectionDetailsPage = async (request, response) => {
  const loggedInUser = request.user;
  const id = request.params.id;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const questions = await Question.getQuestions(loggedInUser, id);
  const election = await Election.getElectionDetails(loggedInUser, id);
  const electionId = election.id;

  const voters = await Voter.getVoters(electionId);
  request.voterUrl = electionId;
  if (request.accepts("html")) {
    response.render("electionDetailsPage", {
      title: "Election Details",
      admin,
      election,
      questions,
      voters,

      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      election,
    });
  }
};

// manage questions page
exports.renderManageQuesPage = async (request, response) => {
  const loggedInUser = request.user;
  const id = request.params.id;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const questions = await Question.getQuestions(loggedInUser, id);
  const election = await Election.getElectionDetails(loggedInUser, id);

  response.render("manageQuestions", {
    title: "Online Voting Platform",
    admin,
    election,
    questions,
    csrfToken: request.csrfToken(),
  });
};

//create questions page
exports.renderCreateQuesPage = async (request, response) => {
  const id = request.params.id;
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const election = await Election.getElectionDetails(loggedInUser, id);
  console.log({ election });
  response.render("createQuestions", {
    title: "Create Questions",
    election,
    admin,
    csrfToken: request.csrfToken(),
  });
};

//render result page

//render result page
exports.previewResults = async (req, res) => {
  const electionId = req.params.id;
  const result = await Result.findAll({
    // where: { [Op.and]: [{ electionId }, { questionId }] },
    where: { electionId },
    include: [
      {
        model: Answer,
        required: true,
        attributes: ["content", "id"],
      },
      {
        model: Question,
        required: true,
        attributes: ["title", "description", "id", "electionId"],
      },
    ],
    attributes: [
      "answerId",
      "Result.questionId",
      "Result.electionId",
      "Answer.id",
      "Question.id",
      [fn("COUNT", col("voter_Id")), "votes"],
    ],
    group: [
      "answerId",
      "Result.questionId",
      "Result.electionId",
      "Question.id",
      "Answer.id",
    ],
  });
  const labels = [];
  const votes = [];
  const backgroundColor = [
    "rgb(133, 105, 241)",
    "rgb(164, 101, 241)",
    "rgb(101, 143, 241)",
    "rgb(101, 143, 231)",
  ];
  const strR = JSON.stringify(result);
  const parR = JSON.parse(strR);
  parR.forEach((element) => {
    labels.push(element.Answer.content);
    votes.push(element.votes);
  });
  var dataPie = {
    labels: labels,
    datasets: [
      {
        label: "My First Dataset",
        data: votes,
        backgroundColor: backgroundColor,
        hoverOffset: 4,
      },
    ],
  };
  console.log(dataPie);
  for (const key in dataPie) {
    console.log(dataPie[key]);
  }
  console.log(parR);
  //get election
  const admin = req.user;
  const election = await Election.getElectionDetails(admin, electionId);
  const questions = await Question.getQuestions(admin, electionId);

  if (req.accepts("html")) {
    res.render("previewResult", {
      election,
      questions,
      parR,
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
    });
  } else {
    res.send("electionss");
  }
};
