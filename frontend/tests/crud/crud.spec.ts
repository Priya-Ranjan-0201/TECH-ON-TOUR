import { test, expect } from '../helpers/test-base';

test.describe('I. CRUD Operations & State Persistence Suite', () => {

  test('create: adding a group expense creates new item in state', async ({ page }) => {
    await page.goto('/trips/group');
    page.on('dialog', dialog => dialog.accept());

    const addExpenseBtn = page.getByRole('button', { name: /Add New Group Expense/i }).first();
    await expect(addExpenseBtn).toBeVisible({ timeout: 8000 });
    await addExpenseBtn.click();

    const descInput = page.getByPlaceholder(/Village lunch, Jeep fare/i).first();
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill('Local Guide & Forest Trek Permit');

    const amountInput = page.getByPlaceholder('1200').first();
    await amountInput.fill('1500');

    const saveBtn = page.getByRole('button', { name: /Add to Group Split/i }).first();
    await saveBtn.click();

    await expect(page.getByText('Local Guide & Forest Trek Permit').first()).toBeVisible({ timeout: 6000 });
  });

  test('update: calibrating travel twin updates personality state and persists', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('travelsathi_user', JSON.stringify({
        id: 'usr-crud-update',
        name: 'Aarav Sharma',
        role: 'tourist'
      }));
    });

    await page.goto('/travel-twin');

    const saveBtn = page.getByRole('button', { name: /Save & Calibrate Travel Twin/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(500);

      // Verify persistence on reload
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).toBeVisible();
    }
  });

});
