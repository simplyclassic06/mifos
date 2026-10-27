const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');

test('TC-L01 Login Page loads',{ tag: ['@smoke', '@prod-safe'] }, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/#\/login/);
    await expect(page).toHaveTitle('Login');
    await expect(page.getByRole('heading', { name: 'Mifos® X WebApp' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled();
});

test('TC-L02 Valid Login',{ tag: ['@smoke', '@regression', '@prod-safe'] }, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.APP_USER);
    await page.getByRole('textbox', { name: 'Password' }).fill(process.env.APP_PASS);
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
    await page.getByRole('button', { name: 'Login' }).click();

    const warning = page.getByRole('dialog').filter({ hasText: 'authorized use only' });
    await expect(warning).toBeVisible({ timeout: 15000 });   // waits for login
    await warning.getByRole('button', { name: 'Close' }).click();
    await expect(warning).toBeHidden();

    await expect(page).toHaveURL(/#\/home/);
    await expect(page.getByText('Welcome mifos to Default!')).toBeVisible();
});

test('TC-L10 Logout',{ tag: ['@smoke', '@regression', '@prod-safe'] }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.APP_USER, process.env.APP_PASS);
    await loginPage.closeWarning();

    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    // confirmation dialog added to the app after 14 Oct
    const signOut = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to log out?' });
    await signOut.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/#\/login/);

    // after logout, home must not open without login
    await page.goto('/#/home');
    await expect(page).toHaveURL(/#\/login\?returnUrl=%2Fhome/);
});

test('TC-L07 Wrong password',{ tag: ['@regression'] }, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.APP_USER);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpass123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Incorrect username or password. Please check your credentials and try again.'))
        .toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('');
    await expect(page.getByRole('textbox', { name: 'Password' })).toHaveValue('');
});

test('TC-L04+L05 Required fields',{ tag: ['@regression', '@prod-safe'] }, async ({ page }) => {
    await page.goto('/');
    const username = page.getByRole('textbox', { name: 'Username' });
    const password = page.getByRole('textbox', { name: 'Password' });

    // touch both fields and leave them empty
    await username.click();
    await password.click();
    await username.click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required (min length 8)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled();
});

test('TC-L03 Login disabled when fields are empty', { tag: '@prod-safe' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.username).toHaveValue('');
    await expect(loginPage.password).toHaveValue('');
    await expect(loginPage.loginButton).toBeDisabled();
});

test('TC-L08 Unknown username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('nouser123', 'password123');

    await expect(page.getByText('Incorrect username or password. Please check your credentials and try again.'))
        .toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/#\/login/);
});

test('TC-L06 Password shorter than 8 characters', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: message says "Password is required" instead of mentioning the 8-character minimum');
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.username.fill(process.env.APP_USER);
    await loginPage.password.fill('abc');

    await expect(loginPage.loginButton).toBeDisabled();
    await expect(page.getByText(/min length 8/)).toBeVisible({ timeout: 5000 });
});

test('TC-L09 Show / hide password', { tag: '@prod-safe' }, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.password.fill('password');
    await expect(loginPage.password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(loginPage.password).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(loginPage.password).toHaveAttribute('type', 'password');
});
