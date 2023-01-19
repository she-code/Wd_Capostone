const express = require("express");
const answerControler = require("../controllers/answerControler");

const router = express.Router();
router.post("/createAnswers", answerControler.createAnswer);
router.get("/", answerControler.renderAnswersPage);
router.delete("/:id", answerControler.deleteAnswer);

module.exports = router;
