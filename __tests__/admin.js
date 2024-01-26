/* tests admin related endpoints */
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");

const { extractCsrfToken } = require("../utils/testHandlers");

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
        email: "test1@gmail.com",
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

  test("test for Sign up", async () => {
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);

    res = await agent
      .post("/admins/register")
      .send({
        firstName: "Test",
        lastName: "User",
        email: "test2@gmail.com",
        password: "12345678",
        _csrf: csrfToken,
      })
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(302);
  });
  test("test for Sign In", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    let response = await agent.post("/admins/login").send({
      email: "test1@gmail.com",
      password: "password",
      _csrf: csrfToken,
    });
    // console.log(response);
    expect(response.statusCode).toBe(302);
  });
  test("auth check to access protected route", async () => {
    const res = await request(app)
      .get("/elections")
      .set("Cookie", cookie)
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(200);
  });
  test("Sign out", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    //based on the app logic
    //if u r redirected to / user is logged out
    res = await agent.get("/");
    expect(res.statusCode).toBe(200);
  });
});
