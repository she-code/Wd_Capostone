"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
      Voter.belongsTo(models.Election, {
        foreignKey: "electionId",
      });
      Voter.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });
      Voter.hasOne(models.Result, {
        foreignKey: "voter_Id",
      });
    }
    static addVoter({ voter_Id, password, electionId, adminId }) {
      return this.create({
        voter_Id,
        password,
        electionId,
        adminId,
      });
    }
    static getVoters(electionId) {
      return this.findAll({ where: { electionId } });
    }
    updateVoterStatus(status) {
      return this.update({ voterStatus: status });
    }
    static async deleteVoter(id, adminId) {
      return this.destroy({
        where: {
          id,
          adminId,
        },
      });
    }
  }
  Voter.init(
    {
      voter_Id: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
          isUnique: (value, next) => {
            Voter.findAll({
              where: { voter_Id: value },
              attributes: ["id"],
            })
              .then((user) => {
                if (user.length != 0)
                  next(new Error("Voter Id must be unique"));
                next();
              })
              .catch((onError) => console.log(onError));
          },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true,
        },
      },
      userType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "voter",
      },
      voterStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "created",
      },
    },

    {
      sequelize,
      modelName: "Voter",
    }
  );
  return Voter;
};
