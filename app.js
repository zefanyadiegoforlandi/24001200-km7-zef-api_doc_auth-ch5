const express = require('express');
const passport = require('passport');
const { PrismaClient } = require('@prisma/client');
const path = require('path'); 
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const bodyParser = require('body-parser');
const swaggerJSON = require('./swagger.json');
const swaggerUI = require('swagger-ui-express');
const session = require('express-session');
const cookieParser = require('cookie-parser'); 

const app = express();
const prisma = new PrismaClient();

// Gunakan middleware di sini
app.use(cookieParser()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerJSON));

app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(passport.initialize());
require('./lib/passportJwt')(passport); 

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', 
    saveUninitialized: true,
    resave: false,
    cookie: { secure: false }
}));

// Menggunakan routes
app.use('/auth', authRoutes);

app.use('/api/v1', userRoutes);
app.use('/api/v1', accountRoutes);
app.use('/api/v1', transactionRoutes);

// Jalankan server di port 3000 jika ini adalah file utama
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Ekspor app untuk pengujian
module.exports = { app, server };
