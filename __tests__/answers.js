/* tests elections related endpoints */
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");

const {
  parseAnswerId,
  parseElectionId,
  parseQuestionId,
  createAnswers,
  extractCsrfToken,
  createElection,
  createQuestion,
  login,
} = require("../utils/testHandlers");

let server, agent;
const SECONDS = 1000;
jest.setTimeout(70 * SECONDS);
let cookie;

describe("Online Voting Platform", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    await agent
      .post("/admins/register")
      .type("form")
      .send({
        email: "test5@gmail.com",
        password: "password",
        firstName: "Test",
        lastName: "Haile",
        _csrf: csrfToken,
      })
      .then((res) => {
        const cookies = res.headers["set-cookie"][1]
          .split(",")
          .map((item) => item.split(";")[0]);
        cookie = cookies.join(";");
        console.log({ admin: cookie });
      });
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Create Answers", async () => {
    const agent = request.agent(server);
    await login(agent, "test5@gmail.com", "password", cookie);
    await createElection(agent, "Class 601", "601", cookie);
    await createQuestion(agent, "Who is the leader", "choose leader", cookie);

    /* Getting the latest election from the database. */
    let electionId = await parseElectionId(agent, cookie);

    /* Getting the latest question from the database. */
    const questionId = await parseQuestionId(agent, electionId, cookie);

    // go to questionDetails page
    let res = await agent.get(`/questions/${questionId}`).set("Cookie", cookie);
    const csrfToken = extractCsrfToken(res);
    res = await agent
      .post("/answers/createAnswers")
      .send({
        content: "Yes",
        questionId: questionId,
        _csrf: csrfToken,
      })
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(302);
  });
  test("Edit the answer with the given Id", async () => {
    const agent = request.agent(server);
    await login(agent, "test5@gmail.com", "12345678", cookie);
    await createElection(agent, "Class 606", "606", cookie);
    await createQuestion(agent, "Who is the leader", "choose leader", cookie);
    await createAnswers(agent, "content", cookie);
    /* Getting the latest election from the database. */
    let electionId = await parseElectionId(agent, cookie);

    /* Getting the latest question from the database. */
    const questionId = await parseQuestionId(agent, electionId, cookie);

    const answerId = await parseAnswerId(agent, questionId, cookie);

    //go to edit elections page questions/editAnswer/81
    let res = await agent
      .get(`/questions/editAnswer/${answerId}`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);

    //send put request
    res = await agent.put(`/answers/${answerId}`).set("Cookie", cookie).send({
      content: "Updated Answer",
      _csrf: csrfToken,
    });
    let updatedResponse = JSON.parse(res.text);
    expect(updatedResponse.content).toBe("Updated Answer");

    //questions/56/edit
  });

  test("Delete the answer with the given Id", async () => {
    const agent = request.agent(server);
    await login(agent, "test5@gmail.com", "12345678", cookie);
    await createElection(agent, "Class 606", "606", cookie);
    await createQuestion(agent, "Who is the leader", "choose leader", cookie);
    await createAnswers(agent, "content", cookie);
    /* Getting the latest election from the database. */
    let electionId = await parseElectionId(agent, cookie);

    /* Getting the latest question from the database. */
    const questionId = await parseQuestionId(agent, electionId, cookie);

    const answerId = await parseAnswerId(agent, questionId, cookie);

    let res = await agent.get(`/questions/${questionId}`).set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);
    //send delete request
    res = await agent
      .delete(`/answers/${answerId}`)
      .set("Cookie", cookie)
      .send({
        _csrf: csrfToken,
      });
    const deletedResponse = JSON.parse(res.text);
    expect(deletedResponse).toBe(true);
  });
});
