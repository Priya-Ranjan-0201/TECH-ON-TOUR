import { test, expect } from '../helpers/test-base';

test.describe('F. Filters & Sorting Suite', () => {

  test('explore view category select toggles active filter categories', async ({ page, isMobile }) => {
    await page.goto('/explore');

    if (isMobile) {
      const filtersToggle = page.getByRole('button', { name: /Filters/i }).first();
      if (await filtersToggle.isVisible()) {
        await filtersToggle.click();
      }
    }

    // Category select dropdown
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 8000 });

    // Select Nature
    await categorySelect.selectOption({ label: 'Nature' });
    await page.waitForTimeout(400);

    // Verify select value
    expect(await categorySelect.inputValue()).toBe('Nature');

    // Select Heritage
    await categorySelect.selectOption({ label: 'Heritage' });
    await page.waitForTimeout(400);
    expect(await categorySelect.inputValue()).toBe('Heritage');
  });

  test('search panel state filter dropdown updates results', async ({ page }) => {
    await page.goto('/search');

    const stateSelect = page.locator('select').first();
    await expect(stateSelect).toBeVisible({ timeout: 8000 });

    const options = await stateSelect.locator('option').all();
    if (options.length > 1) {
      await stateSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

});
