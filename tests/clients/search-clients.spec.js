const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { ClientsPage } = require('../../pages/ClientsPage');
const { createClient } = require('../../api/ClientApi');

// one worker runs this file in order, so beforeAll creates the test data only once
test.describe.configure({ mode: 'default', timeout: 60000 });

const stamp = Date.now();
let seed;     // normal client: name, external id, mobile, account no
let unicode;  // client with non-English letters

test.beforeAll(async ({ playwright }, testInfo) => {
    const request = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
    seed = await createClient(request, {
        firstname: 'Searchseed',
        lastname: `Qa${stamp}`,
        externalId: `ext-qa-${stamp}`,
        mobileNo: `9${String(stamp).slice(-9)}`,
        active: true,
    });
    unicode = await createClient(request, { firstname: 'Zoë', lastname: `Ünicode${stamp}` });
    await request.dispose();
});

test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('mifos', 'password');
    await loginPage.closeWarning();
});

test('TC-10 Clients list default view', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();

    await expect(clients.searchBox).toBeVisible();
    await expect(clients.showClosed).toBeVisible();
    await expect(clients.importClientLink).toBeVisible();
    await expect(clients.createClientLink).toBeVisible();
    for (const column of ['Name', 'Account No.', 'External Id']) {
        await expect(page.getByRole('button', { name: column, exact: true })).toBeVisible();
    }
    await expect(page.getByText('Office Name', { exact: true })).toBeVisible();
    await expect(clients.pageInfo).toBeVisible();
    await expect(clients.nextPage).toBeVisible();
});

test('TC-11 Search by full name', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();
    await clients.search(seed.displayName);

    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
    await expect(clients.clearSearch).toBeVisible();
});

test('TC-12 Search is case-insensitive', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(seed.displayName.toLowerCase());
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);

    await clients.search(seed.lastname.toUpperCase());
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
});

test('TC-13 Search by partial name', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();
    await clients.search(seed.lastname.slice(0, -3)); // drop the last 3 characters

    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
});

test('TC-14 Search by external id (full and partial)', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(seed.externalId);
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);

    await clients.search(seed.externalId.slice(-8));
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
});

test('TC-15 Search by account number', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(seed.accountNo);
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);

    await clients.search(seed.accountNo.replace(/\D/g, '')); // numeric part only
    await expect(clients.row(seed.displayName)).toBeVisible();
    await expect(clients.paginator).toContainText(/1–\d\s*of\s*\d\b/); // filtered to a few clients
});

test('TC-16 Search by mobile number (full and partial)', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(seed.mobileNo);
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);

    await clients.search(seed.mobileNo.slice(-7)); // last 7 digits
    await expect(clients.row(seed.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
});

test('TC-17 Search with non-English letters', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();
    await clients.search(unicode.lastname);

    await expect(clients.row(unicode.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
});

test('TC-18 No results message', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();
    await clients.search(`zzzz-nomatch-${stamp}`);

    await expect(clients.noResults).toBeVisible();
});

test('TC-19 Special characters do not break search', { tag: '@regression' }, async ({ page }) => {
    let dialogOpened = false;
    page.on('dialog', async dialog => { dialogOpened = true; await dialog.dismiss(); });

    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(`O'Brien${stamp}`);
    await expect(clients.noResults).toBeVisible();

    await clients.search(`<script>alert(${stamp})</script>`);
    await expect(clients.noResults).toBeVisible();
    expect(dialogOpened).toBe(false); // no script ran
});

test('TC-20 % and _ are treated as normal characters', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: % and _ act as SQL wildcards and return every client');
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search('%');
    await expect(clients.noResults).toBeVisible({ timeout: 5000 });
});

test('TC-21 Spaces around the search term are ignored', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: search term is not trimmed');
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(`   ${seed.displayName}   `);
    await expect(clients.paginator).toContainText(/1–1\s*of\s*1\b/, { timeout: 5000 });
});

test('TC-22 Default page size matches the Rows selector', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: selector shows 25 but 50 rows are displayed');
    const clients = new ClientsPage(page);
    await clients.goto();

    await expect(clients.rowsPerPage).toHaveValue('25');
    await expect(clients.paginator).toContainText(/1–25\s*of/, { timeout: 5000 });
});

test('TC-23 Pagination and page size', { tag: '@regression' }, async ({ page }) => {
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.nextPage.click();
    await expect(clients.pageInfo).toHaveText(/Page 2 of \d+/);

    await clients.lastPage.click();
    await expect(clients.pageInfo).toHaveText(/Page (\d+) of \1\b/);
    await expect(clients.nextPage).toBeDisabled();

    await clients.rowsPerPage.selectOption('100');
    await expect(clients.paginator).toContainText(/1–100\s*of/);

    await clients.rowsPerPage.selectOption('25');
    await expect(clients.paginator).toContainText(/1–25\s*of/);
    await expect(clients.pageInfo).toHaveText(/Page 1 of \d+/);
});

test('TC-24 Closed clients hidden unless Show Closed Accounts is ticked', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: closed clients are listed even when Show Closed Accounts is unticked');
    const clients = new ClientsPage(page);
    await clients.goto();
    await expect(clients.showClosed).not.toBeChecked();

    await clients.search('Mercy Akinyi'); // demo data: closed client (id 91)
    await expect(clients.noResults).toBeVisible({ timeout: 5000 });
});
