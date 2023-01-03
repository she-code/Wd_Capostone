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
    res.status(501).json({
      status: "fail",
      message: error.message,
    });
  }
};
