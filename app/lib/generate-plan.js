// Client-side wrapper: POSTs to /api/generate-plan which proxies Claude.

export async function generatePlan(answers, prompt, tuning) {
  const res = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, prompt, tuning }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Plan API ${res.status}: ${text}`);
  }
  return res.json();
}
