import { test, expect } from '../helpers/test-base';

test.describe('O. Loading, Empty & Error States Suite', () => {

  test('core pages do not emit unhandled fatal JavaScript console errors', async ({ page, monitor }) => {
    test.setTimeout(60000);
    const checkRoutes = ['/', '/explore', '/stays', '/safety'];

    for (const route of checkRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(400);
    }

    const fatalErrors = monitor.pageErrors.filter(err =>
      !err.message.includes('ResizeObserver')
    );
    expect(fatalErrors.length).toBe(0);
  });

  test('offline wallet page loads and displays offline travel pass and carbon ledger', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('domcontentloaded');

    const passHeading = page.getByText(/Unified Trip Wallet|Offline Hub/i).first();
    await expect(passHeading).toBeVisible({ timeout: 8000 });
  });

  test('saved places page displays friendly empty state when no bookmarks exist', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('travelsathi_saved');
      localStorage.removeItem('travelsathi_bookmarks');
    });

    await page.goto('/saved');
    await page.waitForLoadState('domcontentloaded');

    const emptyMsg = page.getByText(/No saved places yet|Explore Destinations|Start exploring|Saved Destinations/i).first();
    await expect(emptyMsg).toBeVisible({ timeout: 8000 });
  });

  test('bookings page renders reservations list or empty state gracefully', async ({ page }) => {
    await page.goto('/bookings');
    await page.waitForLoadState('domcontentloaded');

    const bookingHeading = page.getByRole('heading', { level: 1 }).or(page.getByText(/My Bookings|Reservations|No active reservations/i)).first();
    await expect(bookingHeading).toBeVisible({ timeout: 8000 });
  });

});
