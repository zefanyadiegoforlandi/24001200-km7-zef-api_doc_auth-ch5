const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { app, server } = require('../app');

const prisma = new PrismaClient();

describe('User Controller Integration Tests', () => {
    let userId;
    let accountId;

    beforeAll(async () => {
        const userResponse = await request(app)
            .post('/api/v1/users')
            .send({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123',
                identity_type: 'KTP',
                identity_number: '123456',
                address: 'Jl. Test No. 1'
            });
        userId = userResponse.body.user.id;
    });

    test('ini testing error handle 404 => tidak ada user', (done) => {
        request(app)
            .post('/api/v1/accounts')
            .send({
                user_id: 99999,
                bank_name: 'Bank Test',
                bank_account_number: '123456789',
                balance: 1000
            })
            .then(response => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada user');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle 400 => nomor bank sudah dipakai untuk bank yang sama', (done) => {
        request(app)
            .post('/api/v1/accounts')
            .send({
                user_id: userId,
                bank_name: 'Bank Test',
                bank_account_number: '123456789',
                balance: 1000
            })
            .then(() => {
                return request(app)
                    .post('/api/v1/accounts')
                    .send({
                        user_id: userId,
                        bank_name: 'Bank Test',
                        bank_account_number: '123456789',
                        balance: 2000
                    });
            })
            .then(response => {
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('status', 400);
                expect(response.body).toHaveProperty('message', 'nomor bank ini sudah dipakai untuk bank yang sama');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing sukses menambahkan akun', (done) => {
        request(app)
            .post('/api/v1/accounts')
            .send({
                user_id: userId,
                bank_name: 'Bank Test 2',
                bank_account_number: '987654321',
                balance: 1500000
            })
            .then(response => {
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('status', 201);
                expect(response.body).toHaveProperty('message', 'Akun berhasil ditambahkan');
                accountId = response.body.data.id;
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing sukses get all 200 => berhasil menampilkan daftar akun', (done) => {
        request(app)
            .get('/api/v1/accounts') 
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'berhasil menampilkan daftar akun');
                expect(response.body.data).toBeDefined(); 
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing sukses get by id 200 => berhasil menampilkan detail akun', (done) => {
        request(app)
            .get(`/api/v1/accounts/${accountId}`) 
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'berhasil menampilkan detail akun');
                expect(response.body.data).toBeDefined();
                expect(response.body.data.id).toBe(accountId); 
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle get by id 404 => tidak ada akun', (done) => {
        request(app)
            .get('/api/v1/accounts/99999') 
            .then(response => {
                expect(response.status).toBe(404); 
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada akun');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing sukses update 200 => akun berhasil diupdate', (done) => {
        request(app)
            .put(`/api/v1/accounts/${accountId}`) 
            .send({
                bank_name: 'Bank Test Updated',
                bank_account_number: '987654321',
                balance: 1500,
            })
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'akun berhasil diupdate');
                expect(response.body.data).toBeDefined();
                expect(response.body.data.bank_name).toBe('Bank Test Updated');
                expect(response.body.data.bank_account_number).toBe('987654321');
                expect(response.body.data.balance).toBe(1500);
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle 404 => tidak ada akun', (done) => {
        request(app)
            .put('/api/v1/accounts/99999') 
            .send({
                bank_name: 'Bank Test Updated',
                bank_account_number: '987654321',
                balance: 1500,
            })
            .then(response => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada akun');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing sukses update dengan data sebagian dengan spread operator 200 => akun berhasil diupdate', (done) => {
        request(app)
            .put(`/api/v1/accounts/${accountId}`) 
            .send({
                balance: 2000, 
            })
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'akun berhasil diupdate');
                expect(response.body.data).toBeDefined();
                expect(response.body.data.balance).toBe(2000);
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing success delete 200 => akun berhasil dihapus', (done) => {
        request(app)
            .delete(`/api/v1/accounts/${accountId}`) 
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'akun berhasil dihapus');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle delete 404 => tidak ada akun', (done) => {
        request(app)
            .delete('/api/v1/accounts/99999') 
            .then(response => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada akun');
                done();
            })
            .catch(err => done(err));
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