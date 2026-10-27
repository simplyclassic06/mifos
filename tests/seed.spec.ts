import { test } from '@playwright/test';

test('seed', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Username').fill(process.env.APP_USER!);
  await page.getByLabel('Password').fill(process.env.APP_PASS!);
  await page.getByRole('button', { name: 'Login' }).click();
});