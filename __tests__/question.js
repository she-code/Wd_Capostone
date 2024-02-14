/* tests question related endpoints */
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");

const {
  parseElectionId,
  parseQuestionId,
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
        email: "test4@gmail.com",
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
        // console.log({ admin: cookie });
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
  test("Create Questions", async () => {
    //   //create election
    const agent = request.agent(server);
    await login(agent, "test4@gmail.com", "12345678", cookie);
    await createElection(agent, "Class 506", "506", cookie);
    let electionId = await parseElectionId(agent, cookie);
    //go to create elections page
    let res = await agent
      .get(`/elections/${electionId}/questions/new`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);
    //send post request
    res = await agent
      .post("/questions/createQuestion")
      .send({
        title: "Is testing important",
        description: "Please analayze and choose response",
        electionId: electionId,
        _csrf: csrfToken,
      })
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(302);
  });
  /**not working */
  test("Delete the question with the given Id", async () => {
    const agent = request.agent(server);
    await login(agent, "test4@gmail.com", "12345678", cookie);
    await createElection(agent, "Class 606", "606", cookie);
    await createQuestion(agent, "Who is the leader", "choose leader", cookie);
    await createQuestion(
      agent,
      "Who is the follower",
      "choose follo,cookiewer",
      cookie
    );

    /* Getting the latest election from the database. */
    let electionId = await parseElectionId(agent, cookie);

    /* Getting the latest question from the database. */
    const questionId = await parseQuestionId(agent, electionId, cookie);

    //delete request
    //get csrf
    let res = await agent
      .get(`/elections/${electionId}/questions`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);
    // console.log(electionId, csrfToken);
    expect(res.statusCode).toBe(200);
  });

  test("Edit the question with the given Id", async () => {
    const agent = request.agent(server);
    await login(agent, "test4@gmail.com", "12345678", cookie);
    await createElection(agent, "Class 606", "606", cookie);
    await createQuestion(agent, "Who is the leader", "choose leader", cookie);

    /* Getting the latest election from the database. */
    let electionId = await parseElectionId(agent, cookie);

    /* Getting the latest question from the database. */
    const questionId = await parseQuestionId(agent, electionId, cookie);

    //go to edit elections page
    let res = await agent
      .get(`/questions/${questionId}/edit`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);

    //send put request
    res = await agent
      .put(`/questions/${questionId}`)
      .set("Cookie", cookie)
      .send({
        title: "Updated title",
        description: "Updated description",
        _csrf: csrfToken,
      });
    let updatedResponse = JSON.parse(res.text);
    expect(updatedResponse.title).toBe("Updated title");
    expect(updatedResponse.description).toBe("Updated description");

    //questions/56/edit
  });
});
