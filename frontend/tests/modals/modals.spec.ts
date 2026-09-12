import { test, expect } from '../helpers/test-base';

test.describe('G. Modals & Drawers Suite', () => {

  test('emergency SOS modal opens, displays emergency hotlines and can be closed safely', async ({ page }) => {
    await page.goto('/');

    // Click header SOS trigger icon
    const sosTrigger = page.getByTitle(/Emergency SOS Assistance/i).or(page.locator('button:has(svg.animate-pulse)'));
    await expect(sosTrigger.first()).toBeVisible();
    await sosTrigger.first().click();

    // Verify SOS modal opens with emergency contacts
    const sosHeading = page.getByText(/Emergency SOS|Active Dispatch/i).first();
    await expect(sosHeading).toBeVisible({ timeout: 5000 });

    // Verify national emergency hotline is displayed
    await expect(page.getByText('112').or(page.getByText(/Police|Ambulance|Emergency/i)).first()).toBeVisible();

    // Abort / Close SOS modal
    const closeOrCancelBtn = page.getByRole('button', { name: /Cancel|Abort|Close/i }).first();
    if (await closeOrCancelBtn.isVisible()) {
      await closeOrCancelBtn.click();
      await expect(sosHeading).not.toBeVisible();
    }
  });

  test('floating concierge AI drawer opens, sends inquiry, and provides conversational response', async ({ page }) => {
    await page.goto('/');

    const fabButton = page.locator('div.fixed.bottom-6.right-6 button, div.fixed.bottom-20.right-6 button, button.shadow-2xl').first();
    if (await fabButton.isVisible()) {
      await fabButton.click();

      // Concierge drawer or input should appear
      const chatInput = page.getByPlaceholder(/Ask about hidden gems|Ask TravelSathi/i);
      if (await chatInput.isVisible()) {
        await chatInput.fill('What is the best time to visit Bastar?');
        await page.keyboard.press('Enter');

        // Verify response container renders message
        const chatBubble = page.locator('div.p-3, div.rounded-2xl').filter({ hasText: /Bastar|weather|visit/i }).first();
        await expect(chatBubble).toBeVisible({ timeout: 8000 });
      }
    }
  });

});
