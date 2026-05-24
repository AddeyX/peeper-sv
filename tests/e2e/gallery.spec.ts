import { test, expect } from "@playwright/test";

test("sidebar lists components from src/lib, excludes routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Button/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Badge/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^UserCard/ })).toBeVisible();
  await expect(page.getByText("+page")).toHaveCount(0);
});

test("renders Button with default props, updates on control change", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Button/ }).click();
  await expect(page.getByTestId("btn")).toHaveText("Sample");

  const labelInput = page.getByLabel("* label");
  await labelInput.fill("Hello");
  await expect(page.getByTestId("btn")).toHaveText("Hello");
});

test("Badge renders enum select", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Badge/ }).click();
  const select = page.getByLabel("variant");
  await select.selectOption("success");
  await expect(page.getByTestId("badge")).toHaveAttribute("data-variant", "success");
});

test("UserCard shows needs-setup card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^UserCard/ }).click();
  await expect(page.getByText(/can't be auto-rendered/)).toBeVisible();
  await expect(page.getByText(/prop 'user' is required/)).toBeVisible();
});

test("search filters sidebar", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Search components…").fill("badge");
  await expect(page.getByRole("button", { name: /^Button/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Badge/ })).toBeVisible();
});

test("URL hash updates on selection", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Badge/ }).click();
  await expect.poll(() => page.evaluate(() => window.location.hash)).toMatch(/Badge/);
});
