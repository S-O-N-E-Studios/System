import { test, expect } from '@playwright/test';

async function waitForBootstrap(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
}

test.describe('public shell', () => {
  test('landing and login pages load', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { level: 1, name: /evidentiary/i })).toBeVisible();

    await page.goto('/login');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
 