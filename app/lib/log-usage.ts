// Log Anthropic usage per request so you can eyeball cost in the dev-server console.
// Haiku 4.5 pricing (at time of writing): ~$1/MTok input, ~$5/MTok output.
// Adjust if you switch models.

const IN_PER_MTOK = Number(process.env.MIA_PRICE_IN ?? '1.00');
const OUT_PER_MTOK = Number(process.env.MIA_PRICE_OUT ?? '5.00');

type Usage = { input_tokens?: number; output_tokens?: number } | undefined;

export function logUsage(label: string, usage: Usage, ms: number) {
  const i = usage?.input_tokens ?? 0;
  const o = usage?.output_tokens ?? 0;
  const cost = (i * IN_PER_MTOK + o * OUT_PER_MTOK) / 1_000_000;
  console.log(`[mia] ${label.padEnd(18)} in=${i.toString().padStart(5)} out=${o.toString().padStart(5)} ~$${cost.toFixed(4)} ${ms}ms`);
}
