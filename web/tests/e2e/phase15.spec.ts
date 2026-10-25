import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("contrast uses package thresholds, exposes scoped WCAG results, and handles alpha context", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/contrast/");
  await page.locator("#contrast-foreground-value").fill("#000000");
  await page.locator("#contrast-background-value").fill("#ffffff");
  await page.getByRole("button", { name: "Evaluate pair" }).click();
  await expect(page.locator(".metric-list dd").first()).toHaveText("21:1");
  await expect(page.getByRole("img", { name: /Example non-text interface boundary/ })).toBeVisible();
  await expect(page.getByText("Meets the selected wcag-2.2-1.4.3 threshold of 4.5:1.")).toBeVisible();
  await expect(page.getByText("This result applies only to this pair and the selected criterion/context.")).toBeVisible();
  await page.getByRole("button", { name: "Copy value for Effective foreground" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('{"r":0,"g":0,"b":0}');

  await page.getByLabel("WCAG 2.2 criterion").selectOption("wcag-2.2-1.4.11");
  await page.getByRole("button", { name: "Evaluate pair" }).click();
  await expect(page.locator(".tool-error")).toContainText("named graphical object or boundary");
  await page.getByLabel("Graphical object or boundary").fill("Icon outline");
  await page.getByRole("button", { name: "Evaluate pair" }).click();
  await expect(page.locator(".metric-list dd").filter({ hasText: "Icon outline" })).toBeVisible();

  await page.locator("#contrast-background-value").fill("#ffffff80");
  await page.getByRole("button", { name: "Evaluate pair" }).click();
  await expect(page.locator(".tool-error")).toContainText("opaque canvas is required");
  await page.getByLabel("Provide an opaque canvas for a translucent background").check();
  await page.getByRole("button", { name: "Evaluate pair" }).click();
  await expect(page.locator(".metric-list dd").first()).toBeVisible();

  await page.getByRole("button", { name: "Find foreground suggestions" }).click();
  await expect(page.locator("#contrast-suggestions-title").locator("..").getByText(/lighter ·/)).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#contrast-foreground-value")).toHaveValue("#18201a");
});

test("analyzer displays package metrics, deltaEOK, and rejects translucent input", async ({ page }) => {
  await page.goto("/tools/analyze/");
  await page.locator("#analysis-color-value").fill("#000000");
  await page.getByRole("button", { name: "Analyze color" }).click();
  await expect(page.locator(".metric-list dd").first()).toHaveText("0.000000");
  await expect(page.locator("#main-content .metric-list dd").filter({ hasText: "Dark" })).toBeVisible();

  await page.getByLabel("Compare a second color with deltaEOK").check();
  await page.locator("#analysis-comparison-value").fill("#ffffff");
  await page.getByRole("button", { name: "Analyze color" }).click();
  await expect(page.getByText("1.000000", { exact: true })).toBeVisible();
  await expect(page.getByText(/No universal threshold/)).toBeVisible();

  await page.locator("#analysis-color-value").fill("#00000080");
  await page.getByRole("button", { name: "Analyze color" }).click();
  await expect(page.locator(".tool-error")).toContainText("requires an opaque color");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#analysis-color-value")).toHaveValue("#3456d1");
});

test("design token serializers validate names and generate copyable/downloadable output", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tools/tokens/");
  await page.getByRole("button", { name: "Generate tokens" }).click();
  await expect(page.locator(".token-output code")).toContainText('"schemaVersion": 1');
  const jsonOutput = await page.locator(".token-output code").textContent();
  await page.getByRole("button", { name: "Copy value for generated design tokens" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll(String.fromCharCode(13), "")).toBe((jsonOutput ?? "").replaceAll(String.fromCharCode(13), ""));

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download file" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("chromaforge-design-tokens.tokens.json");
  const downloadPath = testInfo.outputPath("downloaded-tokens.json");
  await download.saveAs(downloadPath);
  expect(await readFile(downloadPath, "utf8")).toContain("schemaVersion");

  for (const format of ["css", "javascript", "typescript", "scss", "tailwind"]) {
    await page.getByLabel("Export format").selectOption(format);
    await page.getByRole("button", { name: "Generate tokens" }).click();
    const output = await page.locator(".token-output code").textContent();
    expect(output).toBeTruthy();
    if (format === "css") expect(output).toContain("--color-brand: #3456d1;");
    if (format === "typescript") expect(output).toContain("satisfies Record<string, ColorValue>");
    if (format === "scss") expect(output).toContain("$color-brand: #3456d1;");
    if (format === "tailwind") expect(output).toContain('"extend"');
  }

  await page.getByLabel("Token name").fill("Invalid_Name");
  await page.getByRole("button", { name: "Generate tokens" }).click();
  await expect(page.locator(".tool-error")).toContainText("Invalid token name");
  await expect(page.locator(".token-output code")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Token name")).toHaveValue("brand");
});

test("Phase 15 forms and actions work from the keyboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/tools/contrast/");
  await page.locator("#contrast-foreground-value").fill("#000000");
  await page.locator("#contrast-background-value").fill("#ffffff");
  await page.getByRole("button", { name: "Evaluate pair" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".metric-list dd").first()).toHaveText("21:1");

  await page.goto("/tools/analyze/");
  await page.locator("#analysis-compare-colors").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#analysis-comparison-value")).toBeVisible();
  await page.getByRole("button", { name: "Analyze color" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".metric-list dd").first()).toHaveText("0.119891");

  await page.goto("/tools/tokens/");
  await page.getByRole("button", { name: "Generate tokens" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".token-output code")).toContainText('"schemaVersion": 1');
  await page.getByRole("button", { name: "Copy value for generated design tokens" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
});

test("Phase 15 tools have no viewport overflow and pass axe in both themes", async ({ page }, testInfo) => {
  for (const path of ["/tools/contrast/", "/tools/analyze/", "/tools/tokens/"]) {
    await page.goto(path);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflows, `${path} overflows at ${width}px`).toBe(false);
      if (width === 320 || width === 1280) {
        await page.screenshot({ path: testInfo.outputPath(`${path.split("/")[2]}-${width}px.png`), fullPage: true });
      }
    }
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Theme", { exact: true }).selectOption(theme);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(accessibility.violations, `${path} ${theme} theme accessibility violations`).toEqual([]);
    }
  }
});
