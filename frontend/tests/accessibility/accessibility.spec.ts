import { test, expect } from '../helpers/test-base';

test.describe('Accessibility, Themes & Localization Suite', () => {

  test('dark mode theme toggle updates document root and persists in storage', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Profile dropdown menu toggle is optimized for desktop viewports');

    await page.goto('/');

    // Open profile menu
    const profileBtn = page.getByTitle(/Profile and Navigation Menu/i).first();
    await profileBtn.click();

    // Locate Dark Theme toggle button
    const themeBtn = page.getByRole('button', { name: /Enable|Disable/i }).first();
    await expect(themeBtn).toBeVisible();

    const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Toggle theme
    await themeBtn.click();
    await page.waitForTimeout(300);

    const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDarkAfter).not.toBe(isDarkInitially);

    // Verify localStorage key
    const storedVal = await page.evaluate(() => localStorage.getItem('travelsathi_dark'));
    expect(storedVal).not.toBeNull();
  });

  test('bhashini language selector updates platform language setting', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Language select dropdown is inside desktop profile menu');

    await page.goto('/');

    const profileBtn = page.getByTitle(/Profile and Navigation Menu/i).first();
    await profileBtn.click();

    const langSelect = page.locator('select').filter({ hasText: /English|हिन्दी/i }).first();
    await expect(langSelect).toBeVisible();

    // Change to Hindi
    await langSelect.selectOption({ value: 'hi' });

    // Verify localStorage key updated
    const storedLang = await page.evaluate(() => localStorage.getItem('travelsathi_lang'));
    expect(storedLang).toBe('hi');
  });

});
