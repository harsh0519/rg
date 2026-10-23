import { test, expect } from "@playwright/test";

test.describe("price gating + route protection (anonymous)", () => {
  test("catalog hides prices for anonymous visitors", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByText(/log in as an approved buyer/i)).toBeVisible();
    await expect(page.getByText("Log in to see prices").first()).toBeVisible();
  });

  test("/admin redirects anonymous users to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/account redirects anonymous users to login", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login/);
  });

  test("a product page shows the approved-only gate", async ({ page }) => {
    await page.goto("/catalog");
    await page.locator('a[href^="/products/"]').first().click();
    await expect(page.getByText(/prices are for approved buyers/i)).toBeVisible();
  });
});
