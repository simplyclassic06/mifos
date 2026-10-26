const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { CreateClientPage } = require('../../pages/CreateClientPage');
const { ClientsPage } = require('../../pages/ClientsPage');
const { ClientDetailsPage } = require('../../pages/ClientDetailsPage');
const { createClient, today } = require('../../api/ClientApi');

test.describe.configure({ timeout: 60000 });

test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('mifos', 'password');
    await loginPage.closeWarning();
});

test('TC-01 Create Client form layout', { tag: '@regression' }, async ({ page }) => {
    const form = new CreateClientPage(page);
    await form.goto();

    await expect(page).toHaveTitle('Create Client');
    await expect(form.step('GENERAL')).toBeVisible();
    await expect(form.step('FAMILY MEMBERS')).toBeVisible();
    await expect(form.step('ADDRESS')).toBeVisible();

    for (const field of [form.office, form.legalForm, form.externalId, form.firstName, form.middleName,
        form.lastName, form.dateOfBirth, form.gender, form.staff, form.isStaff, form.mobileNo, form.email,
        form.clientType, form.clientClassification, form.submittedOn, form.active, form.openSavings]) {
        await expect(field).toBeVisible();
    }
    await expect(form.legalForm).toHaveText('Person');
    await expect(form.submittedOn).toHaveValue(today());
    await expect(form.previousButton('GENERAL')).toBeDisabled();
});

test('TC-02 Office dropdown lists offices', { tag: '@regression' }, async ({ page }) => {
    const form = new CreateClientPage(page);
    await form.goto();
    await form.office.click();

    for (const office of ['Head Office', 'home branch', 'BRANCH Office']) {
        await expect(page.getByRole('option', { name: office, exact: true })).toBeVisible();
    }
});

test('TC-03 Step navigation', { tag: '@regression' }, async ({ page }) => {
    const form = new CreateClientPage(page);
    await form.goto();
    await form.fillRequired({ office: 'Head Office', firstName: 'QAAuto', lastName: `Nav${Date.now()}` });

    await form.next('GENERAL');
    await expect(form.panel('FAMILY MEMBERS').getByRole('heading', { name: 'Family Members' })).toBeVisible();
    await expect(form.previousButton('FAMILY MEMBERS')).toBeEnabled();

    await form.next('FAMILY MEMBERS');
    await expect(form.panel('ADDRESS').getByRole('heading', { name: 'Address' })).toBeVisible();
    await expect(form.addAddressButton).toBeVisible();
});

test('TC-04 No address → no Preview step', { tag: '@regression' }, async ({ page }) => {
    const form = new CreateClientPage(page);
    await form.goto();
    await form.goToAddressStep({ office: 'Head Office', firstName: 'QAAuto', lastName: `NoAddr${Date.now()}` });

    await form.next('ADDRESS'); // try to leave ADDRESS without an address
    await expect(form.nextButton('ADDRESS')).toBeVisible(); // still on ADDRESS
    await expect(form.step('PREVIEW')).toHaveCount(0);
    await expect(form.submitButton).toHaveCount(0);
});

test('TC-05 Add Client Address dialog', { tag: '@regression' }, async ({ page }) => {
    const form = new CreateClientPage(page);
    await form.goto();
    await form.goToAddressStep({ office: 'Head Office', firstName: 'QAAuto', lastName: `AddrDlg${Date.now()}` });
    await form.openAddressDialog();

    const dialog = form.addressDialog;
    await expect(dialog.getByRole('heading', { name: 'Add Client Address' })).toBeVisible();
    for (const name of ['Postal Code', 'Address Line 1', 'Address Line 2', 'Address Line 3', 'City']) {
        await expect(dialog.getByRole('textbox', { name })).toBeVisible();
    }
    await expect(dialog.getByRole('combobox', { name: 'State / Province' })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Country' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Add' })).toBeDisabled(); // Address Type* not chosen

    await dialog.getByRole('combobox', { name: 'Address Type' }).click();
    await expect(page.getByRole('option', { name: 'Permanent', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'TEMPORARY', exact: true })).toBeVisible();
    await page.getByRole('option', { name: 'Permanent', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Add' })).toBeEnabled();

    await dialog.getByRole('textbox', { name: 'Address Line 1' }).fill('12 Test Street');
    await dialog.getByRole('textbox', { name: 'City' }).fill('Testville');
    await dialog.getByRole('button', { name: 'Add' }).click();
    await expect(dialog).toBeHidden();

    // the added address shows up in the PREVIEW step
    await form.goToPreview();
    await expect(form.panel('PREVIEW').getByRole('button', { name: 'Permanent' })).toBeVisible();
});

test('TC-05a Added address is listed on the Address step', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: after adding an address, the ADDRESS step shows no entry (it only appears in Preview)');
    const form = new CreateClientPage(page);
    await form.goto();
    await form.goToAddressStep({ office: 'Head Office', firstName: 'QAAuto', lastName: `AddrList${Date.now()}` });
    await form.addAddress({ type: 'Permanent', line1: '12 Test Street', city: 'Testville' });

    await expect(form.panel('ADDRESS').getByRole('button', { name: 'Permanent' })).toBeVisible({ timeout: 5000 });
});

test('TC-06 Preview opens with one Next after adding address', { tag: '@known-bug' }, async ({ page }) => {
    test.fail(true, 'Bug: first Next after adding an address stays on ADDRESS; needs a second click');
    const form = new CreateClientPage(page);
    await form.goto();
    await form.goToAddressStep({ office: 'Head Office', firstName: 'QAAuto', lastName: `Prev${Date.now()}` });
    await form.addAddress({ type: 'Permanent', line1: '12 Test Street', city: 'Testville' });

    await form.next('ADDRESS'); // one click only
    await expect(form.submitButton).toBeVisible({ timeout: 5000 });
});

test('TC-07 Create client with required fields + address', { tag: ['@smoke', '@regression'] }, async ({ page }) => {
    const lastName = `Auto${Date.now()}`;
    const form = new CreateClientPage(page);
    await form.goto();
    await form.createClient({
        office: 'Head Office',
        firstName: 'QAAuto',
        lastName,
        address: { type: 'Permanent', line1: '12 Test Street', city: 'Testville' },
    });

    const details = new ClientDetailsPage(page);
    await expect(page).toHaveURL(/#\/clients\/\d+\/general/, { timeout: 15000 });
    await expect(details.heading).toContainText(`QAAuto ${lastName}`);
    await expect(details.heading).toContainText(/Pending/i);
    await expect(details.field('Office')).toHaveText('Head Office');
    await expect(details.field('Staff')).toHaveText('Unassigned');
    await expect(details.field('External Id')).toHaveText(/^[0-9a-f-]{36}$/); // auto-generated UUID
    await expect(details.field('Account No.')).not.toBeEmpty();
});

test('TC-08 Activate a pending client', { tag: '@regression' }, async ({ page, request }) => {
    const client = await createClient(request, { firstname: 'QAAuto', lastname: `Act${Date.now()}` });
    const details = new ClientDetailsPage(page);
    await details.goto(client.id);
    await expect(details.heading).toContainText(/Pending/i);

    await details.activate(today());

    await expect(page).toHaveURL(new RegExp(`#/clients/${client.id}/general`));
    await expect(details.heading).toContainText(/Active/i);
    await expect(details.field('Activation Date')).toHaveText(today());
});

test('TC-09 New client appears in the list', { tag: '@regression' }, async ({ page, request }) => {
    const client = await createClient(request, { firstname: 'QAAuto', lastname: `List${Date.now()}` });
    const clients = new ClientsPage(page);
    await clients.goto();

    await clients.search(client.lastname);
    await expect(clients.row(client.displayName)).toBeVisible();
    await clients.expectShowing('1–1', 1);
});
