const express = require('express');
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction } = require('../controllers/transactionController');

const router = express.Router();

router.post('/transactions', createTransaction);
router.get('/transactions', getTransactions);
router.get('/transactions/:transactionId', getTransactionById);

module.exports = router;
