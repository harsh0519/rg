import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("admin", () => {
  test("a non-admin buyer cannot reach /admin", async ({ page }) => {
    await login(page, "approved");
    await page.goto("/admin");
    // server role check redirects non-admins to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin sees the dashboard and the buyers queue", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByText(/buyers awaiting approval/i)).toBeVisible();

    await page.goto("/admin/buyers");
    // the seeded pending buyer is listed with an Approve action
    await expect(page.getByText("Surya Traders")).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
  });
});
