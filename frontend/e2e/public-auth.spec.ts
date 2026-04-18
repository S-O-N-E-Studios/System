import { test, expect } from '@playwright/test';

async function waitForBootstrap(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
}

test.describe('public auth journeys', () => {
  test('register page loads org wizard shell', async ({ page }) => {
    await page.goto('/register');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { name: /Organisation Details/i })).toBeVisible({ timeout: 15000 });
  });

  test('invite acceptance route renders', async ({ page }) => {
    await page.goto('/invite/test-token');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { name: /accept invitation/i })).toBeVisible();
  });

  test('client activation route renders', async ({ page }) => {
    await page.goto('/client-access/test-token');
    await waitForBootstrap(page);
    await expect(page.getByRole('heading', { name: /Activate Access/i })).toBeVisible();
  });

  test('login route shows sign-in form controls', async ({ page }) => {
    await page.goto('/login');
    await waitForBootstrap(page);
    await expect(page.getByPlaceholder(/you@company.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/Enter your password/i)).toBeVisible();
  });
});

