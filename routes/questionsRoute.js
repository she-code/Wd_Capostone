const express = require("express");
const authenticateJWT = require("../middelwares/authenticateJWT");
const questionsController = require("../controllers/questionsController");

const router = express.Router();

router.use(authenticateJWT);

router.post("/createQuestion", questionsController.createQuestion);

router.get("/:id", questionsController.renderQuesDetailsPAge);
router.delete("/:id", questionsController.deleteQuestion);

module.exports = router;
