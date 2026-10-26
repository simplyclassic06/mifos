const { expect } = require('@playwright/test');

class CreateClientPage {
  constructor(page) {
    this.page = page;
    // GENERAL step
    this.office = page.getByRole('combobox', { name: 'Office' });
    this.legalForm = page.getByRole('combobox', { name: 'Legal Form' });
    this.externalId = page.getByRole('textbox', { name: 'External Id' });
    this.firstName = page.getByRole('textbox', { name: 'First Name' });
    this.middleName = page.getByRole('textbox', { name: 'Middle Name' });
    this.lastName = page.getByRole('textbox', { name: 'Last Name' });
    this.dateOfBirth = page.getByRole('textbox', { name: 'Date of Birth' });
    this.gender = page.getByRole('combobox', { name: 'Gender' });
    this.staff = page.getByRole('combobox', { name: 'Staff' });
    this.isStaff = page.getByRole('checkbox', { name: 'Is staff' });
    this.mobileNo = page.getByRole('textbox', { name: 'Mobile No' });
    this.email = page.getByRole('textbox', { name: 'Email Address' });
    this.clientType = page.getByRole('combobox', { name: 'Client Type' });
    this.clientClassification = page.getByRole('combobox', { name: 'Client Classification' });
    this.submittedOn = page.getByRole('textbox', { name: 'Submitted On' });
    this.active = page.getByRole('checkbox', { name: 'Active?' });
    this.openSavings = page.getByRole('checkbox', { name: 'Open Savings Account?' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    // ADDRESS step + dialog
    this.addAddressButton = page.getByRole('tabpanel', { name: 'ADDRESS' }).getByRole('button', { name: 'Add' });
    this.addressDialog = page.getByRole('dialog').filter({ hasText: 'Add Client Address' });
  }

  step(name) {
    return this.page.getByRole('tab', { name });
  }

  // Next/Previous are scoped to a step's panel: clicking right after a step change
  // otherwise races the stepper animation.
  panel(name) {
    return this.page.getByRole('tabpanel', { name });
  }

  nextButton(stepName) {
    return this.panel(stepName).getByRole('button', { name: 'Next' });
  }

  previousButton(stepName) {
    return this.panel(stepName).getByRole('button', { name: 'Previous' });
  }

  async next(fromStep) {
    await this.nextButton(fromStep).click();
  }

  async goto() {
    await this.page.goto('/#/clients/create');
    await expect(this.firstName).toBeVisible({ timeout: 15000 });
  }

  async selectOffice(name) {
    await this.office.click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  async fillRequired({ office, firstName, lastName }) {
    await this.selectOffice(office);
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
  }

  async openAddressDialog() {
    await this.addAddressButton.click();
    await expect(this.addressDialog).toBeVisible();
  }

  async addAddress({ type, line1, city }) {
    await this.openAddressDialog();
    await this.addressDialog.getByRole('combobox', { name: 'Address Type' }).click();
    await this.page.getByRole('option', { name: type, exact: true }).click();
    await this.addressDialog.getByRole('textbox', { name: 'Address Line 1' }).fill(line1);
    await this.addressDialog.getByRole('textbox', { name: 'City' }).fill(city);
    await this.addressDialog.getByRole('button', { name: 'Add' }).click();
    await expect(this.addressDialog).toBeHidden();
  }

  // Known bug (TC-06): the first Next after adding an address sometimes stays on ADDRESS,
  // so retry Next until the PREVIEW step's Submit button shows up.
  async goToPreview() {
    const next = this.nextButton('ADDRESS');
    await expect(async () => {
      if (await next.isVisible()) await next.click();
      await expect(this.submitButton).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
  }

  async goToAddressStep({ office, firstName, lastName }) {
    await this.fillRequired({ office, firstName, lastName });
    await this.next('GENERAL');
    await this.next('FAMILY MEMBERS');
  }

  async createClient({ office, firstName, lastName, address }) {
    await this.goToAddressStep({ office, firstName, lastName });
    await this.addAddress(address);
    await this.goToPreview();
    await this.submitButton.click();
  }
}

module.exports = { CreateClientPage };
