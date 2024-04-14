'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SuggestedAnswers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SuggestedAnswers.init({
    content: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SuggestedAnswers',
  });
  return SuggestedAnswers;
};