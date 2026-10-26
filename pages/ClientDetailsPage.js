const { expect } = require('@playwright/test');

class ClientDetailsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /^Client Name/ });
    this.actionsButton = page.getByRole('button', { name: 'Client actions' });
    this.activatedOn = page.getByRole('textbox', { name: 'Activated On Date' });
    this.confirmButton = page.getByRole('button', { name: 'Confirm' });
  }

  async goto(id) {
    await this.page.goto(`/#/clients/${id}/general`);
    await expect(this.heading).toBeVisible({ timeout: 15000 });
  }

  // label cell → value cell in the header table (Office, Account No., External Id, ...)
  field(label) {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: label, exact: true }) })
      .getByRole('cell')
      .nth(1);
  }

  fieldLabel(label) {
    return this.page.getByRole('cell', { name: label, exact: true });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  menuItem(name) {
    return this.page.getByRole('menuitem', { name, exact: true });
  }

  async openActionsSubmenu() {
    await this.actionsButton.click();
    await this.menuItem('Actions').click();
  }

  async activate(date) {
    await this.openActionsSubmenu();
    await this.menuItem('Activate').click();
    await expect(this.page).toHaveURL(/\/actions\/Activate/);
    await this.activatedOn.fill(date);
    await this.confirmButton.click();
  }
}

module.exports = { ClientDetailsPage };
