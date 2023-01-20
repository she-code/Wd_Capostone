const bcrypt = require("bcrypt");
const localStrategy = require("passport-local");

const { Voter, Election } = require("../../models");
const strategy = new localStrategy(
  {
    usernameField: "voter_Id",
    passwordField: "password",
  },
  (voter_Id, password, done) => [
    Voter.findOne({ where: { voter_Id: voter_Id } })
      .then(async (voter) => {
        if (!voter) {
          return done(null, false, {
            message: "No Voter found with this voter Id",
          });
        }
        // console.log({ voter }, global.elecIdUrl);
        //check if the voter is registered for this election
        const election = await Election.findByPk(voter.electionId);
        if (election.url != global.elecIdUrl) {
          return done(null, false, {
            message: "You are not registered for this election",
          });
        }
        const result = await bcrypt.compare(password, voter.password);
        if (result) {
          // console.log(voter);
          return done(null, voter);
        } else {
          return done(null, false, { message: "Invalid password" });
        }
      })
      .catch((error) => {
        return done(error);
      }),
  ]
);
module.exports = strategy;
