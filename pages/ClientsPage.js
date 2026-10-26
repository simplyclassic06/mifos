const { expect } = require('@playwright/test');

class ClientsPage {
  constructor(page) {
    this.page = page;
    this.searchBox = page.getByRole('textbox', { name: 'Search by client name, external Id, mobile' });
    this.clearSearch = page.getByRole('button', { name: 'Clear' });
    this.showClosed = page.getByRole('checkbox', { name: 'Show Closed Accounts' });
    this.importClientLink = page.getByRole('link', { name: 'Import Client' });
    this.createClientLink = page.getByRole('link', { name: 'Create Client' });
    this.noResults = page.getByText('No client was found');
    this.paginator = page.getByText('Showing');
    this.pageInfo = page.getByText(/Page \d+ of \d+/);
    this.rowsPerPage = page.locator('select').filter({ has: page.locator('option', { hasText: '100' }) });
    this.nextPage = page.getByRole('button', { name: 'Next Page' });
    this.lastPage = page.getByRole('button', { name: 'Last Page' });
  }

  async goto() {
    await this.page.goto('/#/clients');
    await expect(this.paginator).toBeVisible({ timeout: 15000 });
  }

  async search(term) {
    await this.searchBox.fill(term);
  }

  // a client in the result list, found by its display name
  row(name) {
    return this.page.getByText(name, { exact: true });
  }

  async expectShowing(range, total) {
    await expect(this.paginator).toContainText(new RegExp(`${range}\\s*of\\s*${total}`));
  }
}

module.exports = { ClientsPage };
