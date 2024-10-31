const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const passport = require('../lib/passportJwt');

require('dotenv').config();

const register = async (req, res) => {
    const { name, email, password, identity_type, identity_number, address } = req.body;

    try {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        const identityExists = await prisma.profile.findUnique({ where: { identity_number } });

        if (emailExists || identityExists) {
            throw new Error('400|email atau identitas sudah dipakai user lain');
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

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error('400|email atau password salah');
        }

        const token = jwt.sign({ id: user.id, name: user.name, }, process.env.JWT_SECRET);
        res.json({ message: 'login sukses', token });
    } catch (error) {
        const [status, message] = error.message.split('|');
        res.status(parseInt(status, 10)).json({
            status: parseInt(status, 10),
            message: message
        });
    }
};


module.exports = {
    register,
    login,
};
