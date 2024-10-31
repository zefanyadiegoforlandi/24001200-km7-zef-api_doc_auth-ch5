const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    if (jwt_payload && jwt_payload.id) {
        return done(null, jwt_payload);
    } else {
        return done(null, false); 
    }
}));

module.exports = passport;
