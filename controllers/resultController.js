const { Result } = require("../models");
exports.deleteResult = async (req, res) => {
  // const result = await
  const id = req.params.id;
  const result = await Result.findByPk(id);
  await result.destroy();
  res.send(true);
};
