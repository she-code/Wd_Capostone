"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Admins", "passwordChangedAt", {
      type: Sequelize.DataTypes.DATE,
    });
    await queryInterface.addColumn("Admins", "passwordResetToken", {
      type: Sequelize.DataTypes.STRING,
    });
    await queryInterface.addColumn("Admins", "PasswordResetExpires", {
      type: Sequelize.DataTypes.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Admins", "passwordChangedAt");
    await queryInterface.removeColumn("Admins", "passwordResetToken");
    await queryInterface.removeColumn("Admins", "PasswordResetExpires");
  },
};
