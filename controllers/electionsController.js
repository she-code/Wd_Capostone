const {
  Election,
  Admin,
  Voter,
  Question,
  Answer,
  Result,
} = require("../models");
const { fn, col } = require("sequelize");
const { encode } = require("../utils");
const AppError = require("../utils/AppError");

//get elections
exports.getElections = async (req, res, next) => {
  const loggedInUser = req.user;
  const electionss = await Election.getElections(loggedInUser);
  if (!electionss) {
    return next(new AppError("No elections found for this user", 404));
  }
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
exports.createElection = async (req, res, next) => {
  try {
    const { title, customString } = req.body;
    const adminId = req.user;
    const election = await Election.addElection({
      title: title,
      url: customString,
      status: "created",
      adminId,
    });
    if (!election) {
      return next(new AppError("Unable to create election", 404));
    }
    return res.redirect(`/elections/${election.id}`);
  } catch (error) {
    console.log(error.message);
    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        console.log(error.errors[key].message);

        if (
          error.errors[key].message === "Validation notEmpty on title failed"
        ) {
          req.flash("error", "Title can't be empty");
        }
        if (error.errors[key].message === "Validation notEmpty on url failed") {
          req.flash("error", "Custom string can't be empty");
        }
        if (
          error.errors[key].message ===
          "Elections's custom string must be unique"
        ) {
          req.flash("error", "Elections's custom string must be unique");
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
    if (!election) {
      return next(new AppError("No election found with that id", 404));
    }

    //check if every question contains atleast two answers
    const questions = await Question.getQuestions(adminId, electionId);
    // if (!questions) {
    //   return next(new AppError("No questions found", 404));
    // }
    if (questions.length < 1) {
      return next(
        new AppError(
          "An election must have atleast 1 question to be launched",
          403
        )
      );
    }
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
      console.log(
        "Every question in an election must have atleast two answers"
      );
      return next(
        new AppError(
          "Every question in an election must have atleast two answers",
          403
        )
      );
    }
    const updatedElection = await election.updateElectionStatus("launched");
    if (!updatedElection) {
      console.log("error");
      return next(
        new AppError(
          "Every question in an election must have atleast two answers",
          403
        )
      );
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
    if (!election) {
      return next(new AppError("No election found with that id", 404));
    }
    const updatedElection = await election.updateElectionStatus("ended");

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
exports.updateElection = async (req, res, next) => {
  const { title } = req.body;
  const id = req.params.id;
  console.log(req.body);
  try {
    const election = await Election.findByPk(id);
    if (!election) {
      return next(new AppError("No election found with that id", 404));
    }
    const updatedElection = await election.update({
      title: title,
    });
    // const updatedElection = await election.updateElection({title:title,url:customString});
    console.log(updatedElection);

    // res.json(updatedElection);
    res.json(updatedElection);
    // res.redirect(`/elections`);
  } catch (error) {
    console.log(error.message);
    res.json(error.message);
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
exports.renderElectionDetailsPage = async (request, response, next) => {
  const loggedInUser = request.user;
  const id = request.params.id;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const questions = await Question.getQuestions(loggedInUser, id);
  const election = await Election.getElectionDetails(loggedInUser, id);
  if (!election) {
    return next(new AppError("No election found with that id", 404));
  }
  const electionId = election.id;
  const urlId = encode(electionId);
  const voters = await Voter.getVoters(electionId);
  request.voterUrl = electionId;
  if (request.accepts("html")) {
    response.render("electionDetailsPage", {
      title: "Election Details",
      admin,
      election,
      questions,
      voters,
      urlId,
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
//edit election page
exports.renderUpdateElecPage = async (request, response, next) => {
  const id = request.params.id;
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const election = await Election.getElectionDetails(loggedInUser, id);
  if (!election) {
    return next(new AppError("No election found with that id", 404));
  }
  console.log({ election });

  response.render("editElectionPage", {
    title: "Update Election",
    election,
    admin,
    csrfToken: request.csrfToken(),
  });
};

//render vote page
exports.renderVotingPage = async (req, res) => {
  //req.user might be empty
  const currentVoter = req.user;

  let answersWithQuestion = [];
  let filteredAnswers = [];
  // //u might need to remove the admin id
  const election = await Election.getElectionByCustStr(global.elecIdUrl);
  const questions = await Question.findAll({
    where: { electionId: election.id },
  });
  //console.log(election, questions);

  // include questions table to answers (inner join)
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
    for (var j = 0; j < answersWithQuestion[l].length; j++) {
      var innerValue = answersWithQuestion[l][j];
      filteredAnswers.push(innerValue);
    }
  }

  // //parse the data
  let stringifiedData = JSON.stringify(filteredAnswers);
  let parsedData = JSON.parse(stringifiedData);

  //group by question id
  const groupedByQuestion = parsedData.reduce((accumulate, current) => {
    const questionId = current?.Question?.id;
    const existing = accumulate.findIndex((item) => item.id === questionId);
    // eslint-disable-next-line no-unused-vars
    const { ["Question"]: Question, ...answer } = current; // removes the question from the obj
    if (existing !== -1) {
      accumulate[existing].answers.push(answer);
    } else {
      accumulate.push({ ...current.Question, answers: [answer] });
    }
    return accumulate;
  }, []);

  // //return the result
  if (req.accepts("html")) {
    res.render("vote", {
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
      election,
      currentVoter,
      groupedByQuestion,
    });
  } else {
    res.json({
      // election,
      l: "ji",
    });
  }
};
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

  const strR = JSON.stringify(result);
  const parR = JSON.parse(strR);
  parR.forEach((element) => {
    labels.push(element.Answer.content);
    votes.push(element.votes);
  });

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
exports.saveVotes = async (req, res) => {
  //fetch all data from req.body
  // eslint-disable-next-line no-unused-vars
  const { ["_csrf"]: _csrf, ["electionId"]: electionId, ...rest } = req.body;
  const voter_Id = req.user?.id;
  const voter = await Voter.findByPk(req.user.id);

  //check of voter already voted
  if (voter.status == "voted") {
    return res.json("You have already voted");
  }
  //create results for each submission
  await Promise.all(
    Object.keys(rest).map(async (key) => {
      console.log(rest[key]);
      await Result.addVotingResult({
        questionId: key,
        answerId: rest[key],
        electionId: electionId,
        voter_Id: voter_Id,
      });
    })
  );
  //update voter status
  await voter.updateVoterStatus("voted");

  // const result = await Result.findAll({ raw: true });
  // console.log(result);
  res.redirect("back");
};
