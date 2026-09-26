import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('assets', { recursive: true });
await mkdir('qa', { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('https://glsl-effects-showcase.pages.dev/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(5000);
  const captureStudy = async name => {
    const box = await page.locator('.preview-header').boundingBox();
    const top = box.y + box.height + 10;
    await page.screenshot({ path: `assets/${name}.jpg`, type: 'jpeg', quality: 90, clip: { x: box.x, y: top, width: box.width, height: 900 - top - 35 } });
  };
  await page.screenshot({ path: 'assets/glsl-showcase.jpg', type: 'jpeg', quality: 90 });
  await writeFile('qa/reference-content.txt', await page.locator('body').innerText());
  await captureStudy('lilian-loom');
  await page.getByTestId('effect-fluid-chrome-stream').click();
  await page.waitForTimeout(1800);
  await page.mouse.move(650, 460);
  await page.mouse.move(910, 520, { steps: 15 });
  await captureStudy('gesture-cut');
  await page.getByRole('button', { name: /Aquatic/ }).click();
  await page.getByTestId('effect-kelp-current').click();
  await page.waitForTimeout(2500);
  await captureStudy('botanical-tide');
  console.log('Captured live website and three real studies: Lilian Kaleido Loom, Gesture Cut Field, Botanical Tide.');
} finally { await browser.close(); }
