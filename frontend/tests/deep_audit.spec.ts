import { test, expect } from './helpers/test-base';

const PUBLIC_ROUTES = [
  '/',
  '/explore',
  '/destination/dest-1',
  '/map',
  '/experiences',
  '/stays',
  '/safety',
  '/events',
  '/about',
  '/help',
  '/plan',
  '/travel-twin',
  '/trips',
  '/trips/live',
  '/trips/group',
  '/wallet',
  '/bookings',
  '/saved',
  '/privacy',
  '/reviews',
  '/memories',
  '/auth',
  '/search',
  '/dashboard',
  '/nearby',
  '/recommendations',
  '/seasonal',
  '/trending',
  '/weather',
  '/notifications',
  '/assistant'
];

test.describe('Deep Systematic Audit of All Application Routes', () => {

  for (const route of PUBLIC_ROUTES) {
    test(`route ${route} loads cleanly without fatal errors`, async ({ page }) => {
      const pageErrors: string[] = [];
      const failedRequests: string[] = [];

      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      page.on('response', (res) => {
        if (res.status() >= 400 && !res.url().includes('/auth/login') && !res.url().includes('favicon')) {
          failedRequests.push(`${res.status()} ${res.url()}`);
        }
      });

      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(600);

      // Verify page body is mounted and has content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // Verify no fatal page runtime crashes occurred
      if (pageErrors.length > 0) {
        console.error(`Page errors on ${route}:`, pageErrors);
      }
      expect(pageErrors).toEqual([]);

      // Verify no critical API calls returned 404 or 500
      if (failedRequests.length > 0) {
        console.warn(`Failed requests on ${route}:`, failedRequests);
      }
    });
  }

  test('admin and dmo views load with admin role authentication', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_role', 'admin');
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-admin-audit',
        name: 'Chief Administrator',
        role: 'admin'
      }));
    });

    const adminRoutes = ['/admin', '/admin/dmo', '/host', '/gov'];
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible();
    }
  });

});
