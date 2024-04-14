"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SuggestedAnswers", "suggestedQueId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("SuggestedAnswers", {
      fields: ["suggestedQueId"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "suggestedQuestions",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SuggestedAnswers", "suggestedQueId");
  },
};
