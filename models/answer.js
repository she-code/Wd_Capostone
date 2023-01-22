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
      Answer.hasMany(models.Result, {
        foreignKey: "answerId",
        onDelete: "CASCADE",
      });
    }
    static addAnswers({ adminId, content, questionId }) {
      return this.create({
        adminId,
        content,
        questionId,
      });
    }
    static getAnswer({ adminId, id }) {
      return this.findOne({
        where: {
          [Op.and]: [{ adminId: adminId }, { id: id }],
        },
      });
    }
    static getAnswers({ adminId, questionId }) {
      return this.findAll({
        where: {
          [Op.and]: [{ questionId }, { adminId }],
        },
        order: [["createdAt", "DESC"]],
      });
    }
    static getAnsWithQuestion(questionId) {
      return this.findAll({
        include: [
          {
            model: Question,
            required: true,
          },
        ],
        where: {
          questionId,
        },
      });
    }
    updateAnswerContent(content) {
      return this.update(content);
    }
    static async deleteAnswer(id, adminId) {
      return this.destroy({
        where: {
          id,
          adminId,
        },
      });
    }
  }
  Answer.init(
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 2,
        },
      },
    },
    {
      sequelize,
      modelName: "Answer",
    }
  );
  return Answer;
};
