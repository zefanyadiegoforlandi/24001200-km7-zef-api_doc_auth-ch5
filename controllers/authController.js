const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const restrict = require('../middlewares/restrict');

require('dotenv').config(); 

// Halaman EJS
const registerPage = (req, res) => {
    res.render('register'); // Render halaman registrasi
};

const loginPage = (req, res) => {
    res.render('loginPage'); // Render halaman login
};

const dashboardPage = (req, res) => {
    res.render('dashboardPage', { user: req.user }); // Render halaman dashboard
};

const register = async (req, res) => {
    const { name, email, password, identity_type, identity_number, address } = req.body;

    try {
        const emailExists = await prisma.user.findUnique({ where: { email } });
        const identityExists = await prisma.profile.findUnique({ where: { identity_number } });

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

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET);
            res.json({ message: 'Login sukses', token }); // Mengembalikan token sebagai JSON
        } else {
            return res.status(401).json({ message: 'Email atau password salah' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat login' });
    }
};

const authenticate = (req, res) => {
    const token = req.cookies.token; 
    if (!token) {
        return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token tidak valid' });
        }

        res.redirect('/auth/dashboard');
    });
};


module.exports = {
    registerPage,
    loginPage,
    dashboardPage,
    register,
    login,
    restrict,
};
