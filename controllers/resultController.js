const { fn, col, Op } = require("sequelize");
const { Result, Answer, Question } = require("../models");
// exports.previewResult = async (req, res) => {
//   const electionId = 32;
//   const result = await Result.findAll({
//     attributes: ["questionId", [fn("COUNT", col("voter_Id")), "votes"]],
//     group: ["questionId"],
//   });
exports.previewResult = async (req, res) => {
  const electionId = 31;
  const { questionId } = req.body;
  const result = await Result.findAll({
    // where: { [Op.and]: [{ electionId }, { questionId }] },
    where: { electionId },
    include: [
      {
        model: Answer,
        required: true,
        attributes: ["content", "id"],
      },
      {
        model: Question,
        required: true,
        attributes: ["title", "description", "id", "electionId"],
      },
    ],
    attributes: [
      "answerId",
      "Result.questionId",
      "Result.electionId",
      "Answer.id",
      "Question.id",
      [fn("COUNT", col("voter_Id")), "votes"],
    ],
    group: [
      "answerId",
      "Result.questionId",
      "Result.electionId",
      "Question.id",
      "Answer.id",
    ],
  });

  const colors = [
    "color1",
    "color2",
    "color3",
    "color4",
    "color1",
    "color2",
    "color3",
    "color4",
  ];
  const swatchLength = colors.length - 1;
  const input = result.reduce(
    (accumulator, current) => {
      const selectedColor = Math.floor(Math.random() * (swatchLength - 0) + 0);

      accumulator?.datasets?.[0]?.data.push(current?.votes);
      return {
        ...accumulator,
        labels: [...accumulator.labels, current?.Answer?.content],
        datasets: [
          {
            ...accumulator?.datasets?.[0],
            label: current?.Question?.title,
            backgroundColor: [
              // eslint-disable-next-line no-unsafe-optional-chaining
              ...accumulator?.datasets?.[0].backgroundColor,
              colors[selectedColor],
            ],
          },
        ],
      };
    },
    {
      labels: [],
      datasets: [{ data: [], backgroundColor: [], hoveroffset: 4 }],
    }
  );
  // const groupByAnswer = result.reduce((accumulate, current) => {
  //   const answerId = current?.answerId;
  //   const existing = accumulate.findIndex((item) => item.id === answerId);
  //   // eslint-disable-next-line no-unused-vars
  //   const { ...result } = current; // removes the question from the obj
  //   if (existing !== -1) {
  //     accumulate[existing].answers.push(result);
  //   } else {
  //     accumulate.push({ ...current.answerId, answers: [result] });
  //   }
  //   return accumulate;
  // }, []);
  // //console.log(groupByAnswer);
  // groupByAnswer.forEach((element) => {
  //   console.log(element.answers);
  // });

  // input.datasets.forEach(function (item, index) {
  //   console.log(item, index);
  // });
  const strR = JSON.stringify(result);
  const parR = JSON.parse(strR);
  parR.forEach((element) => {
    console.log(element.Question.id);
  });
  // console.log(parR);
  res.json(result);
};
exports.deleteResult = async (req, res) => {
  // const result = await
  const id = req.params.id;
  const result = await Result.findByPk(id);
  await result.destroy();
  // await Result.destroy({ where: { electionId: 25 } });
  res.send(true);
};
