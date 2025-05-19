import request from 'supertest';
import app     from '../../src/index';
import { supaStub } from '../helpers/mockSupa';

describe('GET /files/:siteId', () => {
  const restore = supaStub();

  afterAll(restore);

  it('returns directory listing', async () => {
    const res = await request(app)
      .get('/files/123?root=/')
      .set('Authorization', 'Bearer test-jwt')
      .expect(200);

    expect(res.body[0]).toMatchObject({
      name: 'index.html',
      type: 'file',
    });
  });

  it('401 without JWT', async () => {
    await request(app).get('/files/123').expect(401);
  });
}); 