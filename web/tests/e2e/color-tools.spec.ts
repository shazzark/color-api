import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { waitForThemeTransitions } from "./helpers";

test("converter supports documented formats, validation, alpha, and copy", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/convert/");
  await expect(page.getByRole("heading", { level: 1, name: "Color converter" })).toBeVisible();
  for (const format of ["hex", "rgb", "hsl", "hsv", "oklab", "oklch"]) {
    await page.getByLabel("Output format").selectOption(format);
    const formatLabel = format === "oklab" ? "OKLab" : format.toUpperCase();
    await expect(page.locator(".color-result__body strong")).toHaveText(formatLabel);
  }
  await page.getByLabel("Output format").selectOption("oklch");
  await expect(page.locator(".color-result__body strong")).toHaveText("OKLCH");
  await expect(page.locator(".color-result__swatch")).toHaveCSS("background-color", "rgb(52, 152, 219)");
  await page.getByRole("button", { name: /Copy/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await page.locator(".color-result__body code").textContent());

  await page.getByLabel("Input format").selectOption("rgb");
  await page.getByLabel("Alpha (optional)").fill("0.5");
  await expect(page.locator(".color-result__body code")).toContainText("alpha");
  await page.getByLabel("Input format").selectOption("hex");
  await page.getByLabel("HEX value").fill("#12");
  await expect(page.locator(".tool-error")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Correct the input" })).toBeVisible();
});

test("generator reproduces a seeded output and reports invalid constraints", async ({ page }) => {
  await page.goto("/tools/generate/");
  await page.getByRole("button", { name: "Generate colors" }).click();
  await expect(page.locator(".color-results .color-result")).toHaveCount(12);
  const firstRun = await page.locator(".color-result__body code").allTextContents();
  await page.getByRole("button", { name: "Generate colors" }).click();
  expect(await page.locator(".color-result__body code").allTextContents()).toEqual(firstRun);
  await page.getByLabel("Minimum").first().fill("0.9");
  await page.getByLabel("Maximum").first().fill("0.2");
  await page.getByRole("button", { name: "Generate colors" }).click();
  await expect(page.locator(".tool-error")).toBeVisible();
  await expect(page.locator(".color-results .color-result")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByLabel("Seed (optional)").fill("");
  await page.getByRole("button", { name: "Generate colors" }).click();
  await expect(page.getByText(/Unseeded output uses Math.random/)).toBeVisible();
});

test("manipulator distinguishes mixing and compositing and can reset", async ({ page }) => {
  await page.goto("/tools/manipulate/");
  for (const operation of ["rotate-hue", "lightness", "chroma", "saturation", "alpha", "grayscale", "invert"]) {
    await page.locator("#manipulate-operation").selectOption(operation);
    await page.getByRole("button", { name: "Apply operation" }).click();
    await expect(page.locator(".color-result__body strong").filter({ hasText: "Modified" })).toBeVisible();
  }
  await page.locator("#manipulate-operation").selectOption("mix");
  await page.getByRole("button", { name: "Apply operation" }).click();
  await expect(page.getByText(/premultiplied OKLab/)).toBeVisible();
  await expect(page.locator(".color-result")).toHaveCount(2);
  await page.locator("#manipulate-operation").selectOption("composite");
  await page.getByRole("button", { name: "Apply operation" }).click();
  await expect(page.getByText(/composites source-over using encoded-sRGB/)).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#manipulate-operation")).toHaveValue("lightness");
  await expect(page.getByText("Apply an operation to see its result.")).toBeVisible();
});

test("palette methods and scale generation call supported package operations", async ({ page }) => {
  await page.goto("/tools/palettes/");
  await page.getByRole("button", { name: "Generate palette" }).click();
  await expect(page.locator(".color-results .color-result")).toHaveCount(5);
  await page.getByLabel("HSL harmony method").selectOption("complementary");
  await page.getByRole("button", { name: "Generate palette" }).click();
  await expect(page.locator(".color-results .color-result")).toHaveCount(2);
  for (const strategy of ["analogous", "triadic", "tetradic", "split-complementary", "monochromatic"]) {
    await page.getByLabel("HSL harmony method").selectOption(strategy);
    await page.getByRole("button", { name: "Generate palette" }).click();
    await expect(page.locator(".color-results .color-result").first()).toBeVisible();
  }
  await page.getByLabel("Palette method group").selectOption("variants");
  for (const variant of ["shades", "tints", "tones"]) {
    await page.getByLabel("Variant method").selectOption(variant);
    await page.getByRole("button", { name: "Generate palette" }).click();
    await expect(page.locator(".color-results .color-result")).toHaveCount(5);
  }
  await page.getByLabel(/Variant count/).fill("1");
  await page.getByRole("button", { name: "Generate palette" }).click();
  await expect(page.locator(".tool-error")).toBeVisible();

  await page.goto("/tools/scales/");
  await page.getByRole("button", { name: "Generate scale" }).click();
  await expect(page.locator(".color-results .color-result")).toHaveCount(9);
  await expect(page.getByLabel(/Position/).first()).toBeDisabled();
  await page.getByRole("spinbutton", { name: /Scale steps/ }).fill("1");
  await page.getByRole("button", { name: "Generate scale" }).click();
  await expect(page.locator(".tool-error")).toBeVisible();
});

test("tool routes remain usable at target viewports and pass automated accessibility scans", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const path of ["/tools/convert/", "/tools/generate/", "/tools/manipulate/", "/tools/palettes/", "/tools/scales/", "/tools/contrast/", "/tools/analyze/", "/tools/tokens/"]) {
    await page.goto(path);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflows, `${path} overflows at ${width}px`).toBe(false);
      if (path === "/tools/convert/") {
        await page.screenshot({ path: testInfo.outputPath(`phase14-convert-${width}px.png`), fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Theme", { exact: true }).selectOption(theme);
      await waitForThemeTransitions(page);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(accessibility.violations, `${path} ${theme} theme accessibility violations`).toEqual([]);
    }
  }
});

test("theme applies to tool controls and keyboard focus remains visible", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/tools/convert/");
  await page.getByLabel("Theme").selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: testInfo.outputPath("phase14-convert-light.png"), fullPage: true });
  await page.getByLabel("Input format").focus();
  await expect(page.getByLabel("Input format")).toBeFocused();
  const outline = await page.getByLabel("Input format").evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).toBe("solid");
  await page.getByLabel("Theme").selectOption("dark");
  await page.screenshot({ path: testInfo.outputPath("phase14-convert-dark.png"), fullPage: true });
});
