// Full browser acceptance check. ROM path is supplied locally, never copied
// into the site. Requires the agent-browser CLI (run via npx).
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [base, rom, tile = '439', output = `/tmp/mario-paint-${tile}.png`] = process.argv.slice(2);
if (!base || !rom || !/^\d+$/.test(tile) || Number(tile) >= 3970) {
  throw new Error('Usage: node scripts/verify-mario-paint.mjs <base-url> <local-rom-path> [tile-id] [screenshot-path]');
}
const session = `paint-verify-${process.pid}`;
const run = (...args) => execFileSync('npx', ['--yes', 'agent-browser', '--session', session, ...args], {
  encoding: 'utf8', timeout: 45000, stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const evaluate = expression => JSON.parse(run('eval', expression));
try {
  run('open', new URL(`/paint/${tile}`, base).href);
  if (rom !== 'auto') {
    run('wait', '#paint-rom');
    run('upload', '#paint-rom', resolve(rom));
  }
  const readyDeadline = Date.now() + 45000;
  while (!evaluate('!!document.querySelector("iframe")?.contentDocument.querySelector(".ejs_start_button")')) {
    if (Date.now() > readyDeadline) throw new Error('The emulator did not become ready.');
    await delay(500);
  }
  run('eval', 'document.querySelector("iframe").contentDocument.querySelector(".ejs_start_button").click()');
  const deadline = Date.now() + 8 * 60 * 1000;
  let previous = '';
  while (true) {
    const state = evaluate('(()=>{const player=document.querySelector("section[aria-label=\\"Mario Paint\\"]");return {detail:player?.querySelector("[role=status], [role=alert]")?.textContent,error:!!player?.querySelector("[role=alert]")}})()');
    if (state.detail !== previous) { console.log(state.detail); previous = state.detail; }
    if (state.error) throw new Error(state.detail);
    if (state.detail === 'All 256 pixels painted. Your turn!') break;
    if (Date.now() > deadline) throw new Error('Drawing did not finish within eight minutes.');
    await delay(1500);
  }
  run('screenshot', '--full', resolve(output));
  const errors = run('errors');
  if (errors) throw new Error(`Browser errors: ${errors}`);
  console.log(`PASS: native game verified all 256 cells. Screenshot: ${resolve(output)}`);
} finally {
  run('close');
}
