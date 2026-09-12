import { test, expect } from '../helpers/test-base';

test.describe('J. API Health & Network Monitoring Suite', () => {

  test('GET /api/destinations returns 200 with destination list', async ({ page }) => {
    const res = await page.request.get('/api/destinations?limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
    expect(body.results || body.items || body.destinations || Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/destinations/states returns valid state options', async ({ page }) => {
    const res = await page.request.get('/api/destinations/states');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test('GET /api/destinations/map-points returns points with coordinates', async ({ page }) => {
    const res = await page.request.get('/api/destinations/map-points?limit=20');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.points).toBeDefined();
    expect(body.points.length).toBeGreaterThan(0);
    // Note: Backend provides lat & lng keys
    const sample = body.points[0];
    expect(sample.lat).toBeDefined();
    expect(sample.lng).toBeDefined();
  });

  test('POST /api/auth/login handles invalid credentials with 401 or 400', async ({ page }) => {
    const res = await page.request.post('/api/auth/login', {
      data: {
        username: 'nonexistent.user@example.com',
        password: 'InvalidPassword123!'
      }
    });
    // Expected to reject with 400, 401, or 422
    expect([400, 401, 422]).toContain(res.status());
  });

});
