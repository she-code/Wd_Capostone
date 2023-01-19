"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Results", "voter_Id", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Results", {
      fields: ["voter_Id"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "Voters",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Results", "voter_Id");
  },
};
