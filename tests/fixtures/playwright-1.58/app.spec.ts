import { test, expect } from '@playwright/test';
const page1 = (t: string, bg: string) => `data:text/html,<body style="background:${bg};font:48px sans-serif;display:grid;place-items:center;height:100vh;margin:0"><h1>${t}</h1></body>`;
test.describe('Checkout', () => {
  test('adds an item to the cart', async ({ page }) => {
    await page.goto(page1('Cart', '%23cde'));
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).toHaveText('Cart');
  });
  test('shows a very long test title that Playwright will have to shorten in the folder name because it goes on and on', async ({ page }) => {
    await page.goto(page1('Long', '%23edc'));
    await page.waitForTimeout(1500);
  });
});
test('two users chat with each other', async ({ browser }) => {
  const a = await browser.newContext({ recordVideo: { dir: test.info().outputPath() , size: { width: 1280, height: 720 } } });
  const b = await browser.newContext({ recordVideo: { dir: test.info().outputPath() , size: { width: 1280, height: 720 } } });
  const pa = await a.newPage(); const pb = await b.newPage();
  await pa.goto(page1('Alice', '%23dec')); await pb.goto(page1('Bob', '%23cee'));
  await pa.waitForTimeout(1500);
  await a.close(); await b.close();
});
test('A: runs first in the file', async ({ page }) => {
  await page.goto(page1('First?', '%23eee'));
  await page.waitForTimeout(1000);
});
