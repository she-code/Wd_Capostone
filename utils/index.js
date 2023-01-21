const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Buffer } = require("buffer");
const { Answer, Question, Result } = require("../models");
const { fn, col } = require("sequelize");
exports.generateHashedPassword = async (cleanPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(cleanPassword, salt);
  return hashedPassword;
};

exports.generateJwtToken = (userId, userType, expiresIn = "0.5y") => {
  const token = jwt.sign(
    { id: userId, userType: userType },
    process.env.JWT_SECRET,
    {
      expiresIn,
    }
  );
  return token;
};

exports.decode = (base64data) => {
  const buff = Buffer.from(base64data, "base64");
  const decoded = buff.toString("ascii");
  return decoded.replace("votingcom", "");
};

exports.encode = (data) => {
  const addUrl = data + "votingcom";
  const buff = Buffer.from(addUrl);
  const base64data = buff.toString("base64");
  return base64data;
};

exports.votingResult = async (electionId) => {
  //  const electionId = req.params.id;
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

  const stringifiedData = JSON.stringify(result);
  const parsedResult = JSON.parse(stringifiedData);
  parsedResult.forEach((element) => {
    labels.push(element.Answer.content);
    votes.push(element.votes);
  });
  return parsedResult;
};
