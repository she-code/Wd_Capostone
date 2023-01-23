"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here'
      Election.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });
      Election.hasMany(models.Voter, {
        foreignKey: "electionId",
        onDelete: "cascade",
      });
      Election.hasMany(models.Question, {
        foreignKey: "electionId",
        onDelete: "cascade",
      });
      Election.hasMany(models.Result, {
        foreignKey: "electionId",
        onDelete: "cascade",
      });
    }
    static getElections(adminId) {
      return this.findAll({
        where: { adminId },
        order: [["createdAt", "DESC"]],
      });
    }
    static getElectionDetails(adminId, electionId) {
      return this.findOne({
        where: {
          [Op.and]: [{ adminId }, { id: electionId }],
        },
      });
    }
    static getElectionByCustStr(customString) {
      return this.findOne({
        where: {
          url: customString,
        },
      });
    }
    static addElection({ title, url, adminId }) {
      return this.create({
        title: title,
        url: url,
        adminId,
        status: "created",
      });
    }
    updateElectionStatus(status) {
      return this.update({ status: status });
    }
    static async deleteElection(id, adminId) {
      return this.destroy({
        where: {
          id,
          adminId,
        },
      });
    }
    updateElectionTitle(newTitle) {
      return this.update({ title: newTitle });
    }
  }
  Election.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
          len: 2,
        },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
        },
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
          isUnique: (value, next) => {
            Election.findAll({
              where: { url: value },
              attributes: ["id"],
            })
              .then((election) => {
                if (election.length != 0)
                  next(new Error("Elections's custom string must be unique"));
                next();
              })
              .catch((onError) => console.log(onError));
          },
        },
      },
    },
    {
      sequelize,
      modelName: "Election",
    }
  );
  return Election;
};
