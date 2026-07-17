import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const courseUrls = ["116540417", "181564020", "116438114", "147601243", "147610623"];

test("localized navigation, complete menu and official owner gallery", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Warm spice");
  await page.goto("/en/menu");
  await expect(page.getByText("100 entries", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Drinks" }).click();
  await expect(page.getByText("74 entries", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Lunch" }).click();
  await expect(page.getByText("27 entries", { exact: true })).toBeVisible();
  await page.goto("/ja/gallery");
  await expect(page.locator(".gallery-item")).toHaveCount(55);
  await expect(page.getByRole("button", { name: "料理", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "内観", exact: true })).toBeVisible();
});

test("all five course anchors retain their matching page", async ({ page }) => {
  await page.goto("/en/courses");
  await expect(page.locator(".course-image")).toHaveCount(5);
  await expect(page.locator(".course-image-pending")).toHaveCount(0);
  const links = page.getByRole("link", { name: /View course & reserve/ });
  await expect(links).toHaveCount(5);
  for (let index = 0; index < courseUrls.length; index++) await expect(links.nth(index)).toHaveAttribute("href", new RegExp(`/party/${courseUrls[index]}$`));
});

test("reservation builds the direct official booking URL", async ({ page }) => {
  await page.goto("/en/reservation");
  const dateInput = page.locator('input[type="date"]');
  const date = await dateInput.getAttribute("min");
  expect(date).toBeTruthy();
  await dateInput.fill(date!);
  await page.getByLabel("Preferred time").selectOption("19:30");
  await page.getByLabel("Guests").selectOption("4");
  const opened: string[] = [];
  await page.exposeFunction("recordOpen", (url: string) => opened.push(url));
  await page.evaluate(() => { window.open = (url) => { void (window as unknown as { recordOpen: (value: string) => void }).recordOpen(String(url)); return null; }; });
  await page.getByRole("button", { name: /Check availability/ }).click();
  await expect.poll(() => opened[0]).toBe(`https://tabelog.com/booking/form/new?member=4&rcd=13218334&visit_date=${date!.replaceAll("-", "")}&visit_time=1930&lid=yoyaku_rstdtl_side_calendar`);
});

test("core page has no serious accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
