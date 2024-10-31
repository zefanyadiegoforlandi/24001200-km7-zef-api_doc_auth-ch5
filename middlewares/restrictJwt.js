const passport = require('../lib/passportJwt');
const restrictJwt = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => { 
        if (!user) {
            return res.status(401).json({ message: 'unauthorized' });
        }
        req.user = user;
        
        next();
    })(req, res);
};

module.exports = restrictJwt;
