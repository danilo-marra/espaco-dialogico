import puppeteer from "puppeteer";

describe("Terapeutas Page Tests", () => {
  let browser;
  let page;
  const terapeutasPage = "http://localhost:3000/Dashboard/Terapeutas";
  const api = "http://localhost:3000/api/v1/terapeutas";

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Accessing Terapeutas Page", async () => {
    const response = await fetch(terapeutasPage);
    expect(response.status).toBe(200);
  });

  test("Should render terapeutas layout with menu and header", async () => {
    await page.goto(terapeutasPage);
    const menuComponent = await page.$eval(
      '[data-testid="menu-component"]',
      (el) => el.outerHTML,
    );
    const headerComponent = await page.$eval(
      '[data-testid="header-component"]',
      (el) => el.outerHTML,
    );
    expect(menuComponent).toBeTruthy();
    expect(headerComponent).toBeTruthy();

    // Verify layout structure
    const layout = await page.$eval(".flex.min-h-screen", (el) => ({
      display: window.getComputedStyle(el).display,
      minHeight: window.getComputedStyle(el).minHeight,
    }));

    expect(layout.display).toBe("flex");
  });

  test("Should fetch terapeutas data from API", async () => {
    await page.goto(terapeutasPage);
    const response = await fetch(api);
    const data = await response.json();
    expect(data).toBeTruthy();
  });
});
