import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to sign in when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("should display sign in page", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: /DevFocus Dashboard/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with GitHub/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with GitLab/i })).toBeVisible();
  });

  test("should show error page on auth error", async ({ page }) => {
    await page.goto("/auth/error?error=Configuration");
    await expect(page.getByRole("heading", { name: /Authentication Error/i })).toBeVisible();
    await expect(page.getByText(/problem with the server configuration/i)).toBeVisible();
  });
});
