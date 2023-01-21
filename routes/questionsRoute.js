const express = require("express");
const authenticateJWT = require("../middelwares/authenticateJWT");
const questionsController = require("../controllers/questionsController");

const router = express.Router();

router.use(authenticateJWT);

router.post("/createQuestion", questionsController.createQuestion);

router.get("/:id", questionsController.renderQuesDetailsPAge);
router.get("/:id/edit", questionsController.renderUpdateQuesPage);

router.delete("/:id", questionsController.deleteQuestion);
router.put("/:id", questionsController.updateQuestion);

module.exports = router;
