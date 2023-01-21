//test signup
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");
const authenticateJWT = require("../middelwares/authenticateJWT");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/admins/login").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
  console.log(res.text);
};
// eslint-disable-next-line no-unused-vars
const user = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  const response = await agent.post("/admins/login").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
  return response;
};
const createElection = async (agent, title, url) => {
  const res = await agent.get("/elections/createElections/new");
  const csrfToken = extractCsrfToken(res);
  // eslint-disable-next-line no-unused-vars
  const response = await agent.post("/elections/createElection").send({
    title: title,
    url: url,
    _csrf: csrfToken,
  });
  // console.log(response)
};
const SECONDS = 1000;
jest.setTimeout(70 * SECONDS);

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

  // test("test for Sign up", async () => {
  //   let res = await agent.get("/signup");
  //   let csrfToken = extractCsrfToken(res);

  //   res = await agent.post("/admins/register").send({
  //     firstName: "Test",
  //     lastName: "User",
  //     email: "test@gmail.com",
  //     password: "12345678",
  //     _csrf: csrfToken,
  //   });
  //   expect(res.statusCode).toBe(302);
  // });

  test("Create elections", async () => {
    //create new agent
    // const agent = request.agent(server);
    // await login(agent, "test@gmail.com", "12345678");
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/admins/register").type("form").send({
      email: "test@gmail.com",
      password: "password",
      firstName: "Test",
      lastName: "Haile",
      _csrf: csrfToken,
    });
    res = await agent.get("/elections/createElections/new");
    csrfToken = extractCsrfToken(res);
    console.log(res.text);
    const response = await agent
      .post("/elections/createElection")
      .type("form")
      .send({
        title: "Class rep",
        url: "class202",
        adminId: 1,
        _csrf: csrfToken,
      });
    console.log({ text: res.text });
    expect(response.statusCode).toBe(302);
  });

  // test("Create questions", async () => {
  //   //create new agent
  //   const agent = request.agent(server);
  //   await login(agent, "test@gmail.com", "12345678");
  //   // await createElection(agent);
  //   let res = await agent.get("/elections/createElections/new");
  //   let csrfToken = extractCsrfToken(res);
  //   await agent.post("/elections/createElection").send({
  //     title: "Class rep",
  //     url: "class22",
  //     _csrf: csrfToken,
  //   });
  //   const groupedTodosResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

  //   const electionsCount = parsedGroupedResponse.elections.length;
  //   const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

  //   res = await agent.get(`/elections/${latestElection.id}/questions/new`);
  //   csrfToken = extractCsrfToken(res);

  //   const question = await agent.post("/questions/createQuestion").send({
  //     title: "Who should we choose?",
  //     description: "Class representative",
  //     electionId: latestElection.id,
  //     _csrf: csrfToken,
  //   });
  //   expect(question.statusCode).toBe(302);
  // });

  // test("create voters", async () => {
  //   //create new agent
  //   const agent = request.agent(server);
  //   await login(agent, "test@gmail.com", "12345678");
  //   await createElection(agent, "class 301", "301");
  //   const groupedTodosResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

  //   const electionsCount = parsedGroupedResponse.elections.length;
  //   const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

  //   let res = await agent.get(`/elections/${latestElection.id}/voters`);
  //   let csrfToken = extractCsrfToken(res);

  //   const voter = await agent
  //     .post(`/elections/${latestElection.id}/voters`)
  //     .send({
  //       voter_Id: "LOL",
  //       password: "12345678",
  //       electionId: latestElection.id,
  //       _csrf: csrfToken,
  //     });
  //   expect(voter.statusCode).toBe(302);
  // });

  // test("Create answers", async () => {
  //   //create new agent
  //   const agent = request.agent(server);
  //   await login(agent, "test@gmail.com", "12345678");
  //   await createElection(agent, "class 303", "303");
  //   const groupedTodosResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

  //   const electionsCount = parsedGroupedResponse.elections.length;
  //   const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

  //   let res = await agent.get(`/elections/${latestElection.id}/questions/new`);
  //   let csrfToken = extractCsrfToken(res);

  //   const question = await agent.post("/questions/createQuestion").send({
  //     title: "Who should we choose?",
  //     description: "Class representative",
  //     electionId: latestElection.id,
  //     _csrf: csrfToken,
  //   });
  //   console.log(question.id);
  //   expect(question.statusCode).toBe(302);
  // });
  // will be updated
  // test("Test to update election status to launched", async () => {
  //   const agent = request.agent(server);
  //   await login(agent, "test@gmail.com", "12345678");
  //   await createElection(agent);
  //   const groupedTodosResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

  //   const electionsCount = parsedGroupedResponse.elections.length;
  //   const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

  //   let res = await agent.get(`/elections`);
  //   let csrfToken = extractCsrfToken(res);
  //   // eslint-disable-next-line no-unused-vars
  //   const response = await agent
  //     .put(`/elections/${latestElection.id}/launch`)
  //     .send({
  //       status: "launched",
  //       _csrf: csrfToken,
  //     });
  //   expect(response.statusCode).toBe(302);
  //   // const parsedUpdatedResponse = JSON.parse(response.text);
  //   // expect(parsedUpdatedResponse.status).toBe("launched");
  // });

  // todo csruf problem
  // test("Update an election based on given Id", async () => {
  //   const agent = request.agent(server);
  //   await login(agent, "test@gmail.com", "12345678");
  //   await createElection(agent, "class 304", "304");
  //   const groupedTodosResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

  //   const electionsCount = parsedGroupedResponse.elections.length;
  //   const latestElection = parsedGroupedResponse.elections[electionsCount - 1];
  //   let res = await agent.get("/elections");
  //   let csrfToken = extractCsrfToken(res);

  //   const response = await agent
  //     .put(`/elections/${latestElection.id}`)
  //     .send({ title: "Updated title", _csrf: csrfToken });
  //   // console.log(response.text);
  //   expect(true).toBe(true);
  // });

  // // todo csruf problem
  // test("Delete an election of a given Id", async () => {
  //   const agent = request.agent(server);
  //   await login(agent, "test@gmail.com", "12345678");
  //   await createElection(agent, "class 305", "305");
  //   const groupedTodosResponse = await agent
  //     .get("/elections")
  //     .set("Accept", "application/json");
  //   const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

  //   const electionsCount = parsedGroupedResponse.elections.length;
  //   const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

  //   let res = await agent.get("/elections");
  //   let csrfToken = extractCsrfToken(res);

  //   // const deletedResponse = await agent
  //   //   .delete(`/elections/${latestElection.id}`)
  //   //   .send({ _csrf: csrfToken });

  //   //   const parsedDeletedREsponse = JSON.parse(deletedResponse.text);

  //   expect(true).toBe(true);
  // });
  // test("Sign out", async () => {
  //   let res = await agent.get("/elections");
  //   expect(res.statusCode).toBe(200);
  //   res = await agent.get("/signout");
  //   expect(res.statusCode).toBe(302);
  //   //the user can't access after signout
  //   //todo display the error in a wiser way
  //   res = await agent.get("/elections");
  //   expect(res.statusCode).toBe(302);
  // });
});

//Todo

// test signout
//
