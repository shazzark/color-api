import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage explains the product without unsupported claims", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/ChromaForge/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("deterministic math");
  await expect(page.getByText(/Explore the published color engine in your browser/i)).toBeVisible();
  await expect(page.getByText("npm install chromaforge")).toBeVisible();
  await expect(page.getByRole("link", { name: /API playground pre-release API/i })).toBeVisible();
});

test("API documentation route renders the contract and its pre-release status", async ({ page }) => {
  await page.goto("/docs/api/");
  await expect(page.getByRole("heading", { level: 1, name: "API reference", exact: true })).toBeVisible();
  await expect(page.locator(".api-operation")).toHaveCount(20);
  await expect(page.locator(".status-tag", { hasText: "/v1 PRE-RELEASE" }).first()).toBeVisible();
});

test("mobile navigation and tool links remain keyboard reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menu = page.getByText("Menu", { exact: true });
  await menu.focus();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "API playground" })).toBeVisible();

  await page.getByRole("link", { name: "Tools", exact: true }).first().click();
  await expect(page).toHaveURL(/\/tools\/convert\/$/);
  await expect(page.getByRole("navigation", { name: "Color tools" }).getByRole("link", { name: "Manipulate", exact: true })).toBeVisible();
});

test("theme follows system and persists a manual override", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const canvas = await page.locator("html").evaluate((element) => getComputedStyle(element).getPropertyValue("--cf-canvas").trim());
  expect(canvas).toBe("#111512");
  await page.getByLabel("Theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByLabel("Theme").selectOption("system");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  const systemCanvas = await page.locator("html").evaluate((element) => getComputedStyle(element).getPropertyValue("--cf-canvas").trim());
  expect(systemCanvas).toBe("#111512");
});

test("homepage has no horizontal overflow and passes automated accessibility checks", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflows, `Unexpected horizontal overflow at ${width}px`).toBe(false);
  }

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
