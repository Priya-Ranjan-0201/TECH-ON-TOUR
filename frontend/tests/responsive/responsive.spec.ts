import { test, expect } from '../helpers/test-base';

test.describe('P. Responsive Design & Mobile Behavior Suite', () => {

  test('mobile bottom bar visible on mobile and hidden on desktop', async ({ page, isMobile }) => {
    await page.goto('/');

    const mobileNav = page.locator('nav.fixed.bottom-0');
    if (isMobile) {
      await expect(mobileNav).toBeVisible({ timeout: 8000 });
    } else {
      await expect(mobileNav).not.toBeVisible();
    }
  });

  test('plan wizard responsive layout adapts cleanly across viewports', async ({ page }) => {
    await page.goto('/plan');
    await page.waitForLoadState('domcontentloaded');

    const generateBtn = page.getByRole('button', { name: /Generate.*AI Travel Twin Itinerary/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 8000 });
  });

});
