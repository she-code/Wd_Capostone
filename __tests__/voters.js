/* tests voter related endpoints */
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");

const {
  parseElectionId,
  extractCsrfToken,
  createElection,
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
  /* Adding a voter to the database. */
  //create voter
  test("Add Voters", async () => {
    await login(agent, "test5@gmail.com", "12345678", cookie);
    await createElection(agent, "Election voter", "voter", cookie);
    //parse election id
    let electionId = await parseElectionId(agent, cookie);

    //go to manage voters page /elections/55/voters
    let res = await agent
      .get(`/elections/${electionId}/voters`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);
    //add voter
    res = await agent
      .post(`/elections/${electionId}/voters`)
      .set("Cookie", cookie)
      .send({
        electionId: electionId,
        voter_Id: "Frehiwot",
        password: "12345678",
        _csrf: csrfToken,
      });

    expect(res.statusCode).toBe(302);
  });

  /* A test case for deleting a voter. */
  test("Delete Voter", async () => {
    await login(agent, "test5@gmail.com", "12345678", cookie);
    await createElection(agent, "Election voter", "voter", cookie);
    //parse election id
    let electionId = await parseElectionId(agent, cookie);

    //go to manage voters page /elections/55/voters
    let res = await agent
      .get(`/elections/${electionId}/voters`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);
    //add voter
    res = await agent
      .post(`/elections/${electionId}/voters`)
      .set("Cookie", cookie)
      .send({
        electionId: electionId,
        voter_Id: "Haile",
        password: "12345678",
        _csrf: csrfToken,
      });
    const groupedVotersResponse = await agent
      .get(`/elections/${electionId}/voters`)
      .set("Cookie", cookie)
      .set("Accept", "application/json");
    const parsedVoterGroupedResponse = JSON.parse(groupedVotersResponse.text);
    const VoterCount = parsedVoterGroupedResponse.voters.length;
    const latestVoter = parsedVoterGroupedResponse.voters[VoterCount - 1];

    //send delete request
    res = await agent
      .get(`/elections/${electionId}/voters`)
      .set("Cookie", cookie);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .delete(`/voters/${latestVoter.id}`)
      .set("Cookie", cookie)
      .send({
        _csrf: csrfToken,
      });
    let deletedResponse = JSON.parse(res.text);
    expect(deletedResponse).toBe(true);
  });
});
