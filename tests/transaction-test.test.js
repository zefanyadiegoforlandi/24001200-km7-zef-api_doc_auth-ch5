const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { app, server } = require('../app'); 
const prisma = new PrismaClient();

describe('Create Transaction Integration Tests', () => {
    let userId;
    let sourceAccountId;
    let destinationAccountId;
    let transactionId; 
    beforeAll(async () => {
        const userResponse = await request(app)
            .post('/api/v1/users')
            .send({
                name: 'Test User Transaction',
                email: 'testusertransaction@example.com',
                password: 'password123',
                identity_type: 'KTP',
                identity_number: '99991',
                address: 'Jl. Test No. 1'
            });

        userId = userResponse.body.user.id;

        const sourceAccountResponse = await request(app)
            .post('/api/v1/accounts')
            .send({
                user_id: userId,
                bank_name: 'Source Bank',
                bank_account_number: '123456789',
                balance: 1000,
            });

        sourceAccountId = sourceAccountResponse.body.data.id;

        const destinationAccountResponse = await request(app)
            .post('/api/v1/accounts')
            .send({
                user_id: userId,
                bank_name: 'Destination Bank',
                bank_account_number: '987654321',
                balance: 500,
            });

        destinationAccountId = destinationAccountResponse.body.data.id;
    });

    test('ini testing sukses 201 create transaction', (done) => {
        request(app)
            .post('/api/v1/transactions')
            .send({
                source_account_id: sourceAccountId,
                destination_account_id: destinationAccountId,
                amount: 200,
            })
            .then(response => {
                expect(response.status).toBe(201);
                expect(response.body.status).toBe(201);
                expect(response.body.message).toBe('Transaksi berhasil.');

                transactionId = response.body.transaction.id;

                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle 400 => source and destination accounts must be different', (done) => {
        const transactionData = {
            source_account_id: sourceAccountId,
            destination_account_id: sourceAccountId, 
            amount: 200,
        };

        request(app)
            .post('/api/v1/transactions')
            .send(transactionData)
            .then(response => {
                expect(response.status).toBe(422);
                expect(response.body).toHaveProperty('status', 422);
                expect(response.body).toHaveProperty('message', 'Source and destination accounts must be different.');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle 404 => akun source atau destination tidak ditemukan', (done) => {
        const transactionData = {
            source_account_id: sourceAccountId,
            destination_account_id: 9999997,
            amount: 200,
        };

        request(app)
            .post('/api/v1/transactions')
            .send(transactionData)
            .then(response => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'akun source atau destination tidak ada');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing error handle 400 => insufficient balance', (done) => {
        const transactionData = {
            source_account_id: sourceAccountId,
            destination_account_id: destinationAccountId,
            amount: 2000, 
        };

        request(app)
            .post('/api/v1/transactions')
            .send(transactionData)
            .then(response => {
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('status', 400);
                expect(response.body).toHaveProperty('message', 'balance tidak cukup');
                done();
            })
            .catch(err => done(err));
    });

    test('ini testing sukses 200 get transactions', (done) => {
        request(app)
            .get('/api/v1/transactions')
            .then((response) => {
                expect(response.status).toBe(200);
                expect(response.body.status).toBe(200);
                expect(response.body.message).toBe('Berhasil mengambil data transaksi');
                expect(Array.isArray(response.body.data)).toBe(true);
                expect(response.body.data.length).toBeGreaterThan(0);
                done();
            })
            .catch((error) => {
                done(error);
            });
    });

    test('should return transaction details successfully', (done) => {
        request(app)
            .get(`/api/v1/transactions/${transactionId}`)
            .then((response) => {
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('status', 200);
                expect(response.body).toHaveProperty('message', 'Berhasil menampilkan detail transaksi');
                expect(response.body).toHaveProperty('data');
                expect(response.body.data).toHaveProperty('id', transactionId);
                expect(response.body.data).toHaveProperty('amount');
                expect(response.body.data).toHaveProperty('source_account');
                expect(response.body.data.source_account).toHaveProperty('id');
                expect(response.body.data.source_account).toHaveProperty('bank_name');
                expect(response.body.data.source_account).toHaveProperty('bank_account_number');
                expect(response.body.data.source_account.user).toHaveProperty('id');
                expect(response.body.data.source_account.user).toHaveProperty('name');
                expect(response.body.data.source_account.user).toHaveProperty('email');
                expect(response.body.data.destination_account).toHaveProperty('id');
                expect(response.body.data.destination_account).toHaveProperty('bank_name');
                expect(response.body.data.destination_account).toHaveProperty('bank_account_number');
                expect(response.body.data.destination_account.user).toHaveProperty('id');
                expect(response.body.data.destination_account.user).toHaveProperty('name');
                expect(response.body.data.destination_account.user).toHaveProperty('email');
                
                done();
            })
            .catch((err) => done(err));
    });

    test('ini testing error handle 404 get by id => transaksi tidak ada ', (done) => {
        request(app)
            .get(`/api/v1/transactions/999919`)
            .then((response) => {
                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('status', 404);
                expect(response.body).toHaveProperty('message', 'transaksi tidak ada');
                
                done();
            })
            .catch((err) => done(err));
    });


    afterAll(async () => {
        if (transactionId) {
            await prisma.transaction.delete({
                where: { id: transactionId },
            });
        } 
        if (sourceAccountId) {
            await prisma.bankAccount.delete({
                where: { id: sourceAccountId },
            });
        } 
        if (destinationAccountId) {
            await prisma.bankAccount.delete({
                where: { id: destinationAccountId },
            });
        } 
        if (userId) {
            await prisma.user.delete({
                where: { id: userId },
            });
        }

        await prisma.$disconnect();
        server.close();
    });
    
});
