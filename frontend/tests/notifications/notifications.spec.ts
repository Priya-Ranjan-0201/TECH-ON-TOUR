import { test, expect } from '../helpers/test-base';

test.describe('N. Notifications & Alerts Suite', () => {

  test('notifications view loads and displays alerts', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('domcontentloaded');

    // Check heading or empty state
    const heading = page.getByRole('heading', { name: /Notification|Alert/i }).or(page.getByText(/Notification|Alert/i)).first();
    await expect(heading).toBeVisible();
  });

});
