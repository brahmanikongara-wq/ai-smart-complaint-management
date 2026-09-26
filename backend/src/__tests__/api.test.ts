import request from 'supertest';
import app from '../app';

describe('ResolvAI API System Health & AI Services', () => {
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/v1/auth/login with invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login with valid admin credentials returns JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@resolvai.gov', password: 'Password@123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('POST /api/v1/chatbot/message handles greeting intent', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot/message')
      .send({ message: 'Hello! Can you help me?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.intent).toBe('GREETING');
    expect(res.body.data.reply).toContain('ResolvAI');
  });

  it('POST /api/v1/chatbot/message handles ticket status query', async () => {
    const res = await request(app)
      .post('/api/v1/chatbot/message')
      .send({ message: 'What is the status of ticket CMP-2026-1001?' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.intent).toBe('CHECK_STATUS');
    expect(res.body.data.reply).toContain('CMP-2026-1001');
  });
});
