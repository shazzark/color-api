import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { resolveApiOrigin } from "../../lib/api-origin";
import { CHROMAFORGE_API_ORIGIN } from "../../lib/api-origin-constants";
import { getDocumentedOperations, getPlaygroundOperations, openApiDocument, readPackageExample } from "../../lib/openapi-source";
import {
  API_REQUEST_TIMEOUT_MS,
  API_RESPONSE_LIMIT_BYTES,
  buildOperationUrl,
  buildRequestSnippets,
  parseJsonRequest,
  parseResponseBody,
  readBoundedResponse,
  ResponseTooLargeError
} from "../../features/playground/api-transport";

const apiOrigin = CHROMAFORGE_API_ORIGIN;

test("Phase 16 source data covers the OpenAPI contract and published package examples", async () => {
  const documented = getDocumentedOperations();
  const playground = getPlaygroundOperations();
  expect(documented).toHaveLength(20);
  expect(new Set(documented.map(({ operationId }) => operationId)).size).toBe(20);
  expect(playground).toHaveLength(17);
  expect(playground.every(({ method, path }) => method === "POST" && path.startsWith("/v1/"))).toBe(true);

  for (const operation of playground) {
    const specExample = openApiDocument.paths[operation.path].post.requestBody?.content?.["application/json"]?.example;
    expect(operation.requestExample).toEqual(specExample);
  }
  expect(documented.find(({ path }) => path === "/health")?.category).toBe("Health endpoint");
  expect(documented.find(({ path }) => path === "/docs")?.category).toBe("Documentation endpoint");
  expect(documented.find(({ path }) => path === "/openapi.json")?.category).toBe("Specification endpoint");
  for (const example of ["getting-started.ts", "operations.ts", "errors.ts", "tokens.ts", "react-example.tsx"] as const) {
    expect(readPackageExample(example)).toContain("chromaforge");
  }
});

test("Phase 16 transport validates JSON, bounds bytes, and restricts operation URLs", async () => {
  expect(parseJsonRequest('{"color":"#123456"}', 64).valid).toBe(true);
  expect(parseJsonRequest("{invalid", 64)).toMatchObject({ valid: false, message: "Request body is not valid JSON." });
  expect(parseJsonRequest('"é"', 3).valid).toBe(false);
  expect(resolveApiOrigin(undefined, "production").available).toBe(false);
  expect(resolveApiOrigin("", "preview").available).toBe(false);
  expect(resolveApiOrigin("   ", "development").available).toBe(false);
  expect(resolveApiOrigin(apiOrigin, "production")).toMatchObject({ available: true, origin: apiOrigin, source: "configured" });
  expect(resolveApiOrigin("http://127.0.0.1:3001", "development")).toMatchObject({ available: true, origin: "http://127.0.0.1:3001" });
  expect(resolveApiOrigin("http://127.0.0.1:3001", "preview").available).toBe(false);
  expect(resolveApiOrigin("http://example.test", "production").available).toBe(false);
  expect(resolveApiOrigin("https://example.test", "production").available).toBe(false);
  expect(resolveApiOrigin("https://example.test/path", "production").available).toBe(false);
  expect(resolveApiOrigin("not a URL", "production").available).toBe(false);

  const operation = getPlaygroundOperations()[0];
  expect(buildOperationUrl(apiOrigin, operation, "production")).toBe(`${apiOrigin}${operation.path}`);
  expect(buildOperationUrl("http://localhost:3001", operation, "development")).toBe(`http://localhost:3001${operation.path}`);
  expect(() => buildOperationUrl("http://localhost:3001", operation, "production")).toThrow();
  expect(() => buildOperationUrl(apiOrigin, { ...operation, path: "https://attacker.test/" }, "production")).toThrow();
  expect(() => buildOperationUrl("https://attacker.test", operation, "production")).toThrow();
  expect(() => buildOperationUrl(apiOrigin, { ...operation, method: "GET" as "POST" }, "production")).toThrow();
  expect(() => buildRequestSnippets(`https://attacker.test${operation.path}`, operation.requestExample, "production")).toThrow();
  expect(() => buildRequestSnippets(`https://user:password@color-api-9qdz.onrender.com${operation.path}`, operation.requestExample, "production")).toThrow();
  expect(() => buildRequestSnippets(`http://localhost:3001${operation.path}`, operation.requestExample, "production")).toThrow();
  const localSnippets = buildRequestSnippets(`http://localhost:3001${operation.path}`, operation.requestExample, "development");
  expect(localSnippets.fetch).toContain('redirect: "error"');
  const snippets = buildRequestSnippets(`${apiOrigin}${operation.path}`, operation.requestExample, "production");
  expect(snippets.curl).toContain(`'${apiOrigin}${operation.path}'`);
  expect(snippets.curl).not.toContain("attacker.test");
  expect(snippets.fetch).toContain(JSON.stringify(`${apiOrigin}${operation.path}`));
  expect(snippets.fetch).toContain('redirect: "error"');

  expect(parseResponseBody("application/json", "not json")).toMatchObject({ isJson: true, invalidJson: true });
  expect(parseResponseBody("text/plain", "hello")).toMatchObject({ isJson: false, invalidJson: false });
  expect(await readBoundedResponse(new Response('{"ok":true}'), 32)).toBe('{"ok":true}');
  await expect(readBoundedResponse(new Response("x".repeat(API_RESPONSE_LIMIT_BYTES + 1)), API_RESPONSE_LIMIT_BYTES)).rejects.toBeInstanceOf(ResponseTooLargeError);
});

test("package documentation renders verified requirements, examples, and copy controls", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/docs/package/");
  await expect(page.getByRole("heading", { name: "Color operations for TypeScript and JavaScript" })).toBeVisible();
  await expect(page.getByText("node >=22.12.0", { exact: false })).toBeVisible();
  await expect(page.getByText("HEX, RGB, HSL, HSV, OKLab, and OKLCH", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "React integration" })).toBeVisible();
  await expect(page.getByText("ESM-only", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Copy value for npm install command" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("npm install chromaforge");
  expect(await page.locator(".code-token").count()).toBeGreaterThan(0);
});

test("API reference renders all OpenAPI operations, examples, schemas, limits, and pre-release status", async ({ page }) => {
  await page.goto("/docs/api/");
  await expect(page.getByRole("heading", { name: "API reference", exact: true })).toBeVisible();
  await expect(page.locator(".api-operation")).toHaveCount(20);
  await expect(page.getByText("Documented operations (20)")).toBeVisible();
  await expect(page.getByText("/v1 PRE-RELEASE").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Health endpoint" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Documentation endpoint" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Specification endpoint" })).toBeVisible();
  const convertCard = page.locator('[data-operation-id="convertColor"]');
  await convertCard.locator(".api-operation__details").first().locator(":scope > summary").click();
  await expect(convertCard.locator(".api-operation__details").first().locator(".code-block").first()).toBeVisible();
  await convertCard.locator(".api-operation__details").nth(1).locator(":scope > summary").click();
  const badRequest = convertCard.locator(".api-response summary").filter({ hasText: "400" }).first();
  await badRequest.click();
  await expect(convertCard.locator(".api-response").filter({ hasText: "400" }).locator(".code-block").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browser CORS requirements" })).toBeVisible();
});

async function allowApiPreflight(route: import("@playwright/test").Route) {
  await route.fulfill({
    status: 204,
    headers: {
      "access-control-allow-origin": "http://127.0.0.1:3100",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-expose-headers": "x-request-id, retry-after"
    }
  });
}

test("playground derives selectable POST operations and displays a mocked successful HTTP response", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  let sentUrl = "";
  let sentBody: unknown;
  await page.route(`${apiOrigin}/**`, async (route) => {
    if (route.request().method() === "OPTIONS") return allowApiPreflight(route);
    sentUrl = route.request().url();
    sentBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "http://127.0.0.1:3100", "access-control-expose-headers": "x-request-id, retry-after", "x-request-id": "mock-request-16" },
      body: JSON.stringify({ ok: true, color: "#123456" })
    });
  });
  await page.goto("/playground/");
  await expect(page.getByText("/v1 PRE-RELEASE").first()).toBeVisible();
  await expect(page.locator("#playground-operation option")).toHaveCount(17);
  await page.getByLabel("Documented operation").selectOption({ index: 1 });
  const selectedPath = await page.locator(".playground-endpoint code").textContent();
  await expect(page.locator("#playground-request")).toContainText("{");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/HTTP 200/)).toBeVisible();
  await expect(page.getByText("mock-request-16")).toBeVisible();
  expect(sentUrl).toBe(`${apiOrigin}${selectedPath}`);
  expect(sentBody).toBeTruthy();
  await page.getByRole("button", { name: "Copy value for API response body" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Copied." })).toBeVisible();
  await page.getByText("cURL (POSIX shell)").click();
  await expect(page.getByRole("button", { name: "Copy value for curl request example" })).toBeVisible();
});

test("playground validates JSON and reports mocked API errors, rate limits, invalid JSON, and network failure honestly", async ({ page }) => {
  let postCount = 0;
  await page.route(`${apiOrigin}/**`, async (route) => {
    if (route.request().method() === "OPTIONS") return allowApiPreflight(route);
    postCount++;
    const mode = (route.request().postDataJSON() as { mock?: string }).mock;
    if (mode === "error") {
      return route.fulfill({ status: 400, contentType: "application/json", headers: { "access-control-allow-origin": "http://127.0.0.1:3100" }, body: JSON.stringify({ error: { code: "INVALID_COLOR" } }) });
    }
    if (mode === "rate") {
      return route.fulfill({ status: 429, contentType: "application/json", headers: { "access-control-allow-origin": "http://127.0.0.1:3100", "access-control-expose-headers": "retry-after", "retry-after": "60" }, body: JSON.stringify({ error: { code: "RATE_LIMITED" } }) });
    }
    if (mode === "invalid") {
      return route.fulfill({ status: 502, contentType: "application/json", headers: { "access-control-allow-origin": "http://127.0.0.1:3100" }, body: "not json" });
    }
    await route.abort("failed");
  });
  await page.goto("/playground/");
  const input = page.getByLabel("Request JSON");
  await input.fill("{invalid");
  await expect(page.locator("#playground-json-state[role='alert']")).toContainText("not valid JSON");
  await expect(page.getByRole("button", { name: "Send request" })).toBeDisabled();
  expect(postCount).toBe(0);
  await input.fill('{"mock":"error"}');
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/HTTP 400/)).toBeVisible();
  await input.fill('{"mock":"rate"}');
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/HTTP 429/)).toBeVisible();
  await expect(page.getByText(/Retry after 60 seconds/)).toBeVisible();
  await input.fill('{"mock":"invalid"}');
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(/HTTP 502/)).toBeVisible();
  await expect(page.getByText(/body is not valid JSON/)).toBeVisible();
  await input.fill("{}");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Network or CORS failure", { exact: false })).toBeVisible();
});

test("playground refuses API redirects so request bodies stay on the configured origin", async ({ page }) => {
  let attackerWasContacted = false;
  await page.route("https://attacker.test/**", async (route) => {
    attackerWasContacted = true;
    await route.fulfill({ status: 200, body: "unexpected" });
  });
  await page.route(`${apiOrigin}/**`, async (route) => {
    if (route.request().method() === "OPTIONS") return allowApiPreflight(route);
    await route.fulfill({
      status: 307,
      headers: {
        "access-control-allow-origin": "http://127.0.0.1:3100",
        location: "https://attacker.test/collect"
      }
    });
  });
  await page.goto("/playground/");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Network or CORS failure", { exact: false })).toBeVisible();
  expect(attackerWasContacted).toBe(false);
});

test("playground is keyboard-operable at mobile width and enforces its request timeout", async ({ page }) => {
  let selectedRequest = "";
  await page.setViewportSize({ width: 320, height: 800 });
  await page.route(`${apiOrigin}/**`, async (route) => {
    if (route.request().method() === "OPTIONS") return allowApiPreflight(route);
    selectedRequest = route.request().url();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "http://127.0.0.1:3100" },
      body: JSON.stringify({ ok: true })
    });
  });
  await page.goto("/playground/");
  const operationSelect = page.getByLabel("Documented operation");
  await operationSelect.focus();
  expect(await operationSelect.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("ArrowDown");
  const selectedPath = await page.locator(".playground-endpoint code").textContent();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/HTTP 200/)).toBeVisible();
  expect(selectedRequest).toBe(`${apiOrigin}${selectedPath}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);

  await page.unrouteAll({ behavior: "wait" });
  await page.route(`${apiOrigin}/**`, async (route) => {
    if (route.request().method() === "OPTIONS") return allowApiPreflight(route);
    await new Promise((resolve) => setTimeout(resolve, API_REQUEST_TIMEOUT_MS + 1_000));
    try {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "http://127.0.0.1:3100" },
        body: "{}"
      });
    } catch {
      // The browser timeout may have already cancelled the intercepted request.
    }
  });
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText(new RegExp(`The API request exceeded the ${API_REQUEST_TIMEOUT_MS / 1000}-second timeout`))).toBeVisible({ timeout: API_REQUEST_TIMEOUT_MS + 3_000 });
});

test("package guide, reference, and playground remain usable across viewports and themes", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  for (const path of ["/docs/package/", "/docs/api/", "/playground/"]) {
    await page.goto(path);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${path} overflows at ${width}px`).toBe(false);
      if (width === 320 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`phase16-${path.split("/")[2]}-${width}.png`), fullPage: true });
    }
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Theme", { exact: true }).selectOption(theme);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(result.violations, `${path} ${theme} axe violations`).toEqual([]);
    }
  }
});
