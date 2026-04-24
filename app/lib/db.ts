import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(DATA_DIR, "mia.db"));
sqlite.pragma("journal_mode = WAL");

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    age INTEGER,
    sex TEXT,
    height_cm INTEGER,
    weight_kg REAL,
    activity TEXT,
    goal TEXT,
    household TEXT,
    week_pattern TEXT,
    cooking_style TEXT,
    time_per_meal_min INTEGER,
    restrictions TEXT,
    loves TEXT,
    hates TEXT,
    budget_week_cad INTEGER,
    home_store TEXT,
    pc_optimum_card TEXT,
    pc_optimum_points INTEGER,
    coop_member_number TEXT,
    coop_equity_cad REAL,
    raw_answers TEXT,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    prompt_id TEXT NOT NULL,
    calories_target INTEGER,
    protein_target INTEGER,
    summary TEXT,
    days_json TEXT NOT NULL,
    started_on INTEGER,
    active INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS grocery_lists (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES plans(id),
    categories_json TEXT NOT NULL,
    estimated_cad REAL,
    created_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES plans(id),
    day_key TEXT NOT NULL,
    meal_idx INTEGER NOT NULL,
    meal_name TEXT NOT NULL,
    ingredients_json TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    photo_url TEXT,
    photo_credit TEXT,
    created_at INTEGER,
    UNIQUE(plan_id, day_key, meal_idx)
  );
  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    date INTEGER NOT NULL,
    weight_lb REAL,
    energy INTEGER,
    adherence INTEGER,
    cravings TEXT,
    note_to_mia TEXT
  );
  CREATE INDEX IF NOT EXISTS plans_active_idx ON plans(user_id, active);
  CREATE INDEX IF NOT EXISTS grocery_plan_idx ON grocery_lists(plan_id);
  CREATE INDEX IF NOT EXISTS recipes_lookup_idx ON recipes(plan_id, day_key, meal_idx);
  CREATE INDEX IF NOT EXISTS checkins_user_date_idx ON checkins(user_id, date);
`;
sqlite.exec(SCHEMA_SQL);
try { sqlite.exec("ALTER TABLE users ADD COLUMN raw_answers TEXT"); } catch { /* already exists */ }
try { sqlite.exec("ALTER TABLE recipes ADD COLUMN photo_url TEXT"); } catch { /* already exists */ }
try { sqlite.exec("ALTER TABLE recipes ADD COLUMN photo_credit TEXT"); } catch { /* already exists */ }

export const db = drizzle(sqlite, { schema });
export const USER_ID = "me";
