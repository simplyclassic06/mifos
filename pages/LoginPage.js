const { expect } = require('@playwright/test');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.username = page.getByRole('textbox', { name: 'Username' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.warningDialog = page.getByRole('dialog').filter({ hasText: 'authorized use only' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(user, pass) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginButton.click();
  }

  async closeWarning() {
    await expect(this.warningDialog).toBeVisible({ timeout: 15000 });
    await this.warningDialog.getByRole('button', { name: 'Close' }).click();
    await expect(this.warningDialog).toBeHidden();
  }
}

module.exports = { LoginPage };
