const { Answer, Admin, Election, Question } = require("../models");
const AppError = require("../utils/AppError");

//create answer
exports.createAnswer = async (req, res) => {
  //get adminId from req.user
  //get electionId from req.body
  const { content, questionId } = req.body;

  try {
    const adminId = req.user;
    const answer = await Answer.addAnswers({
      adminId,
      content,
      questionId,
    });
    if (!answer) {
      res.status(401).json({
        status: "fail",
        message: "Unable to create answer",
      });
    }

    return res.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.log(error.message);

    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        console.log(error.errors[key].message);

        if (error.errors[key].message === "Validation len on content failed") {
          req.flash(
            "error",
            "Option's content must contain atleast 3 characters"
          );
        }
      }
    }
    res.redirect(`/questions/${questionId}`);
  }
};

//get all answers for a question
exports.getAllAnswers = async (req, res, next) => {
  const { questionId } = req.body;
  const adminId = req.user.id;
  try {
    const answers = await Answer.getAnswers({ adminId, questionId });
    if (!answers) {
      return next(new AppError("No answers found", 404));
    }
    return answers;
  } catch (error) {
    console.log(error.message);
    res.status(501).json({ status: "fail", message: error.message });
  }
};

/// answers list page
exports.renderAnswersPage = async (request, response) => {
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const elections = await Election.getElections(loggedInUser);
  response.render("answers", {
    title: "Online Voting Platform",
    admin,
    elections,
    csrfToken: request.csrfToken(),
  });
};

//delete answer
exports.deleteAnswer = async (req, res) => {
  const id = req.params.id;
  const adminId = req.user;
  try {
    await Answer.deleteAnswer(id, adminId);
    return res.json(true);
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Can't process you request");
    res.redirect("back");
  }
};
//edit answer
exports.updateAnswer = async (req, res, next) => {
  const { content } = req.body;
  const id = req.params.id;
  try {
    const answer = await Answer.findByPk(id);
    if (!answer) {
      return next(new AppError("No answer found with that id", 404));
    }
    const updatedAnswer = await answer.update({
      content,
    });
    res.json(updatedAnswer);
  } catch (error) {
    console.log(error.message);
    res.json(error.message);
  }
};
//edit answer page
exports.renderUpdateAnsPage = async (request, response, next) => {
  const id = request.params.id;
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const answer = await Answer.findByPk(id);
  if (!answer) {
    return next(new AppError("No answer found with that id", 404));
  }
  const question = await Question.getQuestion(loggedInUser, answer.questionId);

  response.render("editAnswers", {
    title: "Update answer",
    answer,
    admin,
    question,
    csrfToken: request.csrfToken(),
  });
  response.render("result", {
    title: "Update answer",
  });
};
