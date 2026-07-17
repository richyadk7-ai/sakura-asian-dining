import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const courseIds = ["welcome-party-course", "sakura-150-minute-course", "tandoori-bbq-course", "sakura-special-drink-course", "grilled-chicken-drink-course"];

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

test("all five course booking links retain locale and selected course", async ({ page }) => {
  await page.goto("/en/courses");
  await expect(page.locator(".course-image")).toHaveCount(5);
  await expect(page.locator(".course-image-pending")).toHaveCount(0);
  const links = page.getByRole("link", { name: /View course & reserve/ });
  await expect(links).toHaveCount(5);
  for (let index = 0; index < courseIds.length; index++) await expect(links.nth(index)).toHaveAttribute("href", `/en/reservation?course=${courseIds[index]}`);
  await page.goto("/ja/courses");
  const japaneseLinks = page.getByRole("link", { name: /コース詳細・予約/ });
  await expect(japaneseLinks).toHaveCount(5);
  for (let index = 0; index < courseIds.length; index++) await expect(japaneseLinks.nth(index)).toHaveAttribute("href", `/ja/reservation?course=${courseIds[index]}`);
  await page.goto("/en/reservation?course=not-a-real-course");
  await expect(page.locator("form.reservation-request-form").getByLabel("Course", { exact: true })).toHaveValue("");
});

test("existing reservation calls to action open the internal request page", async ({ page }) => {
  await page.goto("/en");
  const internalLinks = page.locator('a[href="/en/reservation"]');
  expect(await internalLinks.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".header-reserve")).toHaveAttribute("href", "/en/reservation");
  await page.goto("/ja");
  await expect(page.locator(".header-reserve")).toHaveAttribute("href", "/ja/reservation");
});

test("customer reservation request validates and shows a private pending confirmation", async ({ page }) => {
  const reference = "SKR-20260720-A1B2C3";
  await page.route("**/api/reservations", async (route) => {
    const request = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ reservation: { reservationReference: reference, courseId: request.courseId, customerName: request.customerName, reservationDate: request.reservationDate, reservationTime: request.reservationTime, guestCount: request.guestCount, status: "pending" }, notificationProviderConfigured: false }),
    });
  });
  await page.goto("/en/reservation?course=welcome-party-course");
  await expect(page.locator("form.reservation-request-form").getByLabel("Course", { exact: true })).toHaveValue("welcome-party-course");
  await page.getByLabel("Full name").fill("Aiko Tanaka");
  await page.getByLabel("Email address").fill("aiko@example.com");
  await page.getByLabel("Phone number").fill("+81 90-1234-5678");
  await page.getByLabel("Preferred time").selectOption("19:30");
  await page.getByLabel("Guests").selectOption("4");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit reservation request" }).click();
  await expect(page).toHaveURL(new RegExp(`/en/reservation/confirmation\\?reference=${reference}$`));
  await expect(page.getByText(reference)).toBeVisible();
  await expect(page.getByText("Aiko Tanaka")).toBeVisible();
  await expect(page.getByText("Welcome & Farewell Party: 8 Dishes, Unlimited Naan & Rice, 120-Minute Drink Plan")).toBeVisible();
  await expect(page.getByText("Pending", { exact: true }).last()).toBeVisible();
  await expect(page.getByText(/not confirmed until Sakura staff review and approve/)).toBeVisible();
});

test("core page has no serious accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});
