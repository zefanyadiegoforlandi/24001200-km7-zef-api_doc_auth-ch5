const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addAccount = async (req, res) => {
    const { user_id, bank_name, bank_account_number, balance } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(user_id) } 
        });
        const existingAccount = await prisma.bankAccount.findFirst({
            where: {
                AND: [
                    { bank_name },
                    { bank_account_number },
                ],
            },
        });
        if (!existingUser) {
            throw new Error('404|tidak ada user');
        }

        if (existingAccount) {
            return res.status(400).json({ 
                status: 400, 
                message: 'nomor bank ini sudah dipakai untuk bank yang sama' 
            });
        }

        const account = await prisma.bankAccount.create({
            data: {
                balance,
                bank_name,
                bank_account_number,
                user: { connect: { id: parseInt(user_id) } },
            },
        });

        res.status(201).json({
            status: 201,
            message: 'Akun berhasil ditambahkan',
            data: {
                id: account.id,
                user_id: account.user_id,
                bank_name: account.bank_name,
                bank_account_number: account.bank_account_number,
                balance: account.balance,
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

const getAccounts = async (req, res) => {
        const accounts = await prisma.bankAccount.findMany();
        res.status(200).json({ 
            status: 200, 
            message: 'berhasil menampilkan daftar akun', 
            data: accounts 
        });
};

// Mendapatkan detail akun berdasarkan ID
const getAccountById = async (req, res) => {
    const { accountId } = req.params;
    try {
        const account = await prisma.bankAccount.findUnique({
            where: { id: parseInt(accountId) },
        });

        if (!account) {
            throw new Error('404|tidak ada akun');
        }

        res.status(200).json({ 
            status: 200, 
            message: 'berhasil menampilkan detail akun', 
            data: account 
        });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};

// Mengupdate akun
const updateAccount = async (req, res) => {
    const { accountId } = req.params;
    const { bank_name, bank_account_number, balance } = req.body;

    try {
        const account = await prisma.bankAccount.findUnique({
            where: { id: parseInt(accountId) },
        });

        if (!account) {
            throw new Error('404|tidak ada akun');
        }

        const updatedAccount = await prisma.bankAccount.update({
            where: { id: parseInt(accountId) },
            data: {
                ...(bank_name && { bank_name }),
                ...(bank_account_number && { bank_account_number }),
                ...(balance && { balance }),
            },
        });

        res.status(200).json({ 
            status: 200, 
            message: 'akun berhasil diupdate', 
            data: updatedAccount 
        });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};

// Menghapus akun
const deleteAccount = async (req, res) => {
    const { accountId } = req.params;

    try {
        // Memastikan akun bank ada sebelum dihapus
        const existingAccount = await prisma.bankAccount.findUnique({
            where: { id: parseInt(accountId) }
        });

        if (!existingAccount) {
            throw new Error('404|tidak ada akun');

        }

        // Jika akun ditemukan, lanjutkan dengan penghapusan
        await prisma.bankAccount.delete({ where: { id: parseInt(accountId) } });
        res.status(200).json({ 
            status: 200, 
            message: 'akun berhasil dihapus' 
        });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};


module.exports = {
    addAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
};
