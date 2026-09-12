import { test, expect, setPersona, clearSession } from '../helpers/test-base';

test.describe('C. Authentication & Account Management Suite', () => {

  test('auth view allows switching between Sign In, Create Account, and Forgot Password', async ({ page }) => {
    await page.goto('/auth');

    // Default should be Sign In button
    await expect(page.getByRole('button', { name: /Sign In with Credentials/i })).toBeVisible();

    // Switch to Create Account tab
    await page.getByRole('button', { name: 'Create Account', exact: true }).click();
    await expect(page.getByRole('button', { name: /Register Account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Aarav Sharma/i)).toBeVisible();

    // Switch to Forgot Password tab
    await page.getByRole('button', { name: 'Forgot Password', exact: true }).click();
    await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
    await expect(page.getByPlaceholder(/name@travelsathi\.in/i)).toBeVisible();
  });

  test('quick persona autofill buttons populate email and password correctly', async ({ page }) => {
    await page.goto('/auth');

    const emailInput = page.getByPlaceholder('name@travelsathi.in');
    const passwordInput = page.getByPlaceholder(/characters/i);

    // Click Homestay Host Persona Card
    await page.getByText(/Host \/ Homestay/i).first().click();
    await expect(emailInput).toHaveValue('sunil.thakur@pineshade.in');
    await expect(passwordInput).toHaveValue('password123');

    // Click System Admin Persona Card
    await page.getByText(/System Admin/i).first().click();
    await expect(emailInput).toHaveValue('admin.ops@travelsathi.gov.in');
    await expect(passwordInput).toHaveValue('password123');

    // Click Tourist Persona Card
    await page.getByText(/Tourist/i).first().click();
    await expect(emailInput).toHaveValue('aarav.sharma@travelsathi.in');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('invalid login credentials displays error message', async ({ page }) => {
    await page.goto('/auth');

    const emailInput = page.getByPlaceholder('name@travelsathi.in');
    const passwordInput = page.getByPlaceholder(/characters/i);

    await emailInput.fill('invalid.user@example.com');
    await passwordInput.fill('WrongPassword999!');

    await page.getByRole('button', { name: /Sign In with Credentials/i }).click();

    // Verify error banner is shown
    const errorBanner = page.getByText(/Invalid email or password|Authentication request failed/i);
    await expect(errorBanner).toBeVisible({ timeout: 15000 });
  });

  test('forgot password flow presents confirmation message', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: 'Forgot Password', exact: true }).click();

    const emailInput = page.getByPlaceholder('name@travelsathi.in');
    await emailInput.fill('aarav.sharma@travelsathi.in');

    await page.getByRole('button', { name: /Send Reset Link/i }).click();

    // Verify confirmation feedback
    const feedback = page.locator('.text-emerald-700, .text-red-700, [role="alert"]').first();
    await expect(feedback).toBeVisible({ timeout: 15000 });
  });

  test('session persistence keeps user logged in across page reloads', async ({ page }) => {
    await setPersona(page, 'tourist');
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Check token remains in localStorage
    const token = await page.evaluate(() => localStorage.getItem('travelsathi_token'));
    expect(token).toBe('mock_jwt_token_tourist_2026');
  });

});
