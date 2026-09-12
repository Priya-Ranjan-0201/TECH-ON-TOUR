import { test, expect } from '@playwright/test';

test.describe('E2E Persistence Across Places and Refreshes', () => {

  test('Travel Twin preferences persist across page reloads', async ({ page }) => {
    // Navigate to Travel Twin route
    await page.goto('http://localhost:5173/travel-twin');
    await page.waitForSelector('form', { state: 'visible', timeout: 10000 });

    // Change Travel Style
    const styleSelect = page.locator('select').first();
    await styleSelect.selectOption('Living Heritage & Arts');

    // Change Pace
    const paceSelect = page.locator('select').nth(4);
    await paceSelect.selectOption('Intensive Sightseeing');

    // Fill Accessibility
    const accessInput = page.locator('input[placeholder*="Wheelchair ramp"]');
    await accessInput.fill('Step-free ground floor room required');

    // Click Save & Calibrate
    const saveBtn = page.getByRole('button', { name: /Save & Calibrate Travel Twin/i });
    await saveBtn.click();

    // Verify toast appears
    await expect(page.locator('text=Travel Twin preferences successfully saved and calibrated')).toBeVisible({ timeout: 5000 });

    // Verify dynamic inferences updated
    await expect(page.locator('text=Prioritizes historic monuments, living crafts & architectural marvels')).toBeVisible();

    // RELOAD PAGE (F5)
    await page.reload();
    await page.waitForSelector('form', { state: 'visible', timeout: 10000 });

    // Verify persisted state after refresh!
    await expect(styleSelect).toHaveValue('Living Heritage & Arts');
    await expect(paceSelect).toHaveValue('Intensive Sightseeing');
    await expect(accessInput).toHaveValue('Step-free ground floor room required');
    await expect(page.locator('text=Prioritizes historic monuments, living crafts & architectural marvels')).toBeVisible();
  });

  test('Explore view retains search query and state in URL across refresh', async ({ page }) => {
    await page.goto('http://localhost:5173/explore?q=Goa&state=Goa');

    const mobileFilterBtn = page.locator('button:has-text("Filters (")');
    if (await mobileFilterBtn.isVisible()) {
      await mobileFilterBtn.click();
    }

    await page.waitForSelector('input[placeholder*="Destination, state, activity"]', { state: 'attached', timeout: 10000 });
    const searchInput = page.locator('input[placeholder*="Destination, state, activity"]').first();
    await expect(searchInput).toHaveValue('Goa');

    // Reload page
    await page.reload();
    if (await mobileFilterBtn.isVisible()) {
      await mobileFilterBtn.click();
    }
    await page.waitForSelector('input[placeholder*="Destination, state, activity"]', { state: 'attached', timeout: 10000 });

    // Verify search and URL remain retained!
    await expect(searchInput).toHaveValue('Goa');
    expect(page.url()).toContain('q=Goa');
  });

  test('Itinerary generation updates active trip and persists across reloads', async ({ page }) => {
    // Navigate to Plan page
    await page.goto('http://localhost:5173/plan');
    await page.waitForSelector('input[placeholder*="Manali, Tirthan Valley"]', { state: 'visible', timeout: 10000 });

    // Input destination
    const destInput = page.locator('input[placeholder*="Manali, Tirthan Valley"]');
    await destInput.fill('Goa beaches');

    // Click generate
    const generateBtn = page.getByRole('button', { name: /Generate.*AI Travel Twin Itinerary/i });
    await generateBtn.click();

    // Wait for itinerary to generate
    await expect(page.locator('text=Goa').first()).toBeVisible({ timeout: 15000 });

    // Navigate to Live Trip mode
    await page.goto('http://localhost:5173/trips/live');
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    // Verify active trip destination is now Goa!
    await expect(page.locator('text=Goa').first()).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForSelector('h1', { state: 'visible', timeout: 10000 });

    // Verify it still reflects Goa after refresh!
    await expect(page.locator('text=Goa').first()).toBeVisible();
  });

});
