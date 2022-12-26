//import packages
const express = require('express')
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");

// create express application

const app = express()

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SECRET_STRING));

//set default view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


//routes
//export application
module.exports = app;

