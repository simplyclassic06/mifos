const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { ClientsPage } = require('../../pages/ClientsPage');
const { ClientDetailsPage } = require('../../pages/ClientDetailsPage');
const { createClient, today } = require('../../api/ClientApi');

test.describe.configure({ mode: 'default', timeout: 60000 });

const CLOSED_CLIENT_ID = 91; // demo data: "Mercy Akinyi", status Closed
const stamp = Date.now();
let active;
let pending;

test.beforeAll(async ({ playwright }, testInfo) => {
    const request = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
    active = await createClient(request, { firstname: 'Viewactive', lastname: `Qa${stamp}`, externalId: `ext-view-${stamp}`, active: true });
    pending = await createClient(request, { firstname: 'Viewpending', lastname: `Qa${stamp}` });
    await request.dispose();
});

test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('mifos', 'password');
    await loginPage.closeWarning();
});

test('TC-25 Active client details', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    // open it the way a user does: search → click the row
    const clients = new ClientsPage(page);
    await clients.goto();
    await clients.search(active.displayName);
    await clients.row(active.displayName).click();

    const details = new ClientDetailsPage(page);
    await expect(page).toHaveURL(new RegExp(`#/clients/${active.id}/general`));
    await expect(details.heading).toContainText(active.displayName);
    await expect(details.heading).toContainText(/Active/i);
    await expect(details.field('Office')).toHaveText('Head Office');
    await expect(details.field('Account No.')).toHaveText(active.accountNo);
    await expect(details.field('External Id')).toHaveText(active.externalId);
    await expect(details.field('Activation Date')).toHaveText(today());
    await expect(details.field('Staff')).toHaveText('Unassigned');

    for (const tab of ['General', 'Personal Data', 'Address', 'Family Members', 'Identities', 'Documents', 'Notes', 'Enrollment Status']) {
        await expect(details.tab(tab)).toBeVisible();
    }
    await expect(details.tab('General')).toHaveAttribute('aria-selected', 'true');
});

test('TC-26 Pending client details', { tag: '@regression' }, async ({ page }) => {
    const details = new ClientDetailsPage(page);
    await details.goto(pending.id);

    await expect(details.heading).toContainText(pending.displayName);
    await expect(details.heading).toContainText(/Pending/i);
    await expect(details.fieldLabel('Activation Date')).toHaveCount(0);
});

test('TC-27 Closed client details', { tag: '@regression' }, async ({ page }) => {
    const details = new ClientDetailsPage(page);
    await details.goto(CLOSED_CLIENT_ID);

    await expect(details.heading).toContainText(/Closed/i);
});

test('TC-28 Actions menu for a pending client', { tag: '@regression' }, async ({ page }) => {
    const details = new ClientDetailsPage(page);
    await details.goto(pending.id);

    await details.actionsButton.click();
    for (const item of ['Edit', 'Actions', 'Assign Staff', 'More']) {
        await expect(details.menuItem(item)).toBeVisible();
    }

    await details.menuItem('Actions').click();
    for (const item of ['Close', 'Transfer Client', 'Activate', 'Withdraw', 'Reject', 'Delete']) {
        await expect(details.menuItem(item)).toBeVisible();
    }
});

test('TC-29 Invalid client id shows a clear not-found message', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: toast says "valuer" and the app silently loads the previously viewed client');
    const details = new ClientDetailsPage(page);
    await details.goto(pending.id); // view a real client first

    await page.goto('/#/clients/999999/general');
    await expect(page.getByText(/Client not found/)).toBeVisible();
    await expect(page.getByText(/valuer/)).toHaveCount(0);
    await expect(page).not.toHaveURL(new RegExp(`#/clients/${pending.id}/`), { timeout: 5000 });
});

test('TC-30 Page title follows the page', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: title stays "Client Actions" after leaving a client action page');
    await page.goto(`/#/clients/${pending.id}/actions/Activate`);
    await expect(page).toHaveTitle('Client Actions');

    const clients = new ClientsPage(page);
    await clients.goto();
    await expect(page).not.toHaveTitle('Client Actions', { timeout: 5000 });
});
