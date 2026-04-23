// Hit every read-only API + lightweight mutations to make sure nothing 500s.
// Requires the dev server on 3000 and a seeded plan. Run:  node scripts/smoke-test.mjs

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function hit(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, json, text: text.slice(0, 120) };
}

const checks = [
  ['GET',  '/api/state'],
  ['GET',  '/api/generate-grocery'],
  ['GET',  '/api/checkin'],
  ['GET',  '/api/generate-recipe?day=MON&idx=0'],
];

let bad = 0;
for (const [method, path, body] of checks) {
  const r = await hit(method, path, body);
  const ok = r.ok || (r.status === 400);
  console.log(`${ok ? 'OK ' : 'FAIL'}  ${method.padEnd(4)} ${path.padEnd(40)} ${r.status}`);
  if (!ok) bad++;
}

// Minimal mutation smoke: toggle a skip, toggle it back
const state = (await hit('GET', '/api/state')).json;
if (state?.plan) {
  const dayKey = state.plan.days?.[0]?.day;
  if (dayKey) {
    const a = await hit('POST', '/api/toggle-skip-day', { day: dayKey });
    const b = await hit('POST', '/api/toggle-skip-day', { day: dayKey });
    console.log(`${a.ok && b.ok ? 'OK ' : 'FAIL'}  POST /api/toggle-skip-day x2 (${dayKey})`);
    if (!a.ok || !b.ok) bad++;
  }
}

console.log('');
process.exit(bad === 0 ? 0 : 1);
