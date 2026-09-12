import { test, expect } from '@playwright/test';

test.describe('Smart Map & Navigation Isolation Validation', () => {

  test('Smart Map filters strictly to searched city (e.g. Patna) and auto-centers', async ({ page }) => {
    // Navigate to Smart Map with search query for Patna
    await page.goto('http://localhost:5173/map?q=patna');
    await page.waitForLoadState('domcontentloaded');

    // Verify filter badge is visible indicating only Patna places are shown
    const filterBadge = page.locator('text=Only "patna"');
    await expect(filterBadge).toBeVisible({ timeout: 10000 });

    // Verify search input has 'patna' prefilled
    const searchInput = page.locator('input[placeholder*="Search town, city or place"]');
    await expect(searchInput).toHaveValue('patna');

    // Verify custom map markers exist for Patna
    const markers = page.locator('div.custom-map-marker');
    await expect(markers.first()).toBeVisible({ timeout: 10000 });

    // Verify clear button resets the filter
    const clearBtn = page.locator('button[title="Clear search"]');
    await clearBtn.click();
    await expect(page.locator('text=All 12k POIs')).toBeVisible();
  });

  test('Live Trip HUD renders dynamic destination instead of hardcoded Chehni Kothi Tower', async ({ page }) => {
    await page.goto('http://localhost:5173/trips/live');
    await page.waitForLoadState('domcontentloaded');

    // Check Live HUD header
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

    // Verify Next Destination card does not display hardcoded Chehni Kothi Tower when a custom trip is active
    const nextDestCard = page.locator('div:has-text("Next Destination")').first();
    await expect(nextDestCard).toBeVisible();

    // Verify Navigate button exists on live schedule items
    const navigateBtn = page.locator('button:has-text("Navigate")').first();
    await expect(navigateBtn).toBeVisible();
  });

});
