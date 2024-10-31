const express = require('express');
const router = express.Router();
const {
    register,
    login,
} = require('../controllers/authController');
const restrictJwt = require('../middlewares/restrictJwt')

router.post('/register', register);
router.get('/authenticate', restrictJwt, (req, res) => {
    res.json({ message: 'selamat anda authenticate!', user: req.user });
});
router.post('/login', login);


module.exports = router;
