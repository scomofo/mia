import Database from 'better-sqlite3';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const db = new Database(path.join(process.cwd(), 'data', 'mia.db'));
const answers = {
  goal: 'maintain', household: 'split', pattern: 'weekday', kids: 'school',
  cooking: 'prep', activity: 'moderate', time: 30, restrictions: ['none'],
  loves: ['mediterranean', 'mexican'], hates: ['none'], pain: ['planning', 'cooking'],
  budget: 'normal', depth: 'balanced', age: 38, body: { sex: 'male', h: "5'10\"", w: 175 },
};
const days = [
  { day: 'MON', kid: true, meals: [
    { t: 'Breakfast', name: 'Greek yogurt + berries', cal: 420, time: 5 },
    { t: 'Lunch', name: 'Chicken shawarma wrap', cal: 580, time: 10 },
    { t: 'Dinner', name: 'Sheet pan meatballs + rice', cal: 720, time: 30, kid: true },
    { t: 'Snack', name: 'Apple + peanut butter', cal: 220 },
  ]},
  { day: 'TUE', kid: true, meals: [
    { t: 'Breakfast', name: 'Overnight oats', cal: 440, time: 2 },
    { t: 'Lunch', name: 'Leftover meatballs bowl', cal: 540, time: 4 },
    { t: 'Dinner', name: 'Taco night', cal: 680, time: 25, kid: true },
    { t: 'Snack', name: 'Cottage cheese + honey', cal: 180 },
  ]},
  { day: 'WED', kid: true, meals: [
    { t: 'Breakfast', name: 'Egg + avocado toast', cal: 450, time: 8 },
    { t: 'Lunch', name: 'Mediterranean grain bowl', cal: 560, time: 5 },
    { t: 'Dinner', name: 'Baked salmon + sweet potato', cal: 640, time: 35, kid: true },
    { t: 'Snack', name: 'Greek yogurt + granola', cal: 240 },
  ]},
  { day: 'THU', kid: true, meals: [
    { t: 'Breakfast', name: 'Protein smoothie', cal: 380, time: 3 },
    { t: 'Lunch', name: 'Turkey + hummus wrap', cal: 540, time: 6 },
    { t: 'Dinner', name: 'One-pan pasta primavera', cal: 700, time: 25, kid: true },
    { t: 'Snack', name: 'Trail mix', cal: 200 },
  ]},
  { day: 'FRI', kid: false, meals: [
    { t: 'Breakfast', name: 'Veggie omelet', cal: 420, time: 10 },
    { t: 'Lunch', name: 'Big salad + grilled chicken', cal: 520, time: 8 },
    { t: 'Dinner', name: 'Salmon poke bowl', cal: 620, time: 12 },
    { t: 'Snack', name: 'Dark chocolate + almonds', cal: 220 },
  ]},
  { day: 'SAT', kid: false, meals: [
    { t: 'Breakfast', name: 'Shakshuka + sourdough', cal: 480, time: 20 },
    { t: 'Lunch', name: 'Leftover poke bowl', cal: 500, time: 2 },
    { t: 'Dinner', name: 'Grilled steak + chimichurri', cal: 720, time: 25 },
    { t: 'Snack', name: 'Greek yogurt', cal: 160 },
  ]},
  { day: 'SUN', kid: false, meals: [
    { t: 'Breakfast', name: 'Pancakes + eggs', cal: 520, time: 15 },
    { t: 'PREP', name: 'Sunday batch cook', cal: null, time: 150, prep: true },
    { t: 'Dinner', name: 'Roast chicken + veg', cal: 640, time: 60 },
    { t: 'Snack', name: 'Hummus + veggies', cal: 180 },
  ]},
];

db.prepare('DELETE FROM plans').run();
db.prepare('DELETE FROM users').run();

db.prepare(`INSERT INTO users (id, age, sex, weight_kg, activity, goal, household, week_pattern, cooking_style, time_per_meal_min, restrictions, loves, hates, raw_answers, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
  'me', 38, 'male', 79.4, 'moderate', 'maintain', 'split', 'weekday', 'prep', 30,
  JSON.stringify(['none']), JSON.stringify(['mediterranean', 'mexican']), JSON.stringify(['none']),
  JSON.stringify(answers), Date.now()
);

db.prepare(`INSERT INTO plans (id, user_id, prompt_id, calories_target, protein_target, summary, days_json, started_on, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
  randomUUID(), 'me', 'batch-sunday', 2200, 160,
  'Sunday-prep split-kid-nights plan tuned for your week.',
  JSON.stringify(days), Date.now(), 1
);

console.log('seeded');
console.log(db.prepare('SELECT COUNT(*) as n FROM plans WHERE active=1').get());
