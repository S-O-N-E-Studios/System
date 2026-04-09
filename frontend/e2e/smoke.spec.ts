import { test, expect } from '@playwright/test';

test.describe('public shell', () => {
  test('landing and login pages load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /project 360/i })).toBeVisible();

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
 