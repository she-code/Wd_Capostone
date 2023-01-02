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
  return response
};
const createElection = async(agent)=>{
  // //  console.log(res.text)
  // const res = await agent.get("/elections").set("Accept", "application/json");;
  // const csrfToken = extractCsrfToken(res);
  // const response = await agent.post("/elections/createElection").send({
  //   title: "Class rep",
  //   _csrf: csrfToken,
  // });
  // console.log(response)
  //create new agent
 
  await login(agent, "test@gmail.com", "12345678");
  const res = await agent.get("/elections/new");
  const csrfToken = extractCsrfToken(res);
  //  console.log(res.text)
  const response = await agent.post("/elections/createElection").send({
    title: "Class rep",
    _csrf: csrfToken,
  });
  console.log(response)
  return response
}
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


test("Create elections",async()=>{
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
})
})

// test("Create questions",async()=>{
//   //create new agent

// const agent = request.agent(server);
// await login(agent, "test@gmail.com", "12345678");
// let res = await agent.get("/elections/new");
// let csrfToken = extractCsrfToken(res);
// //  console.log(res.text)
// const response = await agent.post("/elections/createElection").send({
//   title: "Class rep",
//   _csrf: csrfToken,
// });
// console.log(response.text)
// const election = JSON.parse(response.text)
// res= await agent.get(`/elections/${election.id}/questions/new`)
// csrfToken = extractCsrfToken(res);

// const question = await agent.post("/questions/createQuestion").send({
//   title: "Who should we choose?",
//   description:"Class representative",
// electionId:election.id,
//   _csrf: csrfToken,
// });
// console.log(question)
//   expect(question.statusCode).toBe(302);
  
// })


// TODO fix sign in test
  // test("Sign In", async () => {
  // let csrfToken = extractCsrfToken(res);
  // let res = await agent.get("/signup");

  //   res = await agent.post("/users").send({
  //     firstName: "Test",
  //     lastName: "User",
  //     email: "test@gmail.com",
  //     password: "12345678",
  //     _csrf: csrfToken,
  //   });
  // res = await agent.get("/login");

  // res = await agent.post("/session").send({
  //   email: "test@gmail.com",
  //   password: "12345678",
  //   _csrf: csrfToken,
  // });
  //   expect(res.statusCode).toBe(302);
  // });

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