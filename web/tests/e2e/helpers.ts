import type { Page } from "@playwright/test";

export async function waitForThemeTransitions(page: Page) {
  // Axe should inspect settled theme colors, not the temporary colors during interpolation.
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((animation) =>
        animation.finished.catch(() => undefined)
      )
    );
  });
}
