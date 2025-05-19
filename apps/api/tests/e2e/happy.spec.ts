import { test, expect, request } from '@playwright/test';

const API = process.env.BASE_URL ?? 'http://localhost:3000';
const JWT = process.env.TEST_JWT   || 'eyJ...';

test('full CRUD & edit flow', async () => {
  const context = await request.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${JWT}` },
  });

  // 1. create site
  const { id: siteId } = await context.post('/sites', {
    data: {
      name: 'Demo',
      host: 'ftp.foo',
      username: 'u',
      password: 'p',
      rootPath: '/',
    },
  }).then(r => r.json());

  // 2. list files
  const files = await context.get(`/files/${siteId}`).then(r => r.json());
  expect(files).toBeInstanceOf(Array);

  // 3. save file
  await context.put(`/files/${siteId}/content`, {
    data: { path: '/index.html', content: '<h1>Updated</h1>' },
  }).then(r => r.ok());

  // 4. AI refactor diff
  const diff = await context.post(`/ai/refactor/${siteId}`, {
    data: { path: '/index.html', prompt: 'Change text to Hello World' },
  }).then(r => r.json());
  expect(diff.diff.startsWith('---')).toBeTruthy();
}); 