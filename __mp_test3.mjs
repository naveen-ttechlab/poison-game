import { chromium } from 'playwright';

const browser = await chromium.launch();
const hostPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const guestPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
for (const [name, p] of [['HOST', hostPage], ['GUEST', guestPage]]) {
  p.on('console', (m) => { if (m.type() === 'error') console.log(name, 'CONSOLE ERROR:', m.text()); });
  p.on('pageerror', (e) => console.log(name, 'PAGE ERROR:', e.message));
}

await hostPage.goto('http://localhost:5184/');
await hostPage.waitForTimeout(500);
await hostPage.click('text=Multiplayer');
await hostPage.waitForSelector('.lobby-link', { timeout: 10000 });
const link = await hostPage.textContent('.lobby-link');

await guestPage.goto(link.trim());
await hostPage.waitForSelector('.game-header', { timeout: 10000 });
await guestPage.waitForSelector('.game-header', { timeout: 10000 });

async function clickAnyCup(page) {
  const canvas = await page.$('canvas');
  const box = await canvas.boundingBox();
  for (let ry = 0.35; ry <= 0.85; ry += 0.08) {
    for (let rx = 0.25; rx <= 0.75; rx += 0.06) {
      await page.mouse.click(box.x + box.width * rx, box.y + box.height * ry);
      await page.waitForTimeout(100);
      if (await page.$('.drink-dialog-title')) return true;
    }
  }
  return false;
}

// Host's turn: drink.
console.log('opened host dialog:', await clickAnyCup(hostPage));
await hostPage.click('.action-btn-drink');
await hostPage.waitForTimeout(3200);

console.log('--- after HOST drink ---');
console.log('HOST events:', await hostPage.textContent('.clue-log-section-events'));
console.log('GUEST events:', await guestPage.textContent('.clue-log-section-events'));
console.log('HOST turn:', await hostPage.textContent('.turn-badge'));
console.log('GUEST turn:', await guestPage.textContent('.turn-badge'));

// Now guest's turn: drink.
const guestOpened = await clickAnyCup(guestPage);
console.log('opened guest dialog:', guestOpened);
if (guestOpened) {
  await guestPage.click('.action-btn-drink');
  await guestPage.waitForTimeout(3200);
  console.log('--- after GUEST drink ---');
  console.log('HOST events:', await hostPage.textContent('.clue-log-section-events'));
  console.log('GUEST events:', await guestPage.textContent('.clue-log-section-events'));
  console.log('HOST turn:', await hostPage.textContent('.turn-badge'));
  console.log('GUEST turn:', await guestPage.textContent('.turn-badge'));
  await hostPage.screenshot({ path: './__mp_host_final.png' });
  await guestPage.screenshot({ path: './__mp_guest_final.png' });
}

await browser.close();
