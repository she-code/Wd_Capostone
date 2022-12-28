"use strict";
const { Model,Op } = require("sequelize");
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
    }
    static getElections(adminId) {
      return this.findAll({ where: { adminId } });
    }
    static getElectionDetails(adminId, electionId) {
      return this.findOne({
        where: {
          [Op.and]: [{ adminId }, { id: electionId }],
        },
      });
    }
    static addElection({ title, adminId }) {
      return this.create({
        title: title,
        adminId,
        status: "created",
      });
    }
  }
  Election.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
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
      },
    },
    {
      sequelize,
      modelName: "Election",
    }
  );
  return Election;
};
