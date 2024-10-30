const express = require('express');
const { addAccount, getAccounts, getAccountById, updateAccount, deleteAccount } = require('../controllers/accountController');

const router = express.Router();

router.post('/accounts', addAccount);
router.get('/accounts', getAccounts);
router.get('/accounts/:accountId', getAccountById);
router.put('/accounts/:accountId', updateAccount);
router.delete('/accounts/:accountId', deleteAccount);

module.exports = router;
