import { test, expect } from '@playwright/test';

const errorsFor = (page) => {
  const errors = [];
  page.on('console', (message) => {
    const text = message.text();
    // The local shell has a known optional favicon/analytics 404; keep it out
    // of product runtime-error assertions while still surfacing JS errors.
    const harnessWarning = text.includes('/@id/astro/runtime/client/dev-toolbar/entrypoint.js') || text.includes('disallowed MIME type');
    if (message.type() === 'error' && !text.startsWith('Failed to load resource:') && !harnessWarning) errors.push(`console: ${text}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
};

async function freshPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => { localStorage.clear(); sessionStorage.clear(); });
  const page = await context.newPage();
  return { context, page, errors: errorsFor(page) };
}

async function openVault(page, locale = 'en') {
  await page.goto(`/${locale}/layout-vault/`);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  const consent = page.locator('[data-consent-action="reject"]');
  if (await consent.isVisible().catch(() => false)) {
    // The Astro dev toolbar can overlap the fixed consent widget at 360px in
    // WebKit. Dispatch the real button event and assert the UI still closes.
    await consent.dispatchEvent('click');
    await expect(consent).toBeHidden();
  }
  await expect(page.locator('[data-match-form]')).toBeVisible();
}

async function stepRoom(page, width, length, unit = 'ft') {
  await page.locator('input[name="width"]').fill(String(width));
  await page.locator('input[name="length"]').fill(String(length));
  await page.locator('select[name="unit"]').selectOption(unit);
  await page.locator('[data-match-form] button[type="submit"]').click();
}

async function stepSleep(page, region, bedPreset) {
  await page.locator('select[name="region"]').selectOption(region);
  await expect(page.locator('select[name="bedPreset"]')).toBeVisible();
  await page.locator('select[name="bedPreset"]').selectOption(bedPreset);
  await page.locator('[data-match-form] button[type="submit"]').click();
}

async function chooseFurniture(page, { wardrobe = true, customDesk = false } = {}) {
  const desk = page.locator('input[name="furniture"][value="desk"]');
  if (!(await desk.isChecked())) await desk.check();
  const wardrobeInput = page.locator('input[name="furniture"][value="wardrobe"]');
  if (wardrobe && !(await wardrobeInput.isChecked())) await wardrobeInput.check();
  if (customDesk) {
    await page.locator('input[data-custom-size="desk"]').check();
    await page.locator('input[data-custom-width="desk"]').fill('1400');
    await page.locator('input[data-custom-depth="desk"]').fill('700');
  }
  await page.locator('[data-match-form] button[type="submit"]').click();
}

async function choosePriorities(page, priorities = ['work']) {
  for (const priority of priorities) {
    const input = page.locator(`input[name="priority"][value="${priority}"]`);
    if (!(await input.isChecked())) await input.check();
  }
  await page.locator('[data-match-form] button[type="submit"]').click();
}

async function runFlagship(page) {
  await openVault(page);
  await stepRoom(page, 10, 12, 'ft');
  await stepSleep(page, 'us', 'us-queen');
  await chooseFurniture(page, { wardrobe: true });
  await choosePriorities(page, ['work']);
  await expect(page.locator('.lv-results h2')).toContainText('validated layouts fit your setup');
  await expect(page.locator('.lv-card')).toHaveCount(3);
  const strategies = await page.locator('.lv-card .lv-strategy').allTextContents();
  expect(new Set(strategies).size).toBe(3);
}

async function runCompareAndHandoff(page) {
  await page.locator('input[data-compare]').nth(0).check();
  await page.locator('input[data-compare]').nth(1).check();
  await page.locator('input[data-compare]').nth(2).check();
  await expect(page.locator('.lv-compare-tray')).toContainText('3/3');
  await page.locator('[data-open-compare]').click();
  await expect(page.locator('.lv-compare')).toBeVisible();
  await expect(page.locator('.lv-compare-plan')).toHaveCount(3);
  await page.locator('[data-close-compare]').first().click();
  await page.locator('input[data-compare]').nth(2).uncheck();
  await expect(page.locator('.lv-compare-tray')).toContainText('2/3');
  await page.locator('[data-save]').first().click();
  await page.locator('[data-view="saved"]').click();
  await expect(page.locator('.lv-saved [data-layout-id]')).toHaveCount(1);
  await page.locator('.lv-saved [data-detail]').first().click();
  await expect(page.locator('[data-detail-dialog]')).toBeVisible();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'roomfeng:product-002:planner-handoff:v1') window.name = `rf-handoff:${value}`;
      return original.call(this, key, value);
    };
  });
  await page.locator('[data-handoff]').click();
  await expect(page).toHaveURL(/\/en\/room-layout-planner\/\?rf_handoff=1$/);
  const handoffText = await page.evaluate(() => window.name.startsWith('rf-handoff:') ? window.name.slice('rf-handoff:'.length) : '');
  const handoff = JSON.parse(handoffText || 'null');
  expect(handoff).toMatchObject({ mode: 'create-new', source: 'layout-vault' });
  expect(handoff.room.widthMm).toBeGreaterThan(0);
  expect(handoff.items.length).toBeGreaterThan(0);
  expect(handoff.items.every((item) => typeof item.rotationDeg === 'number')).toBe(true);
  await expect(page.locator('[data-planner]')).toBeVisible();
  await expect(page.locator('body')).toContainText('Planner');
}

test('flagship Matcher → Top 3 → Compare → Favorite → Planner handoff', async ({ browser, browserName }) => {
  const { context, page, errors } = await freshPage(browser);
  try {
    await runFlagship(page);
    await runCompareAndHandoff(page);
    expect(errors, `${browserName} PRODUCT-002 runtime errors`).toEqual([]);
  } finally { await context.close(); }
});

test('Taiwan regional preset, custom furniture, and honest no-match', async ({ browser, browserName }) => {
  test.skip(browserName !== 'firefox', 'One non-Chromium browser is sufficient for the supplemental cases.');
  const { context, page, errors } = await freshPage(browser);
  try {
    await openVault(page);
    await stepRoom(page, 300, 300, 'cm');
    await stepSleep(page, 'tw', 'tw-5-ft');
    await chooseFurniture(page, { wardrobe: true });
    await choosePriorities(page, ['work']);
    await expect(page.locator('.lv-setup-strip')).toContainText('5');
    await expect(page.locator('.lv-results, .lv-no-match')).toHaveCount(1);

    await openVault(page);
    await stepRoom(page, 10, 12, 'ft');
    await stepSleep(page, 'us', 'us-queen');
    await chooseFurniture(page, { wardrobe: true, customDesk: true });
    await choosePriorities(page, ['work']);
    await expect(page.locator('.lv-results, .lv-no-match')).toHaveCount(1);

    await openVault(page);
    await stepRoom(page, 1.8, 1.8, 'm');
    await stepSleep(page, 'us', 'us-queen');
    await chooseFurniture(page, { wardrobe: true, customDesk: true });
    await choosePriorities(page, ['work']);
    await expect(page.locator('.lv-no-match')).toContainText("We don't have a validated layout");
    expect(errors, `${browserName} supplemental runtime errors`).toEqual([]);
  } finally { await context.close(); }
});

test('WebKit mobile equivalent at 360×800 has no horizontal overflow', async ({ browser, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit mobile emulation is the required mobile equivalent.');
  const { context, page, errors } = await freshPage(browser, { width: 360, height: 800 });
  try {
    await runFlagship(page);
    await expect(page.locator('.lv-card').first()).toBeVisible();
    await page.locator('[data-detail]').first().click();
    await expect(page.locator('[data-detail-dialog]')).toBeVisible();
    await page.locator('[data-close-detail]').click();
    await page.locator('input[data-compare]').first().check();
    await page.locator('[data-open-compare]').click();
    await expect(page.locator('.lv-compare')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors, `${browserName} mobile runtime errors`).toEqual([]);
  } finally { await context.close(); }
});
