const {
  Election,
  Admin,
  Voter,
  Question,
  Answer,
  Result,
} = require("../models");
const { encode, votingResult } = require("../utils");
const AppError = require("../utils/AppError");
const OpenAI = require("openai");
//get elections
exports.getElections = async (req, res, next) => {
  const loggedInUser = req.user;
  const electionss = await Election.getElections(loggedInUser);
  if (!electionss) {
    return next(new AppError("No elections found for this user", 404));
  }
  if (req.accepts("html")) {
    res.render("elections", {
      electionss,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      electionss,
    });
  }
};

const openai = new OpenAI({
  apiKey: process.env.CHAT_GPT_ENDPOINT,
});

async function askChatGpt(electionTitle) {
  try {
    const systemPrompt =
      "You are an assistant helping a user create voting system." +
      "Given a message, you should understand the election title provided and suggest the user related questions with answers that help in the voting.";
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: electionTitle },
      ],
      model: "gpt-3.5-turbo",
    });
    // console.log(completion.choices[0].message.tool_calls[0].function);
    const questions = [];
    const answers = [];
    const content = completion.choices[0].message.content;
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\d+\./)) {
        const question = lines[i].split("?")[0].trim();
        questions.push(question);

        let answerLine = null;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith("- ")) {
            answerLine = lines[j].split(":")[1]?.trim();
            break;
          }
        }

        if (answerLine) {
          const answerOptions = answerLine
            .split(",")
            .map((option) => option.trim().replace(/\[|\]/g, ""));
          answers.push(answerOptions);
        }
      }
    }
    console.log({ content, questions, answers, lines });
    return completion.choices[0].message;
  } catch (error) {
    console.log("Error connecting to gpt", error);
  }
}
// async function askChatGpt(electionTitle) {
//   try {
//     const systemPrompt = `
//       You are an assistant helping a user create a voting system.
//       Given an election title, you should suggest relevant questions to ask voters.
//     `;

//     const completion = await openai.chat.completions.create({
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: electionTitle },
//       ],
//       tools: [
//         {
//           type: "function",
//           function: {
//             name: "suggestElectionQuestions",
//             description: "Suggest relevant questions for an election",
//             parameters: {
//               type: "object",
//               properties: {
//                 title: {
//                   type: "string",
//                   description: "The title of the election",
//                 },
//                 output: {
//                   type: "string",
//                   description: "Suggested questions for the election",
//                 },
//               },
//             },
//           },
//         },
//       ],
//       tool_choice: {
//         type: "function",
//         function: { name: "suggestElectionQuestions" },
//       },
//       model: "gpt-3.5-turbo",
//     });

//     // const suggestedQuestions = completion.choices[0].message[0].function.output;
//     // console.log(suggestedQuestions);
//     return completion.choices[0].message.tool_calls[0].function;
//   } catch (error) {
//     console.error("Error connecting to OpenAI", error);
//   }
// }
//creates elections
exports.createElection = async (req, res, next) => {
  try {
    const { title, url } = req.body;
    const adminId = req.user;
    const slicedString = url.split(" ").join("");

    const election = await Election.addElection({
      title: title,
      url: slicedString,
      status: "created",
      adminId,
    });
    if (!election) {
      return next(new AppError("Unable to create election", 401));
    }
    const sugesstion = await askChatGpt(title);
    if (sugesstion) {
      console.log({ sugesstion });
    }
    return res.redirect(`/elections/${election.id}`);
  } catch (error) {
    console.log(error.message);
    if (error.name === "SequelizeValidationError") {
      for (var key in error.errors) {
        if (
          error.errors[key].message === "Validation notEmpty on title failed"
        ) {
          req.flash("error", "Title can't be empty");
        }
        if (error.errors[key].message === "Validation notEmpty on url failed") {
          req.flash("error", "Custom string can't be empty");
        }
        if (
          error.errors[key].message ===
          "Elections's custom string must be unique"
        ) {
          req.flash("error", "Elections's custom string must be unique");
        }
      }
    }
    res.redirect("/elections/createElections/new");
  }
};

/* The bellow code is a controller function that is used to launch an election. */
exports.launchElection = async (req, res, next) => {
  const electionId = req.params.id;
  const adminId = req.user;
  let answersWithQuestion = [];
  let error = false;

  try {
    const election = await Election.findOne({
      where: { adminId, id: electionId },
    });
    if (!election) {
      return next(new AppError("No election found with that id", 404));
    }

    /* Checking if the election has atleast one question. */
    const questions = await Question.getQuestions(adminId, electionId);
    if (questions.length < 1) {
      return next(
        new AppError(
          "An election must have atleast 1 question to be launched",
          403
        )
      );
    }
    /* Finding all the answers for each question. */
    for (var i in questions) {
      answersWithQuestion.push(
        await Answer.findAll({
          where: { questionId: questions[i].id },
          include: [
            {
              model: Question,
              required: true,
            },
          ],
        })
      );
    }
    //extract the anwsers from the given data it's in [[{}],[{}]] format
    for (var l = 0; l < answersWithQuestion.length; l++) {
      if (answersWithQuestion[l].length < 2) {
        error = true;
      }
    }
    //todo add flash message
    if (error) {
      console.log(
        "Every question in an election must have atleast two answers"
      );
      return next(
        new AppError(
          "Every question in an election must have atleast two answers",
          403
        )
      );
    }
    const updatedElection = await election.updateElectionStatus("launched");

    if (!updatedElection) {
      console.log("error");
      return next(
        new AppError(
          "Every question in an election must have atleast two answers",
          403
        )
      );
    }
    return res.json(updatedElection);
    // res.send("hi");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};
/* Updating the election status to ended. */
exports.endElection = async (req, res, next) => {
  const electionId = req.params.id;
  const adminId = req.user;
  try {
    const election = await Election.findOne({
      where: { adminId, id: electionId },
    });
    if (!election) {
      return next(new AppError("No election found with that id", 404));
    }
    console.log(election);
    const updatedElection = await election.updateElectionStatus("ended");
    console.log(updatedElection);

    return res.json(updatedElection);
  } catch (error) {
    console.log(error.message);
  }
};

/* Deleting an election. */
exports.deleteElection = async (req, res) => {
  const electionId = req.params.id;
  const adminId = req.user;
  try {
    await Election.deleteElection(electionId, adminId);
    return res.json(true);
  } catch (error) {
    console.log(error.message);
    req.flash("error", "Can't process you request");
  }
};

/* Updating the election title. */
exports.updateElection = async (req, res, next) => {
  const { title } = req.body;
  const id = req.params.id;
  try {
    const election = await Election.findByPk(id);
    if (!election) {
      return next(new AppError("No election found with that id", 404));
    }
    const updatedElection = await election.update({
      title: title,
    });

    res.json(updatedElection);
  } catch (error) {
    console.log(error.message);
    res.json(error.message);
  }
};

/* The bellow code is rendering the elections page. */
exports.renderElectionsPage = async (request, response) => {
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const elections = await Election.getElections(loggedInUser);

  if (request.accepts("html")) {
    response.render("elections", {
      title: "Online Voting Platform",
      admin,
      elections,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      elections,
      admin,
      loggedInUser,
    });
  }
};

//create election page
exports.renderCreateElecPage = async (request, response) => {
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  if (request.accepts("html")) {
    response.render("createElections", {
      title: "Create Elections",
      admin,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({ admin, loggedInUser, csrfToken: request.csrfToken() });
  }
};

//election details page
exports.renderElectionDetailsPage = async (request, response, next) => {
  const loggedInUser = request.user;
  const id = request.params.id;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const election = await Election.getElectionDetails(loggedInUser, id);
  if (!election) {
    return next(new AppError("No election found with that id", 404));
  }
  const questions = await Question.getQuestions(loggedInUser, id);
  const electionId = election.id;
  const urlId = encode(electionId);
  const voters = await Voter.getVoters(electionId);
  let launchError = false;
  let answersWithQuestion = [];
  for (var i in questions) {
    answersWithQuestion.push(
      await Answer.findAll({
        where: { questionId: questions[i].id },
        include: [
          {
            model: Question,
            required: true,
          },
        ],
      })
    );
  }
  //extract the anwsers from the given data it's in [[{}],[{}]] format
  for (var l = 0; l < answersWithQuestion.length; l++) {
    if (answersWithQuestion[l].length < 2) {
      launchError = true;
    }
  }
  request.voterUrl = electionId;
  if (request.accepts("html")) {
    response.render("electionDetailsPage", {
      title: "Election Details",
      admin,
      election,
      questions,
      voters,
      urlId,
      launchError,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      admin,
      election,
      questions,
      voters,
      urlId,
      answersWithQuestion,
      csrfToken: request.csrfToken(),
    });
  }
};

// manage questions page
exports.renderManageQuesPage = async (request, response, next) => {
  const loggedInUser = request.user;
  const id = request.params.id;

  const election = await Election.getElectionDetails(loggedInUser, id);
  if (!election) {
    return next(new AppError("No election found with the given id", 404));
  }
  const admin = await Admin.getAdminDetails(loggedInUser);
  const questions = await Question.getQuestions(loggedInUser, id);

  if (request.accepts("html")) {
    response.render("manageQuestions", {
      title: "Online Voting Platform",
      admin,
      election,
      questions,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      questions,
      election,
      admin,
      csrfToken: request.csrfToken(),
    });
  }
};

//create questions page
exports.renderCreateQuesPage = async (request, response) => {
  const id = request.params.id;
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const election = await Election.getElectionDetails(loggedInUser, id);
  response.render("createQuestions", {
    title: "Create Questions",
    election,
    admin,
    csrfToken: request.csrfToken(),
  });
};
//edit election page
exports.renderUpdateElecPage = async (request, response, next) => {
  const id = request.params.id;
  const loggedInUser = request.user;
  const admin = await Admin.getAdminDetails(loggedInUser);
  const election = await Election.getElectionDetails(loggedInUser, id);
  if (!election) {
    return next(new AppError("No election found with that id", 404));
  }

  if (request.accepts("html")) {
    response.render("editElectionPage", {
      title: "Update Election",
      election,
      admin,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      election,
      admin,
    });
  }
};

//render vote page
exports.renderVotingPage = async (req, res) => {
  const currentVoter = req.user;

  let answersWithQuestion = [];
  let filteredAnswers = [];
  // //u might need to remove the admin id
  const election = await Election.getElectionByCustStr(global.elecIdUrl);
  const questions = await Question.findAll({
    where: { electionId: election.id },
  });

  // include questions table to answers (inner join)
  for (var i in questions) {
    answersWithQuestion.push(
      await Answer.findAll({
        where: { questionId: questions[i].id },
        include: [
          {
            model: Question,
            required: true,
          },
        ],
      })
    );
  }

  //extract the anwsers from the given data it's in [[{}],[{}]] format
  for (var l = 0; l < answersWithQuestion.length; l++) {
    for (var j = 0; j < answersWithQuestion[l].length; j++) {
      var innerValue = answersWithQuestion[l][j];
      filteredAnswers.push(innerValue);
    }
  }

  // //parse the data
  let stringifiedData = JSON.stringify(filteredAnswers);
  let parsedData = JSON.parse(stringifiedData);

  //group by question id
  const groupedByQuestion = parsedData.reduce((accumulate, current) => {
    const questionId = current?.Question?.id;
    const existing = accumulate.findIndex((item) => item.id === questionId);
    // eslint-disable-next-line no-unused-vars
    const { ["Question"]: Question, ...answer } = current; // removes the question from the obj
    if (existing !== -1) {
      accumulate[existing].answers.push(answer);
    } else {
      accumulate.push({ ...current.Question, answers: [answer] });
    }
    return accumulate;
  }, []);
  const parsedResult = await votingResult(election.id);

  const voterCount = await Voter.count({
    where: { electionId: election.id, voterStatus: "voted" },
    distinct: true,
  });

  // //return the result
  if (req.accepts("html")) {
    res.render("vote", {
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
      election,
      currentVoter,
      voterCount,
      parsedResult,
      groupedByQuestion,
      questions,
    });
  } else {
    res.json({
      election,
      currentVoter,
      voterCount,
      parsedResult,
      groupedByQuestion,
      questions,
    });
  }
};
//render result page
exports.previewResults = async (req, res, next) => {
  const electionId = req.params.id;

  //get the vote result
  const parsedResult = await votingResult(electionId);
  //get election
  const admin = req.user;
  const election = await Election.getElectionDetails(admin, electionId);
  if (!election) {
    return next(new AppError("No election found with the given id", 404));
  }
  const questions = await Question.getQuestions(admin, electionId);
  const voterCount = await Voter.count({
    where: { electionId: election.id, voterStatus: "voted" },
    distinct: true,
  });
  console.log({ voterCount });
  if (req.accepts("html")) {
    res.render("previewResult", {
      election,
      questions,
      parsedResult,
      admin,
      voterCount,
      title: "Online Voting Platform",
      csrfToken: req.csrfToken(),
    });
  } else {
    res.send("electionss");
  }
};
exports.saveVotes = async (req, res) => {
  //fetch all data from req.body
  // eslint-disable-next-line no-unused-vars
  const { ["_csrf"]: _csrf, ["electionId"]: electionId, ...rest } = req.body;
  const voter_Id = req.user?.id;
  const voter = await Voter.findByPk(req.user.id);

  //check of voter already voted
  if (voter.status == "voted") {
    return res.json("You have already voted");
  }
  //create results for each submission
  await Promise.all(
    Object.keys(rest).map(async (key) => {
      if (rest[key] == null) {
        console.log("empty");
        req.flash("error", "Select atleast one answer");
        res.redirect("back");
        return;
      }
      await Result.addVotingResult({
        questionId: key,
        answerId: rest[key],
        electionId: electionId,
        voter_Id: voter_Id,
      });
    })
  );
  //update voter status
  await voter.updateVoterStatus("voted");

  res.redirect("back");
};
