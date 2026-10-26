import { test } from '@playwright/test';

test('seed', async ({ page }) => {
  await page.goto('https://demo.mifos.community');
  await page.getByLabel('Username').fill('mifos');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
});