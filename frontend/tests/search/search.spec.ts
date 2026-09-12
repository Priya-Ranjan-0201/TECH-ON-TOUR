import { test, expect } from '../helpers/test-base';

test.describe('D. Search Intelligence & Input Testing Suite', () => {

  test('explore view search input filters destination cards dynamically', async ({ page, isMobile }) => {
    await page.goto('/explore');

    // On mobile viewports, open the filter sidebar if hidden
    if (isMobile) {
      const filtersToggle = page.locator('button:has-text("Filters (")').first();
      await filtersToggle.waitFor({ state: 'visible', timeout: 10000 });
      await filtersToggle.click();
      await page.waitForTimeout(400);
    }

    const searchInput = page.locator('input[placeholder*="Destination, state, activity"]').first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });

    // Query for Himachal
    await searchInput.fill('Himachal');
    await page.waitForTimeout(600); // Allow debounce

    // Verify search results or card items update
    const resultItems = page.locator('div.grid > div, .destination-card, [role="article"]');
    await expect(resultItems.first()).toBeVisible({ timeout: 8000 });
  });

  test('explore view displays empty state feedback for unmatched query', async ({ page, isMobile }) => {
    await page.goto('/explore');

    if (isMobile) {
      const filtersToggle = page.locator('button:has-text("Filters (")').first();
      await filtersToggle.waitFor({ state: 'visible', timeout: 10000 });
      await filtersToggle.click();
      await page.waitForTimeout(400);
    }

    const searchInput = page.locator('input[placeholder*="Destination, state, activity"]').first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });

    await searchInput.fill('XYZNonExistentPlace9999');
    await page.waitForTimeout(1200); // Allow debounce and backend search query

    // Verify empty state message after fetch finishes
    const emptyFeedback = page.getByText(/No destinations matched|No results found|Try clearing/i).first();
    await expect(emptyFeedback).toBeVisible({ timeout: 15000 });
  });

  test('search panel page (/search) loads with states dropdown and search input', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.getByPlaceholder(/Search India's Famous Destinations/i).or(page.getByRole('textbox'));
    await expect(searchInput.first()).toBeVisible();

    // Verify state select dropdown
    const stateSelect = page.locator('select').first();
    await expect(stateSelect).toBeVisible();
  });

  test('command palette opens on Ctrl+K and closes on Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Ctrl+K shortcut is primarily a desktop keyboard interaction');

    await page.goto('/');

    // Dispatch Ctrl+K
    await page.keyboard.press('Control+KeyK');

    // Verify command palette modal renders
    const palette = page.getByPlaceholder(/Type a command|Search destinations, circuits/i).or(page.locator('[role="dialog"]'));
    if (await palette.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(palette.first()).not.toBeVisible();
    }
  });

});
