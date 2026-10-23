import { test, expect } from "@playwright/test";
import { login } from "./helpers";

// Full buyer order flow against the isolated `development` dataset.
test("approved buyer places an order and sees it in their account", async ({ page }) => {
  await login(page, "approved");

  // A single-variant towel keeps the order matrix simple (one cell clears MOQ + min-order).
  await page.goto("/products/orange-siena-buti-cotton-pile-towel-medium-20051184");
  await expect(page.getByRole("heading", { name: /build your order/i })).toBeVisible();

  const qty = page.locator('input[type="number"]').first();
  await qty.fill("20");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.waitForURL(/\/cart/);

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.fill("#line1", "1 Market Road");
  await page.fill("#city", "Mumbai");
  await page.fill("#pincode", "400001");
  await page.fill("#phone", "9820012345");
  await page.fill("#po", "PO-E2E-1");
  await page.getByRole("button", { name: /place order/i }).click();

  // placing an order does several Sanity writes (numbering, order, invoice) — allow time
  await expect(page.getByRole("heading", { name: /order placed/i })).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText(/RG\/\d{2}-\d{2}\/\d{4}/)).toBeVisible();

  // it shows up under the account
  await page.goto("/account/orders");
  await expect(page.getByText(/RG\/\d{2}-\d{2}\/\d{4}/).first()).toBeVisible();
});
