import { expect, test } from "@playwright/test";

test("an offline static build disables playground sending without making API requests", async ({ page }) => {
  test.skip(Boolean(process.env.NEXT_PUBLIC_CHROMAFORGE_API_ORIGIN?.trim()), "requires a static build with no API origin");

  let apiRequestCount = 0;
  page.on("request", (request) => {
    if (request.method() !== "GET" && new URL(request.url()).origin !== "http://127.0.0.1:3100") {
      apiRequestCount++;
    }
  });

  await page.goto("/playground/");
  await expect(page.locator(".api-playground > .tool-error")).toHaveText("No API origin is configured for this website build.");
  await expect(page.getByRole("button", { name: "Send request" })).toBeDisabled();
  expect(apiRequestCount).toBe(0);
});
