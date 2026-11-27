#!/usr/bin/env node
/**
 * 各页面截图：vite preview + Playwright（本机缓存的 Chromium）。
 * 用法：先 npm run build，再 node scripts/screenshots.mjs。
 * 产物：docs/screenshots/*.png（4 张：排班周视图、批量生成弹窗、预约名单、同步异常）。
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const ROOT = new URL('..', import.meta.url).pathname;
const BASE = 'http://127.0.0.1:4173';
const CHROME =
  '/home/hatch/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const SHOTS = 'docs/screenshots';

async function waitReady(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // 未起服，继续等
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('vite preview 未在 20 秒内就绪');
}

const preview = spawn(
  'npx',
  ['vite', 'preview', '--port', '4173', '--strictPort', '--host', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' },
);
try {
  await waitReady();
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  async function shot(name, hash, ready) {
    await page.goto(`${BASE}/${hash}`);
    await ready();
    await page.screenshot({ path: `${ROOT}${SHOTS}/${name}.png` });
    console.log(`shot: ${name}.png`);
  }

  await shot('schedule-week', '#/schedule', async () => {
    await page.waitForSelector('[data-testid="schedule-table"]');
  });
  await shot('schedule-batch-modal', '#/schedule', async () => {
    await page.waitForSelector('[data-testid="schedule-table"]');
    await page.getByTestId('batch-generate-button').click();
    await page.waitForSelector('[data-testid="batch-modal"]');
  });
  await shot('booking-list', '#/bookings', async () => {
    await page.waitForSelector('[data-testid="booking-table"]');
  });
  await shot('sync-errors', '#/sync-errors', async () => {
    await page.waitForSelector('[data-testid="sync-table"]');
  });

  await browser.close();
  console.log('SCREENSHOTS: PASS (4 张)');
} finally {
  preview.kill('SIGTERM');
}
