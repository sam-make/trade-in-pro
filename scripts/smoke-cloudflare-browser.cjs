/* Browser smoke test: no user credentials, no writes, no customer data. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("/tmp/trade-in-playwright/node_modules/playwright-core");

const base = "https://migration-cloudflare-trade-in-pro.samysamsung695.workers.dev";
const expectedProject = "https://xuvaihwygkcwriqfnkbg.supabase.co";

async function audit() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const cases = [
    ["/", "Trade-In Pro"],
    ["/connexion", "Connexion"],
    ["/inscription", "Créer un espace boutique"],
    ["/mot-de-passe-oublie", "Mot de passe"],
    ["/reset-password", "mot de passe"],
    ["/mentions-legales", "mentions"],
    ["/confidentialite", "confidentialité"],
    ["/cgv", "conditions"],
  ];
  let passed = 0;
  fs.mkdirSync("audit-artifacts", { recursive: true });

  try {
    for (const mode of ["desktop", "mobile"]) {
      const context = await browser.newContext({
        viewport: mode === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        isMobile: mode === "mobile",
        hasTouch: mode === "mobile",
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on("pageerror", () => pageErrors.push("client exception"));

      for (const [path, expectedText] of cases) {
        const response = await page.goto(base + path, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        assert.equal(response?.status(), 200, mode + " " + path + " HTTP");
        await page.locator("body").waitFor({ timeout: 10000 });
        await page.waitForTimeout(250);
        const title = await page.title();
        assert.match(title, /Trade-In Pro/i, mode + " " + path + " title");
        const bodyText = (await page.locator("body").innerText()).toLowerCase();
        assert.ok(
          bodyText.includes(expectedText.toLowerCase()),
          mode + " " + path + " expected content absent",
        );
        const publicUrl = await page
          .locator('meta[name="trade-in-supabase-url"]')
          .getAttribute("content");
        assert.equal(publicUrl, expectedProject, mode + " " + path + " wrong Supabase target");
        const pubKey = await page
          .locator('meta[name="trade-in-supabase-publishable-key"]')
          .getAttribute("content");
        assert.ok(pubKey?.startsWith("sb_publishable_"), mode + " " + path + " no public key");
        assert.equal(pageErrors.length, 0, mode + " " + path + " JS error");

        if (mode === "mobile") {
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          assert.ok(overflow <= 2, mode + " " + path + " horizontal overflow");
        }
        if (path === "/connexion") {
          assert.equal(await page.locator('input[type="email"]').count(), 1);
          assert.equal(await page.locator('input[type="password"]').count(), 1);
        }
        if (path === "/inscription") {
          assert.ok((await page.locator('input[type="password"]').count()) >= 1);
        }
        if (path === "/") {
          // Reveal animations are viewport-triggered: actually scroll the page.
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          const step = mode === "mobile" ? 420 : 600;
          for (let scrollY = 0; scrollY < height; scrollY += step) {
            await page.evaluate((y) => window.scrollTo(0, y), scrollY);
            await page.waitForTimeout(80);
          }
          await page.waitForTimeout(550);
          const hiddenReveals = await page.locator(".motion-reveal:not(.motion-visible)").count();
          assert.equal(hiddenReveals, 0, mode + " unrevealed landing-page content");
          await page.evaluate(() => window.scrollTo(0, 0));
          console.log(mode + ": sections dévoilées correctement au défilement");
        }
        if (["/", "/connexion", "/inscription"].includes(path)) {
          const pageName = path === "/" ? "accueil" : path.slice(1);
          await page.screenshot({
            path: "audit-artifacts/" + mode + "-" + pageName + ".png",
            fullPage: true,
            animations: "disabled",
          });
        }
        console.log(mode + " " + path + ": HTTP 200, contenu et configuration client OK");
        passed++;
      }

      await page.goto(base + "/connexion", { waitUntil: "domcontentloaded" });
      const forgotLink = page.getByRole("link", { name: /mot de passe oublié/i });
      await forgotLink.click({ timeout: 10000 });
      await page.waitForURL("**/mot-de-passe-oublie", { timeout: 15000 });
      console.log(mode + ": navigation Connexion → Mot de passe oublié OK");
      passed++;

      // Verify unauthenticated browsers cannot reach the shop or owner pages.
      for (const protectedPath of [
        "/tableau-de-bord",
        "/clients",
        "/reparations",
        "/estimation",
        "/admin",
      ]) {
        await page.goto(base + protectedPath, { waitUntil: "domcontentloaded" });
        await page.waitForURL("**/connexion", { timeout: 15000 });
        await page.locator('input[type="email"]').waitFor({
          state: "visible",
          timeout: 10000,
        });
        assert.equal(
          await page.locator('input[type="password"]').count(),
          1,
          mode + " " + protectedPath + " missing login form",
        );
        console.log(mode + " " + protectedPath + ": access refused without session");
        passed++;
      }

      // Browser-native validation: invalid empty login must not send an Auth request.
      await page.goto(base + "/connexion", { waitUntil: "domcontentloaded" });
      await page.locator('button[type="submit"]').click();
      const emailMissing = await page.locator('input[type="email"]').evaluate((input) => {
        return input.validity.valueMissing;
      });
      assert.equal(emailMissing, true, mode + " missing required email was accepted");
      console.log(mode + ": empty login blocked by form validation");
      passed++;

      const response = await context.request.get(base + "/sitemap.xml", { timeout: 25000 });
      assert.equal(response.status(), 200, mode + " sitemap HTTP");
      const xml = await response.text();
      assert.ok(xml.includes("<urlset"), mode + " sitemap XML missing");
      assert.ok(
        !xml.includes("/tableau-de-bord") && !xml.includes("/admin"),
        "private routes in sitemap",
      );
      console.log(mode + ": sitemap accessible sans routes privées");
      passed++;

      await context.close();
    }
    console.log("Test navigateur réel Chrome : " + passed + " contrôles réussis.");
  } finally {
    await browser.close();
  }
}

audit().catch((error) => {
  const message = String(error.message || error).replace(
    /sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g,
    "[redacted]",
  );
  console.error("Audit navigateur échoué :", message.slice(0, 500));
  process.exitCode = 1;
});
