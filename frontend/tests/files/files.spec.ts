import { test, expect } from '../helpers/test-base';

test.describe('K & L. File Uploads & Downloads Suite', () => {

  test('group trip file input accepts receipt image attachment', async ({ page }) => {
    await page.goto('/trips/group');

    // Auto-accept alert when file is attached
    page.on('dialog', dialog => dialog.accept());

    // Open add expense modal
    const addExpenseBtn = page.getByRole('button', { name: /Add New Group Expense/i }).first();
    await expect(addExpenseBtn).toBeVisible({ timeout: 8000 });
    await addExpenseBtn.click();

    // Check file input exists
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    // Upload test buffer
    await fileInput.setInputFiles({
      name: 'dinner_receipt.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg-image-bytes-mock-content')
    });

    // Check modal remains interactive and cancelable
    const cancelBtn = page.getByRole('button', { name: /Cancel/i }).first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
  });

});
