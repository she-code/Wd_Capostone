const passport = require("passport");
const passportJwt = require("passport-jwt");
const EXtractJwt = passportJwt.ExtractJwt;
const StrategyJwt = passportJwt.Strategy;
const { Voter } = require("../models");
passport.use(
  new StrategyJwt(
    {
      jwtFromRequest: EXtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    function (jwtPayload, done) {
      return Voter.findOne({ where: { id: jwtPayload.id } })
        .then((voter) => {
          return done(null, voter);
        })
        .catch((err) => {
          return done(err);
        });
    }
  )
);
