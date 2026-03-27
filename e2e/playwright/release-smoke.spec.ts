import { test, expect } from '@playwright/test';

test.describe('MySeedBook release smoke @smoke', () => {
  test('auth screen renders with guest option', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText(/Continue as Guest/i)).toBeVisible();
  });

  test('add-seed screen shows required input controls', async ({ page }) => {
    await page.goto('/add-seed');
    await expect(page.getByPlaceholder(/Brandywine Tomato/i)).toBeVisible();
    await expect(page.getByText(/Add Seed|Save Changes/i)).toBeVisible();
  });

  test('calendar opens add-event modal from add button', async ({ page }) => {
    await page.goto('/calendar');
    const addEventButton = page.getByText('Add Event').first();
    await expect(addEventButton).toBeVisible();
    await addEventButton.click();
    await expect(page.getByText(/Add Event/i).first()).toBeVisible();
  });
});
