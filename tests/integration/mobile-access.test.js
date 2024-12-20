import puppeteer from 'puppeteer';

describe('Mobile Access Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.emulate(puppeteer.devices['iPhone X']);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Accessing Dashboard Home Page on Mobile', async () => {
    await page.goto('http://localhost:3000/dashboard');
    const content = await page.content();
    expect(content).toContain('Menu');
    expect(content).toContain('Header');
  });

  test('Accessing Home Page on Mobile', async () => {
    await page.goto('http://localhost:3000/');
    const content = await page.content();
    expect(content).toContain('Home');
  });

  test('Accessing Agenda Page on Mobile', async () => {
    await page.goto('http://localhost:3000/agenda');
    const content = await page.content();
    expect(content).toContain('Agenda');
  });

  test('Accessing Transações Page on Mobile', async () => {
    await page.goto('http://localhost:3000/transacoes');
    const content = await page.content();
    expect(content).toContain('Transações');
  });

  test('Accessing Pacientes Page on Mobile', async () => {
    await page.goto('http://localhost:3000/pacientes');
    const content = await page.content();
    expect(content).toContain('Pacientes');
  });

  test('Accessing Sessões Page on Mobile', async () => {
    await page.goto('http://localhost:3000/sessoes');
    const content = await page.content();
    expect(content).toContain('Sessões');
  });

  test('Accessing Terapeutas Page on Mobile', async () => {
    await page.goto('http://localhost:3000/terapeutas');
    const content = await page.content();
    expect(content).toContain('Terapeutas');
  });
});
