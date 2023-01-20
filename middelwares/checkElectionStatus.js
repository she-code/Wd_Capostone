/** This middelware checks the election status and req.user
 *  if it's launched and if there's no user it will forward to voter authentication
 * if the election is launched it will forward to result display
 * */

const { Election } = require("../models");
const checkElectionStatus = async (req, res, next) => {
  const customString = req.params.customString;

  global.elecIdUrl = customString;
  try {
    const election = await Election.findOne({ where: { url: customString } });
    console.log(election);
    if (!election) {
      //pass to error controller
      return next("Election not found");
    }
    const status = election.status;
    if (status == "launched" && req.user == null) {
      res.redirect("/voterLogin");
    } else if (status == "launched" && req.user != null) {
      next();
    } else if (status == "ended") {
      // res.redirect(`/elections/${electionId}/vote`);
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = checkElectionStatus;
