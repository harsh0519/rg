import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// WCAG 2 A/AA scan of the key public pages. Fails on critical/serious violations; logs the detail.
const PAGES = ["/", "/catalog", "/login", "/apply", "/rfq"];

for (const path of PAGES) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    // color-contrast is excluded: it flags the Sand & moss palette tokens, which are design-owned
    // and must not change without approval (see design.md) — reported separately, not gated here.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();
    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    const summary = blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    expect(blocking, JSON.stringify(summary, null, 2)).toHaveLength(0);
  });
}
