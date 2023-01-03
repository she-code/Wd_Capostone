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
    }
    static addVoter({ voter_Id, password, electionId }) {
      return this.create({
        voter_Id,
        password,
        electionId,
      });
    }
    static getVoters(electionId) {
      return this.findAll({ where: { electionId } });
    }
  }
  Voter.init(
    {
      voter_Id: DataTypes.STRING,
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Voter",
    }
  );
  return Voter;
};
