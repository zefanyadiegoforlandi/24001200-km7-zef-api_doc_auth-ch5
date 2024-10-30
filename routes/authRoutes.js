const express = require('express');
const router = express.Router();
const {
    registerPage,
    loginPage,
    dashboardPage,
    register,
    login,
    restrict,
} = require('../controllers/authController');

router.get('/register', registerPage);
router.post('/register', register);

router.get('/login', loginPage);
router.post('/login', login);

router.get('/dashboard', restrict, dashboardPage);

router.get('/logout', (req, res) => {
    res.clearCookie('token'); 
    res.redirect('/auth/login'); 
});

module.exports = router;
