// Catalog of meal-plan prompts (Nav Toor, 2026)

export const PROMPTS = [
  {
    id: 'mayo-blueprint',
    num: '01',
    title: 'Personalized Nutrition Blueprint',
    persona: 'Senior Registered Dietitian',
    tagline: 'A full-body nutrition plan tailored to your schedule, preferences, and goals.',
    tags: ['macros', 'foundation', 'personalized'],
    match: ['lose-fat', 'build-muscle', 'maintain', 'energy', 'health'],
    duration: 'Long-term',
    complexity: 3,
    outputs: ['Calorie target', 'Macro split', 'Supplement list', 'Adjustment protocol'],
    prompt: `You are a senior registered dietitian who has designed personalized nutrition plans for 10,000+ patients.

Generate a complete personalized nutrition plan built specifically for this user's body and goals.

Blueprint:
- Calorie target calculation based on age, weight, height, activity, and goal
- Macro split: exact grams of protein, carbs, fat
- Meal frequency tuned to schedule
- Food preferences integration
- Allergy and restriction accommodation
- Hydration target
- Supplement recommendations
- Adjustment protocol every 2 weeks`,
    fields: ['age','weight','height','activity','goal','preferences','allergies'],
  },
  {
    id: 'precision-7day',
    num: '02',
    title: 'Precision 7-Day Meal Plan',
    persona: 'Nutrition Coach',
    tagline: 'A full week of breakfasts, lunches, dinners & snacks hitting your macros exactly.',
    tags: ['weekly', 'recipes', 'simple'],
    match: ['lose-fat', 'build-muscle', 'maintain', 'family', 'busy'],
    duration: '7 days',
    complexity: 2,
    outputs: ['7 breakfasts', '7 lunches', '7 dinners', 'Grocery list'],
    prompt: `You are a senior nutrition coach who builds weekly meal plans people actually follow.

- 7 breakfasts, 7 lunches, 7 dinners (30 min or less), 2-3 snack options
- Daily macro totals and overlap across the week
- Exact portion sizes
- Swappable options per meal`,
    fields: ['calories','macros','loves','hates','skill','time'],
  },
  {
    id: 'rp-macros',
    num: '04',
    title: 'Precision Macro Calculator',
    persona: 'Sports Nutrition Scientist',
    tagline: 'Exact daily macro targets for body composition — calibrated to your training.',
    tags: ['macros', 'training', 'precise'],
    match: ['lose-fat', 'build-muscle', 'athletic'],
    duration: 'Ongoing',
    complexity: 4,
    outputs: ['BMR + TDEE', 'Protein/fat/carb grams', 'Training vs rest day', 'Refeed protocol'],
    prompt: `You are a senior sports nutrition scientist who calculates precise macronutrient targets.

- BMR via Mifflin-St Jeor
- TDEE at actual activity
- Goal-specific calorie target
- Protein 0.7-1.2g/lb, fat minimum 0.3g/lb
- Training day vs rest day macros
- Biweekly adjustment rules`,
    fields: ['age','weight','height','bodyfat','training','goal','activity'],
  },
  {
    id: 'batch-sunday',
    num: '05',
    title: 'Sunday Batch Cooking System',
    persona: 'Meal Prep Efficiency Expert',
    tagline: 'Cook your whole week in a single 2-3 hour Sunday session.',
    tags: ['meal-prep', 'time-saver', 'weekly'],
    match: ['busy', 'lose-fat', 'build-muscle', 'family'],
    duration: '2-3 hrs / week',
    complexity: 3,
    outputs: ['Minute-by-minute timeline', 'Protein/carb/veg batches', 'Container plan'],
    prompt: `You are a meal prep efficiency expert. Output a 2-3 hour Sunday cooking playbook with simultaneous oven + stovetop batches, protein/carb/veg bases, 3-4 transforming sauces, container labels, and reheat instructions.`,
    fields: ['proteins','meals-per-day','equipment','prep-hours'],
  },
  {
    id: 'gut-health',
    num: '06',
    title: 'Gut Health & Digestion Optimizer',
    persona: 'Gastroenterology Nutritionist',
    tagline: 'Fix bloating, brain fog, and energy crashes through targeted food changes.',
    tags: ['gut', 'anti-inflammatory', 'elimination'],
    match: ['health', 'energy'],
    duration: '30 days',
    complexity: 4,
    outputs: ['Elimination plan', 'Reintroduction schedule', 'Probiotic/prebiotic foods'],
    prompt: `Gut health protocol: elimination of top dietary triggers for 2 weeks, probiotic/prebiotic emphasis, anti-inflammatory foods, meal timing, hydration, 14-day diary, 30-day phased repair plan.`,
    fields: ['symptoms','duration','suspected-foods','current-diet'],
  },
  {
    id: 'family-plate',
    num: '07',
    title: 'Family MyPlate Meal Planner',
    persona: 'Pediatric Nutritionist',
    tagline: 'One plan for the whole family — adult-satisfying and kid-approved.',
    tags: ['family', 'kids', 'budget'],
    match: ['family'],
    duration: 'Weekly',
    complexity: 2,
    outputs: ['Family dinners', 'School lunches', 'After-school snacks', 'Grocery list'],
    prompt: `Family meal plan: one-meal-fits-all dinners, picky-eater techniques, 5 days school lunches, 10 after-school snacks, batch cooking scales, family of 4 under $150/week.`,
    fields: ['family-size','kids-ages','picky','allergies','budget'],
  },
  {
    id: 'noom-habits',
    num: '08',
    title: 'Psychology-Based Habit Rebuilder',
    persona: 'Behavioral Psychologist',
    tagline: 'Fix WHY you overeat — trigger maps, environment redesign, habit loops.',
    tags: ['behavior', 'mindful', 'emotional'],
    match: ['lose-fat', 'maintain', 'health'],
    duration: '30 days',
    complexity: 3,
    outputs: ['Trigger map', 'Habit loop rewrites', '30-day calendar'],
    prompt: `Behavioral change plan: trigger identification, kitchen redesign, cue→routine→reward mapping for 3 worst habits, mindful eating, evening snacking fix, 30-day calendar.`,
    fields: ['challenges','overeating-times','triggers','failed-habits'],
  },
  {
    id: 'workout-fuel',
    num: '09',
    title: 'Pre & Post-Workout Fuel Guide',
    persona: 'Sports Nutritionist',
    tagline: 'Exactly what to eat before, during, and after training for max recovery.',
    tags: ['training', 'recovery', 'timing'],
    match: ['build-muscle', 'athletic', 'energy'],
    duration: 'Per workout',
    complexity: 3,
    outputs: ['Pre-workout meals', 'Intra-workout needs', 'Post-workout window'],
    prompt: `Workout nutrition: pre-workout 60-90 min vs 15-30 min options, intra needs, post-workout 20-40g protein + carbs, training vs rest intake, hydration, supplement stack.`,
    fields: ['workout-type','time-of-day','duration','intensity','goal'],
  },
  {
    id: 'if-protocol',
    num: '10',
    title: 'Intermittent Fasting Protocol',
    persona: 'Fasting Researcher',
    tagline: 'A fasting schedule that fits real life and preserves muscle.',
    tags: ['fasting', 'metabolic', 'scheduled'],
    match: ['lose-fat', 'maintain', 'health'],
    duration: '4-week adaptation',
    complexity: 3,
    outputs: ['Protocol selection', 'Eating window', 'Breaking the fast', '4-week plan'],
    prompt: `IF protocol: select 16:8/5:2/OMAD, eating window, breaking the fast, muscle preservation, 4-week adaptation.`,
    fields: ['wake-time','work-hours','workout-time','social','why-fasting'],
  },
  {
    id: 'medical-adapter',
    num: '11',
    title: 'Medical Condition Nutrition Adapter',
    persona: 'Clinical Dietitian',
    tagline: 'Therapeutic nutrition for chronic conditions — complementary to your treatment.',
    tags: ['therapeutic', 'medical', 'targeted'],
    match: ['health'],
    duration: 'Ongoing',
    complexity: 4,
    outputs: ['Foods to emphasize', 'Foods to limit', 'Lab target tracking'],
    prompt: `Therapeutic nutrition plan with evidence-based foods for the condition, limits with reasoning, medication-food interactions, lab targets, sample day. Always informational; consult doctor.`,
    fields: ['condition','medications','lab-results','doctor-recs'],
  },
  {
    id: 'mayo-30day',
    num: '12',
    title: '30-Day Nutrition Transformation',
    persona: 'Wellness Coach',
    tagline: 'A structured 30-day reset from chaotic eating to sustainable habits.',
    tags: ['30-day', 'reset', 'structured'],
    match: ['lose-fat', 'maintain', 'health', 'energy'],
    duration: '30 days',
    complexity: 2,
    outputs: ['Weekly phase plan', 'Daily habits', 'Emergency protocols', 'Maintenance plan'],
    prompt: `30-day transformation: kitchen reset, foundation week, habit building, optimization, stress testing, lock-in. Daily habits, weekly milestones, emergency protocols.`,
    fields: ['current-habits','biggest-challenge','cooking-skill','definition-of-healthy'],
  },
];

export function rankPrompts(answers) {
  const scored = PROMPTS.map((p) => {
    let score = 0;
    if (p.match.includes(answers.goal)) score += 5;
    if ((answers.household === 'family' || answers.household === 'split') && p.match.includes('family')) score += 3;
    if (answers.kids === 'school' || answers.kids === 'mix') { if (p.match.includes('family')) score += 2; }
    if (answers.cooking === 'prep' && p.id === 'batch-sunday') score += 4;
    if (answers.cooking === 'none' && p.id === 'precision-7day') score += 2;
    if (answers.depth === 'precise' && p.id === 'rp-macros') score += 4;
    if (answers.depth === 'precise' && p.tags.includes('macros')) score += 1;
    if (answers.depth === 'light' && p.complexity <= 2) score += 2;
    if (answers.depth === 'balanced' && p.complexity === 3) score += 1;
    if (answers.pain?.includes('snacking') && p.id === 'noom-habits') score += 3;
    if (answers.pain?.includes('planning') && p.id === 'precision-7day') score += 2;
    if (answers.pain?.includes('cooking') && p.id === 'batch-sunday') score += 2;
    if (answers.pain?.includes('kids') && p.id === 'family-plate') score += 3;
    if ((answers.activity === 'very' || answers.activity === 'athletic') && p.id === 'workout-fuel') score += 3;
    if (answers.goal === 'health' && (p.id === 'gut-health' || p.id === 'medical-adapter')) score += 3;
    if (answers.goal === 'lose-fat' && p.id === 'if-protocol') score += 0.5;
    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
