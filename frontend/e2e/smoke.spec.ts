import { test, expect } from '@playwright/test';

async function waitForBootstrap(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByAltText('Loading')).toHaveCount(0, { timeout: 15000 });
}

test.describe('public shell', () => {
  test('landing and login pages load', async ({ page }) => {
    await page.goto('/');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { level: 1, name: /project 360/i })).toBeVisible();

    await page.goto('/login');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });
});
 