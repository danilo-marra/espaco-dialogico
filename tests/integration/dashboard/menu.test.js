import puppeteer from "puppeteer";

describe("Menu Navigation Tests", () => {
  let browser;
  let page;
  const dashboardURL = "http://localhost:3000/Dashboard/";

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
    await page.goto(dashboardURL);
    await page.click('a[href="/Dashboard/Agenda"]');
    await page.waitForNavigation();
    expect(page.url()).toBe(`${dashboardURL}Agenda`);
  });

  test("should navigate to Transações page when clicking menu link", async () => {
    await page.goto(dashboardURL);
    await page.click('a[href="/Dashboard/Transacoes"]');
    await page.waitForNavigation();
    expect(page.url()).toBe(`${dashboardURL}Transacoes`);
  });

  test("should navigate to Pacientes page when clicking menu link", async () => {
    await page.goto(dashboardURL);
    await page.click('a[href="/Dashboard/Pacientes"]');
    await page.waitForNavigation();
    expect(page.url()).toBe(`${dashboardURL}Pacientes`);
  });

  test("should navigate to Sessões page when clicking menu link", async () => {
    await page.goto(dashboardURL);
    await page.click('a[href="/Dashboard/Sessoes"]');
    await page.waitForNavigation();
    expect(page.url()).toBe(`${dashboardURL}Sessoes`);
  });

  test("should navigate to Terapeutas page when clicking menu link", async () => {
    await page.goto(dashboardURL);
    await page.click('a[href="/Dashboard/Terapeutas"]');
    await page.waitForNavigation();
    expect(page.url()).toBe(`${dashboardURL}Terapeutas`);
  });
});
