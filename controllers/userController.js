const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');


// Menambahkan user dan profile
const addUser = async (req, res) => {
    const { name, email, password, identity_type, identity_number, address } = req.body;

    try {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        const identityExists = await prisma.profile.findUnique({ where: { identity_number,} });

        if (emailExists || identityExists) {
            throw new Error('404|email atau identitas sudah dipakai user lain');
        }

        const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS));

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                profile: {
                    create: {
                        identity_type,
                        identity_number,
                        address,
                    }
                }
            },
            include: { profile: true }
        });

        res.status(201).json({ 
            status: 201, 
            message: 'user berhasil ditambahkan', 
            user: newUser 
        });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
    
};

// Menampilkan daftar users
const getUsers = async (req, res) => {
        const users = await prisma.user.findMany();
        res.status(200).json({ 
            status: 200, 
            message: 'berhasil menampilkan users', 
            data: users 
        });
};

// Menampilkan detail user dengan profile
const getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { profile: true }
        });
        
        if (!user) {
            throw new Error('404|tidak ada user');
        }

        res.status(200).json({ 
            status: 200, 
            message: 'berhasil menampilkan detail user', 
            data: user });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};

// Mengupdate user
const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, password, identity_type, identity_number, address } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { profile: true }
        });

        if (!existingUser) {
            throw new Error('404|tidak ada user');

        }

        const emailExists = email ? await prisma.user.findUnique({ where: { email } }) : null;
        const identityExists = identity_number ? await prisma.profile.findUnique({ where: { identity_number } }) : null;

        if (
            (emailExists && emailExists.id !== existingUser.id) ||
            (identityExists && identityExists.user_id !== existingUser.profile.user_id)
        ) {
            throw new Error('400|email atau identity_number sudah dipakai user lain');
        }

        const updateData = {
            ...(name && { name }),
            ...(email && { email }), 
            ...(password && { password: await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS)) }),
            ...(identity_type || identity_number || address ? {
                profile: {
                    update: {
                        ...(identity_type && { identity_type }),
                        ...(identity_number && { identity_number }),
                        ...(address && { address })
                    }
                }
            } : {})
        };

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: updateData,
            include: { profile: true }
        });

        res.status(200).json({ 
            status: 200, 
            message: 'user berhasil diupdate', 
            data: updatedUser 
        });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};


// Menghapus user
const deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) {
            throw new Error('404|tidak ada user');
        }

        await prisma.user.delete({ where: { id: parseInt(userId) } });
        res.status(200).json({
            status: 200,
            message: 'user berhasil dihapus'
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
    addUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
