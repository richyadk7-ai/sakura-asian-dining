import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const courseIds = ["welcome-party-course", "sakura-150-minute-course", "tandoori-bbq-course", "sakura-special-drink-course", "grilled-chicken-drink-course"];

test("localized navigation, complete menu and official owner gallery", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Indian & Nepalese dining, made for Tokyo nights.");
  await expect(page.locator(".fire-hero-media img")).toHaveCount(1);
  await expect(page.locator(".popular-dish-card")).toHaveCount(6);
  const heroPhotoSource = await page.locator(".fire-hero-media img").evaluate((image) => decodeURIComponent((image as HTMLImageElement).currentSrc));
  expect(heroPhotoSource).toContain("/images/originals/food/food-030.jpg");
  await page.goto("/en/menu");
  await expect(page.locator(".menu-curry-feature img")).toHaveAttribute("alt", "Seven richly colored Indian curries presented in metal serving bowls with warm spice and steam");
  await expect(page.locator(".menu-featured-grid > button")).toHaveCount(6);
  await expect(page.getByText("100 entries", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Menu Photos" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Drinks" }).click();
  await expect(page.getByText("74 entries", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Lunch" }).click();
  await expect(page.getByText("27 entries", { exact: true })).toBeVisible();
  await page.goto("/ja/menu");
  await expect(page.getByRole("tab", { name: "メニュー写真" })).toHaveCount(0);
  await page.goto("/ja/gallery");
  await expect(page.locator(".gallery-item")).toHaveCount(12);
  await page.getByRole("button", { name: "さらに表示" }).click();
  await expect(page.locator(".gallery-item")).toHaveCount(24);
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
  const details = page.locator("[data-course-details]");
  await expect(details).toHaveCount(5);
  await details.first().locator("summary").click();
  await expect(details.first().getByRole("heading", { name: "Course contents" })).toBeVisible();
  await expect(details.first().getByText("Seasonal green salad", { exact: true })).toBeVisible();
  await expect(details.first().getByRole("heading", { name: "Included drink plan" })).toBeVisible();
  await expect(details.first().getByRole("heading", { name: "Conditions & timing" })).toBeVisible();
  await expect(details.first().locator('a[href^="http"]')).toHaveCount(0);
  await page.goto("/ja/courses");
  const japaneseLinks = page.getByRole("link", { name: /コース詳細・予約/ });
  await expect(japaneseLinks).toHaveCount(5);
  for (let index = 0; index < courseIds.length; index++) await expect(japaneseLinks.nth(index)).toHaveAttribute("href", `/ja/reservation?course=${courseIds[index]}`);
  const japaneseDetails = page.locator("[data-course-details]");
  await japaneseDetails.first().locator("summary").click();
  await expect(japaneseDetails.first().getByRole("heading", { name: "コース料理" })).toBeVisible();
  await expect(japaneseDetails.first().getByText("季節野菜のグリーンサラダ", { exact: true })).toBeVisible();
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

test("sakura motion scales for iPhone and respects reduced-motion preferences", async ({ page }, testInfo) => {
  await page.goto("/en");
  const petals = page.locator(".finale-petals i");
  await expect(petals).toHaveCount(9);
  await expect(page.locator(".scroll-progress-fill")).toHaveCount(1);
  await expect(page.locator(".scroll-cinema")).toHaveCount(0);
  await expect(page.locator("[data-scroll-chapter]")).toHaveCount(8);
  await expect(page.locator("[data-scroll-reveal]").first()).toBeVisible();
  await expect(page.locator(".hero-motion-reel video")).toHaveAttribute("poster", "/images/originals/food/food-030.jpg");
  await expect(page.locator(".hero-motion-reel source")).toHaveCount(2);
  await expect(page.locator('.hero-motion-reel source[src="/videos/sakura-kitchen-reel.webm"]')).toHaveCount(1);
  await expect(page.locator('.hero-motion-reel source[src="/videos/sakura-kitchen-reel.mp4"]')).toHaveCount(1);
  await expect(page.locator(".hero-motion-screen button")).toBeVisible();
  await expect(page.locator(".home-film video")).toHaveAttribute("poster", "/videos/sakura-dining-cinematic-poster.jpg");
  await expect(page.locator('.home-film source[src="/videos/sakura-dining-cinematic.mp4"]')).toHaveCount(1);
  await expect(page.locator(".home-film video")).toHaveAttribute("muted", "");
  await expect(page.locator(".home-film video")).toHaveAttribute("loop", "");
  await expect(page.locator(".home-film video")).toHaveAttribute("playsinline", "");
  if (testInfo.project.name === "chromium") {
    await page.mouse.move(280, 320);
    await expect(page.locator("html")).not.toHaveAttribute("data-sakura-cursor", "true");
    await expect(page.locator(".sakura-cursor")).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerdown", { button: 0, pointerType: "mouse", clientX: 40, clientY: 320 })));
  } else {
    await expect(page.locator("html")).not.toHaveAttribute("data-sakura-cursor", "true");
    await page.touchscreen.tap(195, 320);
    await expect(page.locator(".touch-reactor")).toHaveCount(0);
  }
  await expect(page.locator(".interaction-burst")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".sakura-cursor")).toHaveCount(0);
  await expect(page.locator(".fire-hero-media")).toBeVisible();
  await expect(page.locator(".touch-reactor")).toHaveCount(0);
  await expect(page.locator(".mobile-action-dock")).toHaveCSS("border-radius", "16px");
  await expect(page.locator(".mobile-action-dock a")).toHaveCount(3);
  await expect(page.locator(".scroll-chapter-meter")).toHaveCount(0);
  const mobileHeroBox = await page.locator(".fire-hero").boundingBox();
  expect(mobileHeroBox?.height ?? 0).toBeGreaterThanOrEqual(844);
  const viewportWidths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(viewportWidths.document).toBeLessThanOrEqual(viewportWidths.viewport);

  await page.goto("/ja");
  const japaneseHeadlineMetrics = await page.locator(".fire-hero h1").evaluate((headline) => {
    const styles = getComputedStyle(headline);
    return { fontSize: Number.parseFloat(styles.fontSize), height: headline.getBoundingClientRect().height };
  });
  expect(japaneseHeadlineMetrics.fontSize).toBeLessThanOrEqual(60);
  expect(japaneseHeadlineMetrics.height).toBeLessThan(250);
  await page.goto("/en");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".finale-petals")).toHaveCSS("display", "none");
  await expect(page.locator(".film-grain")).toHaveCSS("display", "none");
  await expect(page.locator(".hero-interaction-hint")).toHaveCount(0);
  await expect(page.locator(".scroll-cinema-orbit")).toHaveCount(0);
  await expect(page.locator(".hero-motion-screen button")).toHaveAccessibleName("Play restaurant film");
  await expect(page.locator(".home-film video")).toHaveCSS("display", "none");
  await expect(page.locator(".home-film-poster")).toBeVisible();
});

test("the homepage uses one signature scroll experience without a duplicate food spotlight", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("[data-dish-scroll-section]")).toHaveCount(0);
  await expect(page.locator("[data-dish-3d-section]")).toHaveCount(1);
});

test("the optimized signature dish model follows scroll on desktop and iPhone", async ({ page }, testInfo) => {
  await page.goto("/en");
  const section = page.locator("[data-dish-3d-section]");
  const sticky = section.locator(".dish3d-sticky");
  const copy = section.locator(".dish3d-copy");
  const canvas = section.locator("canvas");

  await expect(section).toHaveCount(1);
  await expect(sticky).toHaveCSS("position", "sticky");
  await expect(copy.getByRole("heading", { name: "Maharaja Set" })).toBeAttached();
  await expect(copy).toContainText("¥1,899");
  await expect(copy.locator('a[href="/en/menu"]')).toHaveCount(1);
  await expect(copy.locator('a[href="/en/reservation"]')).toHaveCount(1);

  const modelResponse = await page.request.get("/models/signature-dish.glb");
  expect(modelResponse.ok()).toBe(true);
  expect(Number(modelResponse.headers()["content-length"] ?? 0)).toBeLessThan(4_000_000);

  const dimensions = await section.evaluate((element) => ({
    section: element.getBoundingClientRect().height,
    viewport: window.innerHeight,
    width: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    top: element.getBoundingClientRect().top + window.scrollY,
  }));
  expect(dimensions.section / dimensions.viewport).toBeGreaterThan(testInfo.project.name === "mobile" ? 1.7 : 2.7);
  expect(dimensions.section / dimensions.viewport).toBeLessThan(testInfo.project.name === "mobile" ? 1.9 : 2.9);
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth);

  await page.evaluate((top) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, top + 4);
  }, dimensions.top);
  await expect(section).toHaveAttribute("data-model-ready", "true", { timeout: 20_000 });
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveCSS("pointer-events", "none");

  await page.evaluate(({ top, sectionHeight, viewportHeight }) => {
    window.scrollTo(0, top + sectionHeight - viewportHeight - 5);
  }, { top: dimensions.top, sectionHeight: dimensions.section, viewportHeight: dimensions.viewport });
  await page.waitForTimeout(1_000);
  expect(Number.parseFloat(await copy.evaluate((element) => getComputedStyle(element).opacity))).toBeGreaterThan(0.9);
  const copyBox = await copy.boundingBox();
  expect(copyBox?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((copyBox?.x ?? 0) + (copyBox?.width ?? 0)).toBeLessThanOrEqual(dimensions.viewportWidth);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(sticky).toHaveCSS("position", "relative");
  await expect(copy).toHaveCSS("opacity", "1");
  const reducedDimensions = await section.evaluate((element) => ({ section: element.getBoundingClientRect().height, viewport: window.innerHeight }));
  expect(reducedDimensions.section).toBeLessThanOrEqual(reducedDimensions.viewport * 1.2);
});

test("reservation and admin cinematic shells stay responsive", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/reservation?course=welcome-party-course");
  await expect(page.locator(".reservation-panel-ornament")).toHaveCount(1);
  await expect(page.locator("form.reservation-request-form").getByLabel("Course", { exact: true })).toHaveValue("welcome-party-course");
  let widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);

  await page.goto("/admin");
  await expect(page.locator(".admin-auth-card")).toHaveCount(1);
  await expect(page.locator(".admin-atmosphere")).toHaveCount(1);
  await expect(page.locator("[data-sakura-petals]")).toHaveCount(1);
  widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});

test("customer reservation request validates and shows a private pending confirmation", async ({ page }) => {
  const reference = "SKR-20260720-A1B2C3";
  let submissionRequests = 0;
  await page.route("**/api/reservations", async (route) => {
    submissionRequests += 1;
    const request = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ reservation: { reservationReference: reference, courseId: request.courseId, customerName: request.customerName, reservationDate: request.reservationDate, reservationTime: request.reservationTime, guestCount: request.guestCount, status: "pending" }, notificationProviderConfigured: false }),
    });
  });
  await page.goto("/en/reservation?course=welcome-party-course");
  await expect(page.locator("form.reservation-request-form").getByLabel("Course", { exact: true })).toHaveValue("welcome-party-course");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Aiko Tanaka");
  await page.getByLabel("Email address").fill("aiko@example.com");
  await page.getByLabel("Phone number").fill("+81 90-1234-5678");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit reservation request" }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(new RegExp(`/en/reservation/confirmation\\?reference=${reference}&token=[0-9a-f-]{36}$`));
  expect(submissionRequests).toBe(1);
  await expect(page.getByText(reference)).toBeVisible();
  await expect(page.getByText("Aiko Tanaka")).toBeVisible();
  await expect(page.getByText("Welcome & Farewell Party: 8 Dishes, Unlimited Naan & Rice, 120-Minute Drink Plan")).toBeVisible();
  await expect(page.getByText("Pending", { exact: true }).last()).toBeVisible();
  await expect(page.getByText(/not confirmed until Sakura staff review and approve/)).toBeVisible();
});

test("Japanese reservation reaches the localized review step without changing the four-step flow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ja/reservation?course=welcome-party-course");
  await expect(page.locator("form.reservation-request-form").getByLabel("コース", { exact: true })).toHaveValue("welcome-party-course");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await page.getByLabel("お名前", { exact: true }).fill("テスト 太郎");
  await page.getByLabel("メールアドレス", { exact: true }).fill("test@example.com");
  await page.getByLabel("電話番号", { exact: true }).fill("09012345678");
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await page.getByRole("button", { name: "次へ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "予約内容をご確認ください" })).toBeVisible();
  await expect(page.getByText("テスト 太郎")).toBeVisible();
  await expect(page.getByText("【歓送迎会に♪】ポテトやミックスグリルなど全8品◇ナン＆ライスが食べ放題のお得なコース＋120分60種以上飲み放題付")).toBeVisible();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
});

test("Access address controls remain legible and provide copy feedback", async ({ page }) => {
  await page.goto("/en/access");
  const card = page.locator(".access-actions");
  const copyButton = page.getByRole("button", { name: "Copy address" });
  await expect(card).toHaveCSS("opacity", "1");
  await expect(card).toHaveCSS("color", "rgb(48, 41, 35)");
  await expect(copyButton).toHaveCSS("color", "rgb(48, 41, 35)");
  await copyButton.click();
  await expect(page.getByRole("button", { name: "Address copied" })).toBeVisible();
});

test("core page has no serious accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("every localized public route succeeds and private routes stay out of public discovery", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "One browser is sufficient for HTTP route coverage.");
  const publicPaths = ["", "about", "access", "courses", "gallery", "menu", "privacy", "reservation", "reservation/confirmation"];
  for (const locale of ["en", "ja"] as const) {
    for (const path of publicPaths) {
      const response = await request.get(`/${locale}${path ? `/${path}` : ""}`);
      expect(response.status(), `${locale}/${path}`).toBe(200);
    }
  }

  await page.goto("/en");
  await expect(page.locator('footer a[href^="/admin"]')).toHaveCount(0);
  const adminResponse = await request.get("/admin");
  expect(await adminResponse.text()).toMatch(/<meta name="robots" content="noindex, nofollow/);
  const protectedResponse = await request.post("/api/admin/reservations/status", { data: { id: "22222222-2222-4222-8222-222222222222", status: "confirmed" } });
  expect(protectedResponse.status()).toBe(401);
});

test("language switching keeps the equivalent route and selected course", async ({ page }) => {
  await page.goto("/en/reservation?course=welcome-party-course");
  await page.locator(".language-link").click();
  await expect(page).toHaveURL(/\/ja\/reservation\?course=welcome-party-course$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("form.reservation-request-form").getByLabel("コース", { exact: true })).toHaveValue("welcome-party-course");
  await page.locator(".language-link").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("mobile navigation traps focus, closes cleanly and restores scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(dialog.getByRole("button", { name: "Close navigation" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(toggle).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("menu URL state and gallery keyboard controls remain usable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "One browser is sufficient for interaction coverage.");
  await page.goto("/en/menu?section=drinks&q=wine");
  await expect(page.getByRole("tab", { name: "Drinks" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("textbox", { name: "Search the menu" })).toHaveValue("wine");
  await page.getByRole("tab", { name: "Food" }).click();
  await expect(page).toHaveURL("/en/menu");

  await page.goto("/en/gallery");
  const firstPhoto = page.locator(".gallery-item").first();
  await firstPhoto.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".lightbox-counter")).toContainText("Photograph 1 of 12");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".lightbox-counter")).toContainText("Photograph 2 of 12");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(firstPhoto).toBeFocused();
});

test("homepage has no horizontal overflow across production breakpoints", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The desktop project exercises all requested viewport widths.");
  for (const width of [320, 375, 430, 768, 1024, 1280, 1366, 1440, 1536, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.goto("/en");
    const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document, `${width}px`).toBeLessThanOrEqual(dimensions.viewport);
  }
});

test("modified English and Japanese pages stay inside the viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The desktop project exercises the representative route matrix.");
  const paths = ["menu", "courses", "gallery", "access", "reservation", "about"];
  for (const locale of ["en", "ja"] as const) {
    for (const path of paths) {
      for (const width of [320, 768, 1024, 1366]) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.goto(`/${locale}/${path}`);
        const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
        expect(dimensions.document, `${locale}/${path} at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
      }
    }
  }
});
