const express = require("express");
const answerControler = require("../controllers/answerControler");
const authenticateJWT = require("../middelwares/authenticateJWT");
const router = express.Router();
router.use(authenticateJWT);

router.post("/createAnswers", answerControler.createAnswer);
router.get("/", answerControler.renderAnswersPage);
router.get("/:id", answerControler.renderUpdateAnsPage);

router.delete("/:id", answerControler.deleteAnswer);
router.put("/:id", answerControler.updateAnswer);
module.exports = router;
