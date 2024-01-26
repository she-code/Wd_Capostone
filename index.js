const app = require("./app");

//start the server
app.listen(5001 || 3000, () => {
  console.log("server started on port", 5001);
});
