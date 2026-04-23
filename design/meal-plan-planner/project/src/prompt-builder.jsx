// prompt-builder.jsx — builds profile + calls Claude to generate a week plan

function buildProfile(answers, tuning) {
  const L = [];
  if (answers.age) L.push(`Age: ${answers.age}`);
  if (answers.body) L.push(`Sex: ${answers.body.sex}, ${answers.body.h}, ${answers.body.w} lb`);
  if (answers.activity) L.push(`Activity: ${answers.activity}`);
  if (answers.goal) L.push(`Goal: ${answers.goal}`);
  if (answers.household) L.push(`Household: ${answers.household}`);
  if (answers.pattern) L.push(`Week pattern: ${answers.pattern}`);
  if (answers.kids && answers.kids !== 'no-kids') L.push(`Kids: ${answers.kids}`);
  if (answers.cooking) L.push(`Cooking style: ${answers.cooking}`);
  if (answers.time) L.push(`Time per meal: ${answers.time} min`);
  if (answers.restrictions?.length) L.push(`Restrictions: ${answers.restrictions.join(', ')}`);
  if (answers.loves?.length) L.push(`Loves: ${answers.loves.join(', ')}`);
  if (answers.hates?.length) L.push(`Hard no: ${answers.hates.join(', ')}`);
  if (answers.pain?.length) L.push(`Pain points: ${answers.pain.join(', ')}`);
  if (answers.budget) L.push(`Budget: ${answers.budget}`);
  if (tuning?.cals) L.push(`Calorie target: ${tuning.cals} kcal/day`);
  if (tuning?.protein) L.push(`Protein target: ${tuning.protein} g/day`);
  L.push(`Location: Camrose, AB, Canada (shops at Real Canadian Superstore + Camrose Co-op)`);
  return L.join('\n');
}

async function generatePlan(answers, prompt, tuning) {
  const profile = buildProfile(answers, tuning);
  const req = `You are a senior nutrition coach (Nav Toor style prompt: "${prompt.title}").

USER PROFILE:
${profile}

Generate a 7-day meal plan tailored to this person. Return ONLY valid JSON (no prose, no markdown) in this exact shape:

{
  "summary": "One-sentence plan description (max 12 words)",
  "days": [
    {
      "day": "MON",
      "kid": true,
      "meals": [
        {"t": "Breakfast", "name": "Meal name", "cal": 450, "time": 8},
        {"t": "Lunch", "name": "Meal name", "cal": 560, "time": 5},
        {"t": "Dinner", "name": "Meal name", "cal": 640, "time": 30, "kid": true},
        {"t": "Snack", "name": "Meal name", "cal": 200}
      ]
    }
  ]
}

Rules:
- Exactly 7 days: MON, TUE, WED, THU, FRI, SAT, SUN
- Each day has 4 meals (Breakfast, Lunch, Dinner, Snack)
- "kid": true on days the kids are home (respect household pattern)
- Hit calorie target ±100 kcal/day
- Include at least one Sunday batch-cook meal with "prep": true if the prompt is batch-cooking style
- Meals should actually reflect the user's loves/hates and restrictions
- Keep names short (max 8 words)
- Respond with ONLY the JSON object, no other text`;

  const raw = await window.claude.complete(req);
  // Try to extract JSON even if model wraps it
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  return JSON.parse(jsonMatch[0]);
}

window.buildProfile = buildProfile;
window.generatePlan = generatePlan;
