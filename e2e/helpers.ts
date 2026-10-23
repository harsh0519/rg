import { type Page, expect } from "@playwright/test";

// Seeded dev accounts (scripts/seed-dev.ts) — all share this password.
export const ACCOUNTS = {
  admin: { email: "admin@rg.test", password: "password123" },
  approved: { email: "anand@rg.test", password: "password123" },
  pending: { email: "surya@rg.test", password: "password123" },
};

export async function login(page: Page, who: keyof typeof ACCOUNTS) {
  const { email, password } = ACCOUNTS[who];
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL(/\/catalog/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page).toHaveURL("/");
}
