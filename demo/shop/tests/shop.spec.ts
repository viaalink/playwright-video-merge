import { test, expect, type Page } from '@playwright/test';
import { resolve } from 'node:path';

const site = (page: string) => `file://${resolve(__dirname, '../site', page)}`;
const slowly = (page: Page, ms = 700) => page.waitForTimeout(ms);

test.describe('Shop', () => {
  test('adds a product to the cart', async ({ page }) => {
    await page.goto(site('index.html'));
    await slowly(page);
    await page.getByRole('button', { name: 'Add Desk lamp' }).click();
    await expect(page.getByTestId('cart')).toHaveText('Cart (1)');
    await slowly(page, 1200);
  });

  test('checks out with a card', async ({ page }) => {
    await page.goto(site('index.html'));
    await page.getByRole('button', { name: 'Add Notebook' }).click();
    await page.getByRole('link', { name: /Cart/ }).click();
    await page.getByLabel('Card number').pressSequentially('4242 4242 4242 4242', { delay: 40 });
    await page.getByRole('button', { name: 'Pay' }).click();
    await expect(page.getByRole('heading', { name: 'Thank you for your order' })).toBeVisible();
    await slowly(page, 1200);
  });
});

test('customer and support agent open the same chat', async ({ browser }) => {
  const recordVideo = { dir: test.info().outputPath(), size: { width: 1280, height: 720 } };
  const customer = await browser.newContext({ recordVideo, viewport: { width: 1280, height: 720 } });
  const agent = await browser.newContext({ recordVideo, viewport: { width: 1280, height: 720 } });

  for (const [ctx, who, text] of [
    [customer, 'Customer', 'Where is my order?'],
    [agent, 'Support', 'It ships today!'],
  ] as const) {
    const page = await ctx.newPage();
    await page.goto(`${site('chat.html')}?as=${who}`);
    await page.getByRole('textbox').pressSequentially(text, { delay: 50 });
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listitem').last()).toContainText(text);
    await slowly(page, 900);
  }
  await customer.close();
  await agent.close();
});

test('search finds a product', async ({ page }) => {
  await page.goto(site('index.html'));
  await page.getByRole('searchbox').pressSequentially('lamp', { delay: 80 });
  await expect(page.getByRole('article')).toHaveCount(1);
  await slowly(page, 1200);
});
