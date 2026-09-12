import { test, expect } from '@playwright/test';

test.describe('Panel Isolation & Client-Side Route Guards', () => {

  test('Tourist persona blocked from /admin and redirected to /explore', async ({ page }) => {
    // Set localStorage role to tourist
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_role', 'tourist');
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-901',
        name: 'Aarav Sharma',
        role: 'tourist',
        email: 'aarav.sharma@travelsathi.in'
      }));
    });

    await page.goto('http://localhost:5173/admin');
    await page.waitForURL('**/explore', { timeout: 8000 });
    expect(page.url()).toContain('/explore');
  });

  test('Tourist persona blocked from /host and redirected to /explore', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_role', 'tourist');
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-901',
        name: 'Aarav Sharma',
        role: 'tourist',
        email: 'aarav.sharma@travelsathi.in'
      }));
    });

    await page.goto('http://localhost:5173/host');
    await page.waitForURL('**/explore', { timeout: 8000 });
    expect(page.url()).toContain('/explore');
  });

  test('Host persona successfully accesses /host panel without redirection', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_role', 'host');
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-host-1',
        name: 'Sunil Thakur',
        role: 'host',
        email: 'sunil.thakur@pineshade.in'
      }));
    });

    await page.goto('http://localhost:5173/host');
    await expect(page).toHaveURL(/.*\/host/);
    await expect(page.locator('text=Host & Business Command Center').or(page.locator('text=Host Operations')).or(page.locator('text=Host Dashboard')).first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin persona accesses /admin control center and sees moderation queue', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_role', 'admin');
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-admin-1',
        name: 'Chief Security Officer',
        role: 'admin',
        email: 'admin.ops@travelsathi.gov.in'
      }));
    });

    await page.goto('http://localhost:5173/admin');
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('text=Platform Health').or(page.locator('text=Control Center')).or(page.locator('text=Homestay Registry')).first()).toBeVisible({ timeout: 10000 });
  });

  test('Full walkthrough produces zero console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected network connection aborts if test closes early
        if (!text.includes('net::ERR_ABORTED') && !text.includes('favicon.ico')) {
          consoleErrors.push(text);
        }
      }
    });

    // Walk through core views
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(500);

    await page.goto('http://localhost:5173/explore');
    await page.waitForTimeout(500);

    await page.goto('http://localhost:5173/weather');
    await page.waitForTimeout(500);

    await page.goto('http://localhost:5173/trending');
    await page.waitForTimeout(500);

    expect(consoleErrors).toEqual([]);
  });

});
