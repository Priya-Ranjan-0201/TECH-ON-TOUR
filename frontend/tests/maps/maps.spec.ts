import { test, expect } from '../helpers/test-base';

test.describe('M. Maps & Location Features Suite', () => {

  test('smart map page renders and validates Leaflet map container', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');

    // Verify Leaflet map container is mounted and visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    // Verify map layer controls are present and interactive
    const allLayerBtn = page.getByRole('button', { name: /All/i });
    await expect(allLayerBtn.first()).toBeVisible({ timeout: 10000 });

    const hiddenGemsBtn = page.getByRole('button', { name: /Hidden Gems/i });
    await expect(hiddenGemsBtn).toBeVisible({ timeout: 5000 });
    await hiddenGemsBtn.click();

    const crowdBtn = page.getByRole('button', { name: /Crowd Warnings/i });
    await expect(crowdBtn).toBeVisible({ timeout: 5000 });
    await crowdBtn.click();
  });

});
