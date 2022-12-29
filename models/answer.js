"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Answer extends Model {
    static associate(models) {
      // define association here
      Answer.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });
      Answer.belongsTo(models.Question, {
        foreignKey: "questionId",
      });
      Answer.belongsTo(models.Election, {
        foreignKey: "electionId",
      });
    }
    static addAnswers(adminId, content,electionId, questionId) {
      return this.create({
        adminId:adminId,
        content:content,
        electionId:electionId,
        questionId:questionId,
      });
    }
  }
  Answer.init(
    {
      content: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Answer",
    }
  );
  return Answer;
};
