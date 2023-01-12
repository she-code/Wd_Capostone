const { Question } = require("../models");

//create elections
exports.createQuestion = async (req, res) => {
  //get adminId from req.user
  //get electionId from req.params
  try {
    const { title, description, electionId } = req.body;
    const adminId = req.user.id;
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

    console.log(question);
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
    res.redirect("/elections/2/questions/new");
  }
};
