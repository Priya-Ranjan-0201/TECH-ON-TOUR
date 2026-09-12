import { test, expect } from '../helpers/test-base';

test.describe('E. Forms, Inputs & Form Validation Suite', () => {

  test('plan wizard fills form fields and triggers multi-day itinerary generation', async ({ page }) => {
    await page.goto('/plan');

    // Fill destination
    const destinationInput = page.getByPlaceholder(/Manali, Tirthan Valley|Where do you want to go/i).first();
    await expect(destinationInput).toBeVisible({ timeout: 8000 });
    await destinationInput.fill('Manali');

    // Select 3 Days duration
    const threeDaysBtn = page.getByRole('button', { name: /^3 Days$/i }).first();
    if (await threeDaysBtn.isVisible()) {
      await threeDaysBtn.click();
    }

    // Click Generate Plan
    const generateBtn = page.getByRole('button', { name: /Generate.*AI Travel Twin Itinerary/i }).first();
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    // Verify loading or generated itinerary days appear
    const dayHeading = page.getByText(/Day 1|Crafting|Itinerary/i).first();
    await expect(dayHeading).toBeVisible({ timeout: 15000 });
  });

  test('group trip page allows logging new expense and triggers UPI settle ping', async ({ page }) => {
    await page.goto('/trips/group');

    // Handle window.alert gracefully
    page.on('dialog', dialog => dialog.accept());

    // Locate Add Expense trigger
    const addExpenseBtn = page.getByRole('button', { name: /Add New Group Expense/i }).first();
    await expect(addExpenseBtn).toBeVisible({ timeout: 8000 });
    await addExpenseBtn.click();

    // Fill Expense modal fields
    const descInput = page.getByPlaceholder(/Village lunch, Jeep fare/i).first();
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill('Bonfire & Kathkuni Dinner');

    const amountInput = page.getByPlaceholder('1200').first();
    await amountInput.fill('2400');

    // Save expense
    const saveBtn = page.getByRole('button', { name: /Add to Group Split/i }).first();
    await saveBtn.click();

    // Verify new expense is visible in the list
    await expect(page.getByText('Bonfire & Kathkuni Dinner').first()).toBeVisible({ timeout: 6000 });

    // Click Send UPI Settle Ping
    const settlePingBtn = page.getByRole('button', { name: /Send UPI Settle Ping/i }).first();
    if (await settlePingBtn.isVisible()) {
      await settlePingBtn.click();

      // Verify settlement ping toast appears
      const toast = page.getByText(/Settlement link dispatched|Payment Ping Sent/i).first();
      await expect(toast).toBeVisible({ timeout: 6000 });
    }
  });

  test('travel twin preferences form saves customized travel personality', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-forms-calibration',
        name: 'Aarav Sharma',
        role: 'tourist'
      }));
    });

    await page.goto('/travel-twin');

    // Change Preferred Daily Pace select
    const paceSelect = page.locator('select').filter({ hasText: /Unrushed|Balanced/i }).first();
    if (await paceSelect.isVisible()) {
      await paceSelect.selectOption({ index: 1 });
    }

    // Click Save Preferences
    const saveBtn = page.getByRole('button', { name: /Save & Calibrate Travel Twin/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    
    // Check feedback toast immediately before 3.5s auto-dismiss
    const toast = page.getByText(/Travel Twin preferences successfully saved/i).first();
    await saveBtn.click();
    await expect(toast).toBeVisible({ timeout: 15000 });
  });

});
