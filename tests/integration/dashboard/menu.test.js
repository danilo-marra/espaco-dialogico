import puppeteer from "puppeteer";

describe("Menu Navigation Tests", () => {
  let browser;
  let page;

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

  test("should navigate to Agenda page when clicking menu link", async () => {
    await page.goto("http://localhost:3000/dashboard");
    await page.click('a[href="/dashboard/agenda"]');
    await page.waitForNavigation();
    expect(page.url()).toBe("http://localhost:3000/dashboard/agenda");
  });

  test("should navigate to Home page when clicking menu link", async () => {
    await page.goto("http://localhost:3000/dashboard");
    await page.click('a[href="/dashboard"]');
    await page.waitForNavigation();
    expect(page.url()).toBe("http://localhost:3000/dashboard");
  });

  test("should navigate to Transações page when clicking menu link", async () => {
    await page.goto("http://localhost:3000/dashboard");
    await page.click('a[href="/dashboard/transacoes"]');
    await page.waitForNavigation();
    expect(page.url()).toBe("http://localhost:3000/dashboard/transacoes");
  });

  test("should navigate to Pacientes page when clicking menu link", async () => {
    await page.goto("http://localhost:3000/dashboard");
    await page.click('a[href="/dashboard/pacientes"]');
    await page.waitForNavigation();
    expect(page.url()).toBe("http://localhost:3000/dashboard/pacientes");
  });

  test("should navigate to Sessões page when clicking menu link", async () => {
    await page.goto("http://localhost:3000/dashboard");
    await page.click('a[href="/dashboard/sessoes"]');
    await page.waitForNavigation();
    expect(page.url()).toBe("http://localhost:3000/dashboard/sessoes");
  });

  test("should navigate to Terapeutas page when clicking menu link", async () => {
    await page.goto("http://localhost:3000/dashboard");
    await page.click('a[href="/dashboard/terapeutas"]');
    await page.waitForNavigation();
    expect(page.url()).toBe("http://localhost:3000/dashboard/terapeutas");
  });

  test("should render dashboard layout with menu and header", async () => {
    await page.goto("http://localhost:3000/dashboard");
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

  test("should render agenda layout with menu and header", async () => {
    await page.goto("http://localhost:3000/dashboard/agenda");
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

  test("should render transacoes layout with menu and header", async () => {
    await page.goto("http://localhost:3000/dashboard/transacoes");
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

  test("should render pacientes layout with menu and header", async () => {
    await page.goto("http://localhost:3000/dashboard/pacientes");
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

  test("should render sessoes layout with menu and header", async () => {
    await page.goto("http://localhost:3000/dashboard/sessoes");
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

  test("should render terapeutas layout with menu and header", async () => {
    await page.goto("http://localhost:3000/dashboard/terapeutas");
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
});
