const { Answer } = require("../models");

//create elections
exports.createAnswer = async (req, res) => {
  //get adminId from req.user
  //get electionId from req.body
  try {
    const { content, questionId } = req.body;
    const adminId = req.user.id;
    console.log(req.body,adminId)
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

//get all answers for a question
exports.getAllAnswers=async(req,res)=>{
  const {questionId} = req.body
  const adminId = req.user.id
  try {
    const answers = await Answer.getAnswers({adminId,questionId})
    if(!answers){
      res.status(404).json({status:'fail',message:'No answers found'})
    }
 return answers
  } catch (error) {
    console.log(error.message)
    res.status(501).json({status:'fail',message:error.message})

  }
}