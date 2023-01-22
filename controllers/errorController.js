const AppError = require("../utils/AppError");
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);
const handleLauncElectionError = () =>
  new AppError("An election must have atleast 1 question to be launched", 403);
const handleDeleteQuestionError = () =>
  new AppError("An election must atleast have one question in the ballot", 403);
const handleInvalidId = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const sendErrorDev = (err, req, res) => {
  //add api
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) RENDERED WEBSITE
  console.error("ERROR ", err);
  return res.status(err.statusCode).render("errorPage", {
    title: "Something went wrong!",
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/api")) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error("ERROR ", err);
    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("errorPage", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR ", err);
  // 2) Send generic message
  return res.status(err.statusCode).render("errorPage", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.name === "SequelizeDatabaseError") {
      if (error.message == "invalid input syntax for type integer") {
        error === handleInvalidId(error);
      }
    }
    if (
      err.message ===
      "Every question in an election must have atleast two answers"
    )
      err = handleLauncElectionError();
    if (
      err.message === "An election must atleast have one question in the ballot"
    )
      err = handleDeleteQuestionError();

    sendErrorProd(error, req, res);
  }
};
