import { expect } from '@playwright/test';

export const ACCOUNTS = {
  patient: { email: 'patient@sanjibani.in', password: 'Patient@123' },
  lab: { email: 'lab1@sanjibani.in', password: 'Lab@1234' },
  admin: { email: 'admin@sanjibani.in', password: 'Admin@123' },
};

export async function login(page, who, next) {
  const { email, password } = typeof who === 'string' ? ACCOUNTS[who] : who;
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('sanjibani.token');
    localStorage.removeItem('sanjibani.cart');
  });
}
