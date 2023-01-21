const { Question, Election, Answer, Admin } = require("../models");
const AppError = require("../utils/AppError");

//create elections
exports.createQuestion = async (req, res) => {
  //get adminId from req.user
  //get electionId from req.params
  const { title, description, electionId } = req.body;

  try {
    const adminId = req.user;
    const question = await Question.addQuestion({
      title,
      description,
      adminId,
      electionId,
    });

    if (!question) {
      res.status(401).json({
        status: "fail",
        message: "Unable to create election",
      });
    }

    return res.redirect(`/questions/${question.id}`);
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
        if (
          error.errors[key].message === "Validation len on description failed"
        ) {
          req.flash("error", "Description must atleaset have 5 characters");
        }
      }
    }
    res.redirect(`/elections/${electionId}/questions/new`);
  }
};

//render questions details page
exports.renderQuesDetailsPAge = async (request, response, next) => {
  const adminId = request.user;
  const id = request.params.id;
  // const admin = await Admin.getAdminDetails(loggedInUser);
  const question = await Question.getQuestion(adminId, id);
  if (!question) {
    return next(new AppError("No question found with that id", 404));
  }
  const questionId = id;
  const electionId = question.electionId;

  const election = await Election.getElectionDetails(adminId, electionId);
  const answers = await Answer.getAnswers({ adminId, questionId });
  const admin = await Admin.findByPk(adminId);

  response.render("questionDetailsPage", {
    title: "Online Voting Platform",
    election,
    question,
    answers,
    admin,
    csrfToken: request.csrfToken(),
  });
};

//delete question
exports.deleteQuestion = async (req, res, next) => {
  //get qId & adminId
  const { electionId } = req.body;
  const questionId = req.params.id;
  const adminId = req.user;

  try {
    const Questions = await Question.getQuestions(adminId, electionId);

    //todo add message
    if (Questions.length <= 1) {
      return next(new AppError("You cant delete", 403));
    }
    await Question.deleteQuestion(questionId, adminId);
    return res.json(true);
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Can't delete question ");
    res.redirect("back");
  }
};
//edit question
exports.updateQuestion = async (req, res, next) => {
  const { title, description } = req.body;
  const id = req.params.id;

  try {
    const question = await Question.findByPk(id);
    if (!question) {
      return next(new AppError("No Question found with that id", 404));
    }
    const updatedQuestion = await question.update({
      title: title,
      description: description,
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.log(error.message);
    res.json(error.message);
  }
};

//edit question page
exports.renderUpdateQuesPage = async (request, response, next) => {
  try {
    const id = request.params.id;
    const loggedInUser = request.user;
    const admin = await Admin.getAdminDetails(loggedInUser);
    const question = await Question.getQuestion(loggedInUser, id);
    if (!question) {
      return next(new AppError("No question found with that id", 404));
    }
    const election = await Election.getElectionDetails(
      loggedInUser,
      question.electionId
    );

    response.render("editQuestions", {
      title: "Update question",
      question,
      admin,
      election,
      csrfToken: request.csrfToken(),
    });
  } catch (error) {
    console.log(error.message);
  }
};
