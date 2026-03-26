const request = require('supertest');
const app = require('../index');

describe('Health Check', () => {
  it('GET /health should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Chat Route', () => {
  it('POST /api/chat without question should return 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({});
    expect(res.status).toBe(400);
  });
});