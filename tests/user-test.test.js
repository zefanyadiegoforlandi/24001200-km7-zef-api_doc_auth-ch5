const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { app, server } = require('../app');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

describe('User Controller Integration Tests', () => {
    let userId;
    let secondUserId;

    test('ini testing success post 200 => user berhasil ditambahkan', (done) => {
        request(app)
            .post('/api/v1/users')
            .send({
                name: 'Lewis example', 
                email: 'lewis27Mercedes@example.com', 
                password: 'password123',
                identity_type: 'KTP',
                identity_number: '111111',
                address: 'Jl. Manchester No. 14'
            })
            .then(response => {
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('status', 201);
                expect(response.body).toHaveProperty('message', 'user berhasil ditambahkan');
                userId = response.body.user.id;
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle post 400 => email atau identitas sudah dipakai user lain', (done) => {
        request(app)
            .post('/api/v1/users')
            .send({
                name: 'Duplicate User',
                email: 'lewis27Mercedes@example.com',
                password: 'password456',
                identity_type: 'KTP',
                identity_number: '111111',
                address: '789 Boulevard, City'
            })
            .then(response => {
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('status', 400);
                expect(response.body).toHaveProperty('message', 'email atau identitas sudah dipakai user lain');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing success get all data 200 => berhasil menampilkan users', (done) => {
        request(app)
            .get('/api/v1/users')
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'berhasil menampilkan users');
                expect(response.body.data).toBeDefined();
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing success get by id 200 => berhasil menampilkan detail user ', (done) => {
        request(app)
            .get(`/api/v1/users/${userId}`)
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'berhasil menampilkan detail user');
                expect(response.body.data).toHaveProperty('id', userId);
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle 404 => tidak ada user', (done) => {
        const nonExistentUserId = 999999; // ID yang tidak ada
        request(app)
            .get(`/api/v1/users/${nonExistentUserId}`)
            .then(response => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada user');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing update success 200 => user berhasil diupdate', (done) => {
        request(app)
            .put(`/api/v1/users/${userId}`)
            .send({
                name: 'Updated User',
                email: 'updated@example.com', 
                password: 'newpassword123',
                identity_type: 'KTP',
                identity_number: '333333',
                address: 'Jl. Updated No. 16'
            })
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'user berhasil diupdate');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle update 404 => tidak ada user', (done) => {
        request(app)
            .put(`/api/v1/users/9999999`)
            .send({
                name: 'Updated User',
                email: 'updated@example.com', 
                password: 'newpassword123',
                identity_type: 'KTP',
                identity_number: '333333',
                address: 'Jl. Updated No. 16'
            })
            .then(response => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada user');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle duplikat email update 400 => email atau identity_number sudah dipakai user lain', (done) => {
        //  testing error handle 400  update jika email atau identity sudah di pakai user lain
        request(app)
            .post('/api/v1/users')
            .send({
                name: 'Second User',
                email: 'second@example.com',
                password: 'password456',
                identity_type: 'KTP',
                identity_number: '222222',
                address: 'Jl. Second No. 2'
            })
            .then(secondUserResponse => {
                secondUserId = secondUserResponse.body.user.id;

                // Mencoba memperbarui secondUserId dengan email dan identitiy_number userId yang telah di update
                return request(app)
                    .put(`/api/v1/users/${secondUserId}`)
                    .send({
                        name: 'Updated',
                        email: 'updated@example.com',
                        password: 'newpassword123',
                        identity_type: 'KTP',
                        identity_number: '1000000001',
                        address: 'Jl. Updated No. 3'
                    });
            })
            .then(updateResponse => {
                expect(updateResponse.status).toBe(400);
                expect(updateResponse.body).toHaveProperty('status', 400);
                expect(updateResponse.body).toHaveProperty('message', 'email atau identity_number sudah dipakai user lain');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle duplikat identity_number update 400 => email atau identity_number sudah dipakai user lain', (done) => {
        request(app)
            .put(`/api/v1/users/${secondUserId}`)
            .send({
                name: 'Updated error User',
                email: 'second@example.com', 
                password: 'newpassword123',
                identity_type: 'KTP',
                identity_number: '333333',
                address: 'Jl. Updated No. 16'
            })
            .then(response => {
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('status', 400);
                expect(response.body).toHaveProperty('message', 'email atau identity_number sudah dipakai user lain');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing success 200 update hanya 1 value kerena memakai spread operator => user berhasil diupdate', (done) => {
        request(app)
            .put(`/api/v1/users/${userId}`)
            .send({
                name: 'Updated2 User',
            })
            .then(response => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'user berhasil diupdate');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing success delete 200 => user berhasil dihapus', (done) => {
        // userId akan terhapus di delete sehingga tidak perlu menghapus lagi di after all
        request(app)
            .delete(`/api/v1/users/${userId}`)
            .then((response) => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'user berhasil dihapus');
                done();
            })
            .catch((err) => done(err));
    });

    test('ini testing error handle delete 404 => tidak ada user', (done) => {
        request(app)
            .delete(`/api/v1/users/999999`)
            .then((response) => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'tidak ada user');
                done();
            })
            .catch((err) => done(err));
    });

    afterAll(async () => {
        //userId sudah di hapus menggunakan method delete. tinggal menghapus secondUserId
        if (secondUserId) {
            await prisma.user.delete({
                where: { id: secondUserId },
            });
        }
        await prisma.$disconnect();
        server.close();
    });
});
