const localStrategy = require("./localStrategy");

const { Voter } = require("../../models");
const initiatePassport = (passport) => {
  passport.use(localStrategy);

  passport.serializeUser((voter, done) => {
    console.log("Seralizing voter in session", voter.id);
    done(null, voter.id);
  });

  passport.deserializeUser((id, done) => {
    Voter.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => done(error, null));
  });
  // passport.use(jwtStrategy);
};

module.exports = initiatePassport;
