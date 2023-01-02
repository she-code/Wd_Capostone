"use strict";
const { Model, Op } = require("sequelize");
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
      // Answer.belongsTo(models.Election, {
      //   foreignKey: "electionId",
      // });
    }
    static addAnswers({adminId, content, questionId}) {
      return this.create({
        adminId,
        content,
  questionId,
      });
    }
    static getAnswers({adminId,questionId
    }){
      return this.findAll({
        where:{
          [Op.and]:[
            {questionId},
            {adminId}
          ]
        }
      })
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
