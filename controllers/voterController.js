const {
  Voter,
  Election,
  Question,
  Answer,
  Result,
  Admin,
} = require("../models");
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

//saves voting results
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

//renders voting page
exports.renderVotingPage = async (req, res) => {
  const currentVoter = req.user;
  const adminId = currentVoter.adminId;
  const electionId = currentVoter.electionId;
  let answersWithQuestion = [];
  let filteredAnswers = [];
  //u might need to remove the admin id
  const election = await Election.getElectionDetails(adminId, electionId);
  const questions = await Question.getQuestions(adminId, electionId);

  //include questions table to answers (inner join)
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

  //parse the data
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

  //return the result
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
