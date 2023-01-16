const { Voter, Election, Question, Answer } = require("../models");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const fs = require("fs");
exports.addVoters = async (req, res) => {
  const { voter_Id, password } = req.body;
  const electionId = req.params.id;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(req.params);

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
exports.getVoters = async (req, res) => {
  const electionId = req.params.id;
  const voters = await Voter.getVoters(electionId);
  const adminId = req.user;
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

exports.renderVotersPage = async (req, res) => {
  const electionId = req.params.id;
  const voters = await Voter.getVoters(electionId);
  const adminId = req.user;
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
  const currentVoter = req.user.id;
  const adminId = req.user.adminId;
  const electionId = req.user.electionId;

  //check if the voter is registered for the current election
  if (req.params.id != electionId) {
    //todo add flash
    return res.json("go away");
  }
  const election = await Election.getElectionDetails(adminId, electionId);
  const questions = await Question.getQuestions(adminId, electionId);
  let answers = [];
  let grouped = [];
  // console.log(questions);
  for (var i in questions) {
    answers.push(
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
  // for (var j in answers) {
  //   //   // console.log(Object.keys(answers[j]));
  //   console.log(answers[j][0].Question.title);
  //   //   // answers[j].Question.forEach((element) => {
  //   //   //   console.log(element);
  //   //   // });
  //   grouped=answers[j][0].map((e)=>{

  //   })
  //   //console.log(grouped);
  // }
  grouped = Object.keys(answers).map((item) => {
    return answers[item][0];
  });
  const redGr = grouped.reduce((accumulate, current) => {
    const questionId = current?.Question?.id;
    const existing = accumulate.findIndex((item) => item.id === questionId);
    const { ["Question"]: Question, ...answer } = current; // removes the question from the obj
    if (existing !== -1) {
      accumulate[existing].answers.push(answer);
    } else {
      accumulate.push({ ...current.Question, answers: [answer] });
    }

    return accumulate;
  }, []);

  // console.log(answers);
  if (req.accepts("html")) {
    res.render("vote", {
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
      election,
      currentVoter,
      answers,
    });
  } else {
    res.json({
      // election,
      l: "ji",
    });
  }
};
