const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { app, server } = require('../app'); 

describe('Auth Controller', () => {
    let userId;
    let token;

    test('ini testing success post 201 => user berhasil ditambahkan', (done) => {
        request(app)
            .post('/auth/register')
            .send({
                name: 'Register User',
                email: 'oscar@example.com',
                password: 'password123',
                identity_type: 'KTP',
                identity_number: '111111',
                address: 'Jl. Manchester No. 17'
            })
            .then(response => {
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('status', 201);
                expect(response.body).toHaveProperty('message', 'user berhasil ditambahkan');
                userId = response.body.user.id; 
                done();
            })
            .catch(err => {
                done(err);
            });
    });
    

    // Uji pendaftaran pengguna dengan email yang sudah ada
    test('should return 404 if email already exists', (done) => {
        request(app)
            .post('/auth/register')
            .send({
                name: 'Register Wrong User',
                email: 'oscar@example.com',
                password: 'password123',
                identity_type: 'KTP',
                identity_number: '111111',
                address: 'Jl. Manchester No. 14'
            })
            .then((response) => {
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('status', 400);
                expect(response.body).toHaveProperty('message', 'email atau identitas sudah dipakai user lain');
                done();
            })
            .catch((err) => done(err));
    });

    // Uji login pengguna yang berhasil
    test('should login successfully and return token', (done) => {
        request(app)
            .post('/auth/login')
            .send({
                email: 'oscar@example.com',
                password: 'password123',
            })
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message', 'login sukses');
                expect(response.body).toHaveProperty('token');
                token = response.body.token;
                done();
            })
            .catch((err) => done(err));
    });

    // Uji login dengan email atau password yang salah
    test('should return 400 if email or password is incorrect', (done) => {
        request(app)
            .post('/auth/login')
            .send({ email: 'wrongemail@example.com', password: 'wrongpassword' })
            .then((response) => {
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('status', 400);
                expect(response.body).toHaveProperty('message', 'email atau password salah');
                done();
            })
            .catch((err) => done(err));
    });

    // Uji autentikasi pengguna dengan token yang valid
    test('should authenticate user with valid token', (done) => {
        request(app)
            .get('/auth/authenticate')
            .set('Authorization', `Bearer ${token}`) 
            .then((response) => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message', 'selamat anda authenticate!');
                expect(response.body).toHaveProperty('user');
                done();
            })
            .catch((err) => done(err));
    });

    // Uji mengembalikan 403 jika token tidak valid
    test('should authenticate user with valid token', (done) => {
        request(app)
            .get('/auth/authenticate')
            .set('Authorization', 'token=invalidtoken') 
            .then((response) => {
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message', 'unauthorized');
                done();
            })
            .catch((err) => done(err));
    });

    test('should return unauthorized for token without id', (done) => {
        const invalidToken = jwt.sign({ name: 'Test User Jwt0101' }, process.env.JWT_SECRET); 
    
        request(app)
            .get('/auth/authenticate')
            .set('Authorization', `Bearer ${invalidToken}`)             
            .then((response) => {
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message', 'unauthorized');
                done();
            })
            .catch((err) => done(err));
    });

    afterAll(async () => {
        if (userId) {
            await prisma.user.delete({
                where: { id: userId },
            });
        }
        await prisma.$disconnect();
        server.close();
    });
});
