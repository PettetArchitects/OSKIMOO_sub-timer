// One-off capture for docs/records/v2.9.38-bench-urgency — the three urgency
// states on a portrait phone + the landscape right-rail. Reuses the dev-gallery
// fixture drive (11-player squad, sc=3 to exercise the multi-row next-on wave).
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = 'docs/records/v2.9.38-bench-urgency';
mkdirSync(OUT, { recursive: true });

const DRIVE = `
  newTeam(); pickSport('soccer'); pickFormat('7v7','soccer'); fillSampleSquad();
  ['Harper','Billie'].forEach(n=>{ if(!editingTeam.players.includes(n)){ editingTeam.players.push(n); editingTeam.numbers[n]=String(editingTeam.players.length); } });
  document.getElementById('teamNameInput').value='Record';
  saveAndBack();
  selectTeam(teams[teams.length-1].id);
  startFromSquad(); gkStepNext(); shapeStepNext();
  cfg.sc=3;
`;

const browser = await chromium.launch();
async function shoot(viewport, states) {
  const page = await browser.newPage({ viewport });
  await page.goto('http://localhost:8002/index.html');
  await page.waitForFunction(() => typeof window.newTeam === 'function');
  await page.evaluate(() => document.getElementById('launchSplash')?.remove());
  await page.evaluate(d => window.eval(d), DRIVE);
  for (const [name, secsBefore] of states) {
    await page.evaluate(d => window.eval(`G.secs=nxtST()-${d}; updateClkSub(); renderRoster();`), secsBefore);
    await page.waitForTimeout(500); // let the drawer slide finish
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }
  await page.close();
}

await shoot({ width: 375, height: 812 }, [
  ['ambient', 120],
  ['sub-soon-30s', 25],
  ['sub-now-drawer', 8],
]);
await shoot({ width: 740, height: 360 }, [
  ['landscape-rail-8s', 8],
]);
await browser.close();
console.log('✓ captured to', OUT);
