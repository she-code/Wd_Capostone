//test signup
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
const cheerio = require("cheerio");
const jwt = require("jsonwebtoken");
const authenticateJwt = require("../middelwares/authenticateJWT");

/* Mocking the authenticateJwt middleware. */
// jest.mock(
//   authenticateJwt,
//   () => (req: Request, res: Response, next: NextFunction) => {
//     req.user = {};
//     return next();
//   }
// );
const createElection = async (agent, title, url) => {
  let res = await agent
    .get("/elections/createElections/new")
    .set("Cookie", cookie)
    .set("Accept", "application/json");

  let adminId = res.body.admin.id;
  const response = await agent
    .post("/elections/createElection")
    .set("Cookie", cookie)
    .send({
      title: title,
      url: url,
      status: "created",
      adminId: adminId,
      _csrf: res.body.csrfToken,
    });
};
let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
// function extractUserId(res){
//   var $ = cheerio.load(res.)
// }

const SECONDS = 1000;
jest.setTimeout(70 * SECONDS);
let userId = null;
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
        email: "test3@gmail.com",
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
    // jwt.verify(cookie, process.env.JWT_SECRET, (err, verifiedJwt) => {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     userId = verifiedJwt.id;
    //     console.log({ userId });
    //     // req.us
    //   }
    // });
  });
  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  // beforeEach(async () => {
  //   //login
  //   let res = await agent.get("/login");
  //   let csrfToken = extractCsrfToken(res);
  //   await agent.post("/admins/login").send({
  //     email: "test3@gmail.com",
  //     password: "password",
  //     _csrf: csrfToken,
  //   }).then((res) => {
  //     const cookies = res.headers["set-cookie"][1]
  //       .split(",")
  //       .map((item) => item.split(";")[0]);
  //     cookie = cookies.join(";");
  //     console.log({ admin: cookie });
  //   });
  // });

  test("test for Sign up", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    res = await agent.post("/admins/register").send({
      firstName: "Test",
      lastName: "User",
      email: "testl@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });

    expect(res.statusCode).toBe(302);
  });
  test("test for Sign In", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    let response = await agent.post("/admins/login").send({
      email: "test3@gmail.com",
      password: "password",
      _csrf: csrfToken,
    });
    // console.log(response);
    expect(response.statusCode).toBe(302);
  });
  test("auth check", async () => {
    // let csrfToken = extractCsrfToken(res);
    // Send a request to the app with the token in the cookies
    const res = await request(app)
      .get("/elections")
      .set("Cookie", cookie)
      .set("Accept", "application/json");
    // console.log(res.body);
    // Check if the request was successful
    expect(res.statusCode).toBe(200);

    // Check if the user's ID was returned in the response
    // expect(res.body.userId).toBe(user.id);
  });
  test("Create elections", async () => {
    let res = await agent
      .get("/elections/createElections/new")
      .set("Cookie", cookie)
      .set("Accept", "application/json");

    let adminId = res.body.admin.id;
    let csrfToken = res.body.csrfToken;
    res = await agent
      .post("/elections/createElection")
      .set("Cookie", cookie)
      .send({
        title: "Class rep",
        url: "class67",
        status: "created",
        adminId: adminId,
        _csrf: csrfToken,
      });

    expect(res.statusCode).toBe(302);
  });

  test("Edit the title of the election with the given Id", async () => {
    const agent = request.agent(server);
    await createElection(agent, "Class 501", "501");
    //go to elections page
    const groupedResponse = await agent
      .get("/elections")
      .set("Cookie", cookie)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedResponse.text);
    const electionsCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

    //got to edit page
    let res = await agent
      .get(`/elections/${latestElection.id}/edit`)
      .set("Cookie", cookie);
    let csrfToken = extractCsrfToken(res);

    const updatedElection = await agent
      .put(`/elections/${latestElection.id}`)
      .set("Cookie", cookie)
      .send({
        title: "Class 302 updated",
        _csrf: csrfToken,
      });
    console.log(updatedElection.text);
    expect(updatedElection.statusCode).toBe(200);
  });
});
test("Create Questions", async () => {
  //   //create election
  const agent = request.agent(server);
  await createElection(agent, "Class 501", "501");
  //go to elections page
  const groupedResponse = await agent
    .get("/elections")
    .set("Cookie", cookie)
    .set("Accept", "application/json");

  //get latest electionId
  const parsedGroupedResponse = JSON.parse(groupedResponse.text);
  const electionsCount = parsedGroupedResponse.elections.length;
  const latestElection = parsedGroupedResponse.elections[electionsCount - 1];

  //gotomanagequestions
  let res = await agent
    .get(`elections/${latestElection.id}/questions`)
    .set("Cookie", cookie)
    .set("Accept", "application/json");
  expect(res.statusCode).toBe(200);
});

//Todo

// test signout
//
/*
Bemhreth, [23-01-2023 00:00]
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Import your app
const app = require('../app');

// Your secret key for signing JWT tokens
const secretKey = 'secret_key';

describe('Authentication', () => {
  test('It should authenticate a user with a valid token', async () => {
    // Create a JWT token for a user
    const user = { id: 1, name: 'John Doe' };
    const token = jwt.sign(user, secretKey);

    // Send a request to the app with the token in the cookies
    const res = await request(app)
      .get('/protected-route')
      .set('Cookie', token=${token});

    // Check if the request was successful
    expect(res.statusCode).toBe(200);

    // Check if the user's ID was returned in the response
    expect(res.body.userId).toBe(user.id);
  });

  test('It should not authenticate a user with an invalid token', async () => {
    // Send a request to the app with an invalid token in the cookies
    const res = await request(app)
      .get('/protected-route')
      .set('Cookie', 'token=invalid_token');

    // Check if the request was denied
    expect(res.statusCode).toBe(401);
  });
});

Bemhreth, [23-01-2023 00:00]
expect(res.req.user).toBe(user.id);*/
