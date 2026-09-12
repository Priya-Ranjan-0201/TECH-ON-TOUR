import { test, expect } from '../helpers/test-base';

test.describe('A. Smoke Testing Suite', () => {

  test('application startup and homepage root rendering', async ({ page, monitor }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify root body and title
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/TravelSathi/i);

    // Verify 3D/2D Hero container exists
    const heroTitle = page.getByRole('heading', { level: 1 }).first();
    await expect(heroTitle).toBeVisible();

    // Verify main CTA button exists
    const exploreBtn = page.getByRole('link', { name: /Explore India|Start Exploring/i }).or(page.getByRole('button', { name: /Explore/i })).first();
    await expect(exploreBtn).toBeVisible();

    // Check no fatal runtime uncaught exceptions occurred
    expect(monitor.pageErrors.length).toBe(0);
  });

  test('backend API availability and ping check', async ({ page }) => {
    const res = await page.request.get('/api/destinations?limit=1');
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test('critical public routes render without fatal blank screens', async ({ page, monitor }) => {
    const criticalRoutes = ['/explore', '/stays', '/safety'];

    for (const route of criticalRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();
      // Ensure page rendered meaningful content
      const headings = page.locator('h1, h2, h3');
      await expect(headings.first()).toBeVisible({ timeout: 5000 });
    }

    expect(monitor.pageErrors.length).toBe(0);
  });

});
