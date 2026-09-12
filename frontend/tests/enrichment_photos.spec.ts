import { test, expect } from '@playwright/test';

test.describe('Place Photos & Summary Enrichment Validation', () => {

  test('Destination detail page renders verified research summary & attribution badge', async ({ page }) => {
    // Navigate to India Gate (id: 11492)
    await page.goto('http://localhost:5173/destination/11492');
    await page.waitForLoadState('domcontentloaded');

    // Check Destination Title (allow sufficient time for parallel backend resolution)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });

    // Verify Summary section or About section is rendered
    await expect(page.getByRole('heading', { name: 'About India Gate' })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Wikipedia Verified').first()).toBeVisible();
    await expect(page.getByText('Research & Heritage Summary').first()).toBeVisible();

    // Verify photo or Theme 1 container is rendered
    const photoContainer = page.locator('div.relative.h-\\[320px\\]').or(page.locator('div.relative.h-\\[400px\\]')).first();
    await expect(photoContainer).toBeVisible();

    // Check for Attribution badge
    const badge = page.locator('text=Photo: Wikipedia').or(page.locator('text=Photo: Wikimedia Commons')).or(page.locator('text=Theme 1 Grounded')).first();
    await expect(badge).toBeVisible();
  });

  test('Explore page handles placeholder destinations with Theme 1 solid-color fallback', async ({ page }) => {
    await page.goto('http://localhost:5173/explore');
    await page.waitForLoadState('domcontentloaded');

    // Verify destination cards or placeholders load
    const card = page.locator('div.group.cursor-pointer').first();
    await expect(card).toBeVisible({ timeout: 15000 });

    // Verify Theme 1 container or verified image is rendered within card
    const cardVisual = page.locator('div[class*="aspect-\\[16\\/10\\]"]').first();
    await expect(cardVisual).toBeVisible();

    // Verify zero broken images across the rendered DOM
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => img.complete && img.naturalWidth === 0 && !img.src.includes('data:image')).length;
    });
    expect(brokenImages).toBe(0);
  });

});

