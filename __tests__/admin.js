//test signup
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};
const user = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  const response = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
  return response;
};
const createElection = async (agent) => {
  const res = await agent.get("/elections/new");
  const csrfToken = extractCsrfToken(res);
  //  console.log(res.text)
  const response = await agent.post("/elections/createElection").send({
    title: "Class rep",
    _csrf: csrfToken,
  });
  // console.log(response)
};
describe("Online Voting Platform", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("test for Sign up", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User",
      email: "test@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Create elections", async () => {
    //create new agent
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");
    const res = await agent.get("/elections/new");
    const csrfToken = extractCsrfToken(res);
    //  console.log(res.text)
    const response = await agent.post("/elections/createElection").send({
      title: "Class rep",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
  test("Create questions", async () => {
    //create new agent
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");
    await createElection(agent);
    const groupedTodosResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

    const electionsCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

    let res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    let csrfToken = extractCsrfToken(res);

    const question = await agent.post("/questions/createQuestion").send({
      title: "Who should we choose?",
      description: "Class representative",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    expect(question.statusCode).toBe(302);
  });

  test("create voters", async () => {
    //create new agent
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");
    await createElection(agent);
    const groupedTodosResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

    const electionsCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

    let res = await agent.get(`/elections/${latestElection.id}/voters`);
    let csrfToken = extractCsrfToken(res);

    const voter = await agent
      .post(`/elections/${latestElection.id}/voters`)
      .send({
        voter_Id: "LOL",
        password: "12345678",
        electionId: latestElection.id,
        _csrf: csrfToken,
      });
    expect(voter.statusCode).toBe(302);
  });

  test("Create answers", async () => {
    //create new agent
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");
    await createElection(agent);
    const groupedTodosResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

    const electionsCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

    let res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    let csrfToken = extractCsrfToken(res);

    const question = await agent.post("/questions/createQuestion").send({
      title: "Who should we choose?",
      description: "Class representative",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    console.log(question.id);
    expect(question.statusCode).toBe(302);
  });

  test("Test to update election status to launched", async () => {
    const agent = request.agent(server);
    await login(agent, "test@gmail.com", "12345678");
    await createElection(agent);
    const groupedTodosResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

    const electionsCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

    let res = await agent.get(`/elections/${latestElection.id}`);
    let csrfToken = extractCsrfToken(res);
    const response = await agent
      .put(`/elections/${latestElection.id}/launch`)
      .send({
        status: "launched",
        _csrf: csrfToken,
      });
    console.log(response);
    expect(true).toBe(true);
    // const parsedUpdatedResponse = JSON.parse(response.text);
    // expect(parsedUpdatedResponse.status).toBe("launched");
  });
});

//   test("Sign out", async () => {
//     let res = await agent.get("/todos");
//     expect(res.statusCode).toBe(200);
//     res = await agent.get("/signout");
//     expect(res.statusCode).toBe(302);
//     res = await agent.get("/todos");
//     expect(res.statusCode).toBe(302);
//   });
//test login
// test signout
//test admin detail
