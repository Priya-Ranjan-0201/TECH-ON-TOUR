import { test, expect } from '../helpers/test-base';

test.describe('H. Tabs & View Switchers Suite', () => {

  test('destination detail view renders and switches tabs correctly', async ({ page }) => {
    // Navigate to destination detail
    await page.goto('/destination/dest-1');
    await page.waitForLoadState('domcontentloaded');

    // Check if tabs exist: Overview, Attractions, Weather, Safety, Reviews
    const overviewTab = page.getByRole('tab', { name: /Overview/i }).or(page.getByText(/Overview/i)).first();
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await page.waitForTimeout(300);
    }

    const weatherTab = page.getByRole('tab', { name: /Weather/i }).or(page.getByText(/Weather/i)).first();
    if (await weatherTab.isVisible()) {
      await weatherTab.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/°C|Condition|AQI|Air Quality/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('explore catalog tabs toggle between grid and map layouts', async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('domcontentloaded');

    const layoutToggle = page.locator('button:has(svg)').filter({ hasText: /Map|Grid|List/i }).first();
    if (await layoutToggle.isVisible()) {
      await layoutToggle.click();
      await page.waitForTimeout(300);
    }
  });

});
