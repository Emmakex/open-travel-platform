import { expect, test } from "@playwright/test";

test.describe("accessibility foundation", () => {
  test("keyboard users can bypass navigation and retain visible focus", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", /^(en|es)$/);
    await expect(page.getByRole("main")).toHaveCount(1);

    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /Skip to main content|Saltar al contenido principal/i });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator("#main-content")).toBeFocused();

    await page.keyboard.press("Tab");
    const firstContentLink = page.locator("#main-content a").first();
    await expect(firstContentLink).toBeFocused();
    await expect(page.locator("a.brand")).not.toBeFocused();
    const focusStyle = await firstContentLink.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth || "0")
      };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);
  });

  test("desktop navigation exposes an accessible name", async ({ page }) => {
    await page.goto("/");
    const navigation = page.getByRole("navigation", { name: /Primary navigation|Navegación principal/i });
    await expect(navigation).toBeVisible();
  });

  test("reduced-motion preference disables smooth scrolling and long transitions", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const styles = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const skip = getComputedStyle(document.querySelector(".skip-link")!);
      return {
        scrollBehavior: root.scrollBehavior,
        transitionDuration: Number.parseFloat(skip.transitionDuration || "0")
      };
    });

    expect(styles.scrollBehavior).toBe("auto");
    expect(styles.transitionDuration).toBeLessThanOrEqual(0.01);
  });

  test("homepage does not create horizontal page overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");

    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth
    }));

    expect(overflow.document).toBeLessThanOrEqual(overflow.viewport);
  });
});
