import { test, expect, setPersona, clearSession } from '../helpers/test-base';

test.describe('C2. Role-Based Permissions & Guarded Routes', () => {

  test('protected routes redirect unauthorized tourist users to /explore', async ({ page }) => {
    await clearSession(page);

    // Try navigating to admin control center
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/explore/);

    // Try navigating to host dashboard
    await page.goto('/host');
    await expect(page).toHaveURL(/\/explore/);

    // Try navigating to DMO intelligence
    await page.goto('/dmo');
    await expect(page).toHaveURL(/\/explore/);
  });

  test('admin role allows direct access to all protected control centers', async ({ page }) => {
    await setPersona(page, 'admin');

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText(/Super Administrator Control Center|Platform Health/i).first()).toBeVisible({ timeout: 8000 });

    await page.goto('/dmo');
    await expect(page).toHaveURL(/\/dmo/);
    await expect(page.getByText(/12,293 National POIs Monitored|B2G Analytics Engine/i).first()).toBeVisible({ timeout: 8000 });

    await page.goto('/host');
    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByText(/Host & Business Command Center|PM-JUGA Tribal Host/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('host role allows access to host dashboard and redirects from admin', async ({ page }) => {
    await setPersona(page, 'host');

    await page.goto('/host');
    await expect(page).toHaveURL(/\/host/);
    await expect(page.getByText(/Host & Business Command Center|PM-JUGA Tribal Host/i).first()).toBeVisible({ timeout: 8000 });

    // Host should NOT be allowed to access /admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/explore/);
  });

});
