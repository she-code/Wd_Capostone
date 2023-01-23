const cheerio = require("cheerio");
exports.parseElectionId = async (agent, cookie) => {
  const groupedResponse = await agent
    .get("/elections")
    .set("Cookie", cookie)
    .set("Accept", "application/json");

  const parsedGroupedResponse = JSON.parse(groupedResponse.text);
  const electionsCount = parsedGroupedResponse.elections.length;
  const latestElection = parsedGroupedResponse.elections[electionsCount - 1];
  const electionId = latestElection.id;
  return electionId;
};
exports.parseQuestionId = async (agent, electionId, cookie) => {
  const groupedQusResponse = await agent
    .get(`/elections/${electionId}/questions`)
    .set("Cookie", cookie)
    .set("Accept", "application/json");
  const parsedQuesGroupedResponse = JSON.parse(groupedQusResponse.text);
  const questionsCount = parsedQuesGroupedResponse.questions.length;
  const latestQuestion =
    parsedQuesGroupedResponse.questions[questionsCount - 1];
  const questionId = latestQuestion.id;
  return questionId;
};
exports.parseAnswerId = async (agent, questionId, cookie) => {
  const groupedAnsResponse = await agent
    .get(`/questions/${questionId}`)
    .set("Cookie", cookie)
    .set("Accept", "application/json");
  const parsedAnswerGroupedResponse = JSON.parse(groupedAnsResponse.text);
  const AnswerCount = parsedAnswerGroupedResponse.answers.length;
  const latestAnswer = parsedAnswerGroupedResponse.answers[AnswerCount - 1];
  const answerId = latestAnswer.id;
  return answerId;
};
exports.createAnswers = async (agent, content, cookie) => {
  let electionId = await this.parseElectionId(agent, cookie);
  /* Getting the latest question from the database. */
  const questionId = await this.parseQuestionId(agent, electionId, cookie);
  // go to questionDetails page
  let res = await agent.get(`/questions/${questionId}`).set("Cookie", cookie);
  const csrfToken = this.extractCsrfToken(res);

  res = await agent
    .post("/answers/createAnswers")
    .send({
      content: content,
      questionId: questionId,
      _csrf: csrfToken,
    })
    .set("Cookie", cookie);
};
exports.extractCsrfToken = (res) => {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
};
exports.login = async (agent, email, password, cookie) => {
  let res = await agent.get("/login");
  let csrfToken = this.extractCsrfToken(res);
  res = await agent
    .post("/admins/login")
    .send({
      email: email,
      password: password,
      _csrf: csrfToken,
    })
    .set("Cookie", cookie);
};
exports.createElection = async (agent, title, url, cookie) => {
  let res = await agent
    .get("/elections/createElections/new")
    .set("Cookie", cookie);
  let csrfToken = this.extractCsrfToken(res);
  res = await agent
    .post("/elections/createElection")
    .set("Cookie", cookie)
    .send({
      title: title,
      url: url,
      status: "created",
      _csrf: csrfToken,
    });
};
exports.createQuestion = async (agent, title, description, cookie) => {
  let electionId = await this.parseElectionId(agent, cookie);
  //go to create questions page
  let res = await agent
    .get(`/elections/${electionId}/questions/new`)
    .set("Cookie", cookie);
  let csrfToken = this.extractCsrfToken(res);

  //send post request
  res = await agent
    .post("/questions/createQuestion")
    .send({
      title: title,
      description: description,
      electionId: electionId,
      _csrf: csrfToken,
    })
    .set("Cookie", cookie);
};
