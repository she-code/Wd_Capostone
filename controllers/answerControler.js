const { Answer } = require("../models");

//create elections
exports.createAnswer = async (req, res) => {
  //get adminId from req.user
  //get electionId from req.params
  try {
    const { content, questionId } = req.body;
    const adminId = req.user.id;
    console.log(req.body,adminId)
    const answer = await Answer.addAnswers({
      adminId,
      content,
     electionId:1,
      questionId,
    });

    if (!answer) {
      res.status(401).json({
        status: "fail",
        message: "Unable to create answer",
      });
    }

    console.log(answer);
    return res.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.log(error);
    res.status(501).json({
      status: "fail",
      message: error.message,
    });
  }
};
