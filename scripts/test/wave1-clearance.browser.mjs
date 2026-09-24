import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.ROOMFENG_PREVIEW_ORIGIN ?? 'http://127.0.0.1:4326';
const cases = [
  ['/zh/blog/bed-facing-door-feng-shui/', 'bed-door'],
  ['/zh/blog/wardrobe-facing-bed-feng-shui/', 'wardrobe'],
  ['/zh/blog/desk-facing-door-layout/', 'desk'],
  ['/zh/blog/bedroom-air-conditioner-ceiling-direction-feng-shui/', 'aircon'],
  ['/zh/blog/tiny-room-layout-under-5-ping/', 'generic'],
];

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  for (const [path, preset] of cases) {
    await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
    const checker = page.locator(`.rfc[data-preset="${preset}"]`);
    assert.equal(await checker.count(), 1, `${preset} checker must be present`);
    const order = await page.evaluate(() => {
      const body = document.querySelector('.article-body');
      const firstH2 = body?.querySelector('h2');
      const checker = body?.querySelector('.rfc');
      return Boolean(firstH2 && checker && firstH2.nextElementSibling === checker);
    });
    assert.ok(order, `${preset} checker must follow the first article H2`);
    for (const value of ['0', '-1', '999999']) {
      await checker.locator('input').first().fill(value);
      const result = await checker.locator('output').innerText();
      assert.ok(!/NaN|Infinity/.test(result), `${preset} ${value} must not produce non-finite text`);
    }
    const fuzz = await checker.evaluate((root) => {
      const preset = root.dataset.preset;
      let seed = 90723;
      const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const inputs = [...root.querySelectorAll('input[data-k]')];
      let movementChecks = 0;
      for (let i = 0; i < 307; i++) {
        for (const input of inputs) {
          input.value = String(Math.floor(random() * 501));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const result = root.querySelector('output').innerText;
        if (/NaN|Infinity/.test(result)) return { error: 'non-finite result', i };
        const value = (name) => Number(root.querySelector(`input[data-k="${name}"]`).value);
        if (preset === 'bed-door') {
          for (const match of result.matchAll(/往([左右])移\s*(\d+) cm/g)) {
            const shifted = value('bedX') + (match[1] === '左' ? -1 : 1) * Number(match[2]);
            const overlap = Math.max(0, Math.min(value('doorX') + value('doorW'), shifted + value('bedW')) - Math.max(value('doorX'), shifted));
            if (overlap > 0 || shifted < 0 || shifted + value('bedW') > value('roomW')) return { error: 'bed-door movement fails', i };
            movementChecks++;
          }
        }
        if (preset === 'aircon') {
          const match = result.match(/床往([左右])移\s*(\d+) cm/);
          if (match) {
            const shifted = value('bedX') + (match[1] === '左' ? -1 : 1) * Number(match[2]);
            const ac = value('acX');
            const left = shifted - value('bedW') / 2;
            const right = shifted + value('bedW') / 2;
            if ((ac >= left && ac <= right) || left < 0 || right > value('roomW')) return { error: 'aircon movement fails', i };
            movementChecks++;
          }
        }
      }
      return { movementChecks };
    });
    assert.ok(!fuzz.error, `${preset} fuzz: ${JSON.stringify(fuzz)}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${preset} must fit 375px`);
  }

  await page.goto(`${origin}/zh/blog/bedroom-air-conditioner-ceiling-direction-feng-shui/`);
  const aircon = page.locator('.rfc');
  await aircon.locator('input[data-k="acX"]').fill('200');
  await aircon.locator('input[data-k="bedX"]').fill('200');
  await aircon.locator('input[data-k="roomW"]').fill('400');
  await aircon.locator('input[data-k="bedW"]').fill('152');
  const before = await aircon.locator('output').innerText();
  const move = before.match(/床往([左右])移\s*(\d+) cm/);
  assert.ok(move, 'aircon must offer a feasible move');
  const centerAfter = 200 + (move[1] === '左' ? -1 : 1) * Number(move[2]);
  await aircon.locator('input[data-k="bedX"]').fill(String(centerAfter));
  assert.match(await aircon.locator('output').innerText(), /不在床頭正上方/);

  await page.emulateMedia({ colorScheme: 'dark' });
  const darkBackground = await aircon.evaluate((element) => getComputedStyle(element).backgroundColor);
  assert.equal(darkBackground, 'rgb(18, 22, 28)', 'dark-mode background must be applied');

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('denied for fallback test'); } },
  }));
  await aircon.locator('.rfc__copy').click();
  assert.ok(await aircon.locator('.rfc__fallback').isVisible(), 'copy fallback text must be visible');
  assert.match(await aircon.locator('.rfc__fallback').inputValue(), /RoomFeng 檢查結果/);

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`${origin}/zh/blog/bedroom-air-conditioner-ceiling-direction-feng-shui/`);
  await page.locator('.rfc__copy').click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /RoomFeng 檢查結果/);

  console.log('Wave 1 clearance checker: five presets, boundary inputs, placement, 375px, movement, dark mode, clipboard and fallback passed');
} finally {
  await browser.close();
}
