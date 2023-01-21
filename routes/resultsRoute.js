const express = require("express");
const resultsController = require("../controllers/resultController");
const router = express.Router();

router.post("/:id", resultsController.deleteResult);

module.exports = router;
