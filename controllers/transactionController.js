const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST api/v1/transactions MEMBUAT TRANSAKSI BARU
const createTransaction = async (req, res) => {
    const sourceAccountIdInt = parseInt(req.body.source_account_id, 10);
    const destinationAccountIdInt = parseInt(req.body.destination_account_id, 10);
    const amountInt = parseInt(req.body.amount, 10);

    try {
        const [sourceAccount, destinationAccount] = await Promise.all([
            prisma.bankAccount.findUnique({ where: { id: sourceAccountIdInt } }),
            prisma.bankAccount.findUnique({ where: { id: destinationAccountIdInt } })
        ]);

        if (sourceAccountIdInt === destinationAccountIdInt) {
            throw new Error('422|Source and destination accounts must be different.');
        }
        if (!sourceAccount || !destinationAccount) {
            throw new Error('404|akun source atau destination tidak ada');

        }
    

        if (sourceAccount.balance < amountInt) {
            throw new Error('400|balance tidak cukup');

        }

        // Update balances
        await prisma.bankAccount.update({
            where: { id: sourceAccountIdInt },
            data: { balance: sourceAccount.balance - amountInt },
        });

        await prisma.bankAccount.update({
            where: { id: destinationAccountIdInt },
            data: { balance: destinationAccount.balance + amountInt },
        });

        // Record the transaction
        const transaction = await prisma.transaction.create({
            data: {
                source_account_id: sourceAccountIdInt,
                destination_account_id: destinationAccountIdInt,
                amount: amountInt,
            },
        });

        res.status(201).json({
            status: 201,
            message: 'Transaksi berhasil.',
            transaction,
        });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};


// GET /api/v1/transactions/:id menampilkan detail transaksi yang beserta akun dan usernya
const getTransactions = async (req, res) => {
        const transactions = await prisma.transaction.findMany();
        res.status(200).json({ 
            status: 200, 
            message: 'Berhasil mengambil data transaksi', 
            data: transactions 
        });
};


const getTransactionById = async (req, res) => {
        const { transactionId } = req.params;
    
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { id: parseInt(transactionId) }, 
                include: {
                    sourceAccount: { 
                        include: {
                            user: true, 
                        },
                    },
                    destinationAccount: { 
                        include: {
                            user: true, 
                        },
                    },
                },
            });

            if (!transaction) {
                throw new Error('404|transaksi tidak ada');

            }
    
            // Mengembalikan respon dengan format yang sesuai
            res.json({
                status: 200,
                message: "Berhasil menampilkan detail transaksi",
                data: {
                    id: transaction.id,
                    amount: transaction.amount,
                    source_account: {
                        id: transaction.sourceAccount.id,
                        bank_name: transaction.sourceAccount.bank_name, 
                        bank_account_number: transaction.sourceAccount.bank_account_number, 
                        user: {
                            id: transaction.sourceAccount.user.id,
                            name: transaction.sourceAccount.user.name,
                            email: transaction.sourceAccount.user.email,
                        },
                    },
                    destination_account: {
                        id: transaction.destinationAccount.id,
                        bank_name: transaction.destinationAccount.bank_name, 
                        bank_account_number: transaction.destinationAccount.bank_account_number, 
                        user: {
                            id: transaction.destinationAccount.user.id,
                            name: transaction.destinationAccount.user.name,
                            email: transaction.destinationAccount.user.email,
                        },
                    },
                },
            });
        } catch (error) {
            const [status, message] = error.message.split('|');
            res.status(parseInt(status, 10)).json({
                status: parseInt(status, 10),
                message: message
            });
        }
};



module.exports = { createTransaction, getTransactions, getTransactionById };
