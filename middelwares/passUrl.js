/**This middelware will the save the user Id globally and passes it to the next controller
 * for previous url accessing */

const passCustomStringToUrl = (req, res, next) => {
  const id = req.params.customString;
  global.voterUrl = id;
  next();
};
module.exports = passCustomStringToUrl;
