"use strict";
const { Model } = require("sequelize");
const crypto = require("crypto");
module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      // define association here
      Admin.hasMany(models.Election, {
        foreignKey: "adminId",
        onDelete: "CASCADE",
      });
      Admin.hasMany(models.Question, {
        foreignKey: "adminId",
        onDelete: "CASCADE",
      });
      Admin.hasMany(models.Answer, {
        foreignKey: "adminId",
        onDelete: "CASCADE",
      });
      Admin.hasMany(models.Voter, {
        foreignKey: "adminId",
        onDelete: "CASCADE",
      });
    }

    static async getAdminDetails(id) {
      return Admin.findByPk(id);
    }
    static async getAllAdmins() {
      return Admin.findAll();
    }
    createPasswordResetToken() {
      const resetToken = crypto.randomBytes(32).toString("hex");
      this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      console.log({ resetToken }, this.passwordResetToken);

      this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;
      return resetToken;
    }
  }
  Admin.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 2,
        },
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          len: 2,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: true,
          isEmail: true,
          isUnique: (value, next) => {
            Admin.findAll({
              where: { email: value },
              attributes: ["id"],
            })
              .then((user) => {
                if (user.length != 0)
                  next(new Error("Email address already in use!"));
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
          len: 8,
        },
      },
      passwordChangedAt: DataTypes.DATE,
      passwordResetToken: DataTypes.STRING,
      PasswordResetExpires: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Admin",
    }
  );
  return Admin;
};
