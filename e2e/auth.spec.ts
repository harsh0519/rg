import { test, expect } from "@playwright/test";
import { login, logout, ACCOUNTS } from "./helpers";

test.describe("authentication + approval gating", () => {
  test("approved buyer sees wholesale prices after login", async ({ page }) => {
    await login(page, "approved");
    await page.goto("/catalog");
    await expect(page.getByText(/your wholesale rates are shown/i)).toBeVisible();
    // at least one ₹ price appears on a card
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", ACCOUNTS.approved.email);
    await page.fill("#password", "wrong-password");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("logout returns to home and re-gates prices", async ({ page }) => {
    await login(page, "approved");
    await logout(page);
    await page.goto("/catalog");
    await expect(page.getByText("Log in to see prices").first()).toBeVisible();
  });
});
