const jwt = require('jsonwebtoken');

const restrict = (req, res, next) => {
    const token = req.cookies.token; // Mengambil token dari cookie
    console.log("Token:", token); // Debugging

    if (!token) {
        console.log("Unauthorized: No token");
        return res.status(401).send('Unauthorized'); // Jika tidak ada token
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token tidak valid:", err);
            return res.status(403).send('Token tidak valid'); // Jika token tidak valid
        }
        req.user = user; // Simpan informasi pengguna di req.user
        next(); // Lanjutkan ke middleware atau route berikutnya
    });
};


module.exports = restrict;
