import { test, expect } from '../helpers/test-base';

test.describe('B. Route & Navigation Suite', () => {

  test('navbar brand logo navigates to homepage from sub-routes', async ({ page }) => {
    await page.goto('/explore');
    await expect(page).toHaveURL(/\/explore/);

    const logoLink = page.getByRole('link', { name: /TravelSathi/i }).first();
    await expect(logoLink).toBeVisible();
    await logoLink.click();

    await expect(page).toHaveURL(/\/$/);
  });

  test('desktop primary navigation links work correctly', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop navbar links are hidden on mobile viewports');

    await page.goto('/');

    // Plan Trip Link
    const planTripLink = page.getByRole('link', { name: 'Plan Trip' }).first();
    await planTripLink.click();
    await expect(page).toHaveURL(/\/plan/);

    // My Trips Link
    const myTripsLink = page.getByRole('link', { name: 'My Trips' }).first();
    await myTripsLink.click();
    await expect(page).toHaveURL(/\/trips/);

    // Home Link
    const homeLink = page.getByRole('link', { name: 'Home' }).first();
    await homeLink.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('mobile bottom navigation bar functions on mobile viewports', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile bottom bar is only rendered on mobile viewports');

    await page.goto('/');

    const mobileNav = page.locator('nav.fixed.bottom-0');
    await expect(mobileNav).toBeVisible();

    // Tap Explore / Search
    await mobileNav.getByRole('link', { name: /Search|Explore/i }).click();
    await expect(page).toHaveURL(/\/explore/);

    // Tap Trips
    await mobileNav.getByRole('link', { name: /Trips/i }).click();
    await expect(page).toHaveURL(/\/trips/);

    // Tap Home
    await mobileNav.getByRole('link', { name: /Home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('safe smoke test across core public routes', async ({ page, monitor }) => {
    const publicRoutes = [
      '/explore',
      '/planner',
      '/experiences',
      '/homestays',
      '/crowd',
      '/community',
      '/profile',
      '/auth'
    ];

    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();
    }

    expect(monitor.pageErrors.length).toBe(0);
  });

  test('safe smoke test across tourist exploration panels', async ({ page, monitor }) => {
    const panels = [
      '/dashboard',
      '/nearby',
      '/trending',
      '/seasonal',
      '/twin',
      '/hidden-gems',
      '/audio-guides',
      '/offline-pass',
      '/ai-assistant',
      '/emergency',
      '/history',
      '/group-trip',
      '/saved'
    ];

    for (const panel of panels) {
      await page.goto(panel);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();
    }

    expect(monitor.pageErrors.length).toBe(0);
  });

  test('catch-all route gracefully redirects unknown URLs to homepage', async ({ page }) => {
    await page.goto('/unknown-nonexistent-route-404');
    await expect(page).toHaveURL(/\/$/);
  });

  test('footer contains working legal and portal links', async ({ page }) => {
    await page.goto('/');

    const privacyLink = page.getByRole('link', { name: /Privacy Center|Privacy Policy/i }).first();
    await expect(privacyLink).toBeVisible();
    await privacyLink.click();
    await expect(page).toHaveURL(/\/privacy/);
  });

});
