const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('CivicReport API Professional Test Suite', function () {
    this.timeout(10000);
    let testToken = '';
    const testEmail = `test-${Date.now()}@example.com`;

    describe('Auth Services', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: testEmail,
                    password: 'password123'
                });

            expect(res.status).to.equal(201);
            expect(res.body.success).to.be.true;
            expect(res.body.user).to.have.property('profileImage');
        });

        it('should login and return a token', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testEmail,
                    password: 'password123'
                });

            expect(res.status).to.equal(200);
            testToken = res.body.token;
            expect(testToken).to.not.be.empty;
        });
    });

    describe('Health & Connectivity', () => {
        it('should return 200 OK for the health endpoint', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body).to.have.property('timestamp');
        });

        it('should return 404 for invalid routes', async () => {
            const res = await request(app).get('/api/invalid-route-123');
            expect(res.status).to.equal(404);
        });
    });

    describe('AI Services', () => {
        it('should return a structured chat response', async () => {
            const res = await request(app)
                .post('/api/ai/chat')
                .send({ message: 'Hello AI' });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.reply).to.have.property('text');
            expect(res.body.reply.options).to.be.an('array');
        });

        it('should suggest priority based on description', async () => {
            const res = await request(app)
                .post('/api/ai/suggest-priority')
                .send({
                    description: 'Large pothole causing accidents',
                    category: 'pothole'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(['low', 'medium', 'high']).to.include(res.body.priority);
        });

        it('should Suggest resolution for admin', async () => {
            const res = await request(app)
                .post('/api/ai/suggest-resolution')
                .send({
                    title: 'Pothole on Main St',
                    description: 'Large pothole causing accidents',
                    category: 'pothole'
                });

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('suggested_action');
            expect(res.body.data).to.have.property('response_draft');
        });

        it('should return system stats for dashboard', async () => {
            const res = await request(app)
                .get('/api/stats/overview')
                .set('Authorization', `Bearer ${testToken}`); // Use the token from login test

            expect(res.status).to.equal(200);
            expect(res.body.success).to.be.true;
            expect(res.body.data).to.have.property('categories');
            expect(res.body.data).to.have.property('statuses');
        });
    });

    describe('Frontend Access', () => {
        it('should serve the landing page', async () => {
            const res = await request(app).get('/');
            expect(res.status).to.equal(200);
            expect(res.text).to.include('<!DOCTYPE html>');
        });
    });
});
