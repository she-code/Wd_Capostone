'use strict';
const {
  Model,Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    
    }
    static addQuestion({ title, description,adminId,electionId }) {
      return this.create({
        title: title,
        adminId,
        description,
        electionId
      });
    }
    static getQuestions(adminId,electionId){
        return this.findAll({
          where:{
            [Op.and]:[
              {adminId},
              {electionId}
            ]
          }

        })
    }
  }
  Question.init({
    title: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};