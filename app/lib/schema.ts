import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  age: integer("age"),
  sex: text("sex"),
  heightCm: integer("height_cm"),
  weightKg: real("weight_kg"),
  activity: text("activity"),
  goal: text("goal"),
  household: text("household"),
  weekPattern: text("week_pattern"),
  cookingStyle: text("cooking_style"),
  timePerMealMin: integer("time_per_meal_min"),
  restrictions: text("restrictions"),
  loves: text("loves"),
  hates: text("hates"),
  budgetWeekCad: integer("budget_week_cad"),
  homeStore: text("home_store"),
  pcOptimumCard: text("pc_optimum_card"),
  pcOptimumPoints: integer("pc_optimum_points"),
  coopMemberNumber: text("coop_member_number"),
  coopEquityCad: real("coop_equity_cad"),
  rawAnswers: text("raw_answers"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  promptId: text("prompt_id").notNull(),
  caloriesTarget: integer("calories_target"),
  proteinTarget: integer("protein_target"),
  summary: text("summary"),
  daysJson: text("days_json").notNull(),
  startedOn: integer("started_on", { mode: "timestamp" }),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const groceryLists = sqliteTable("grocery_lists", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull().references(() => plans.id),
  categoriesJson: text("categories_json").notNull(),
  estimatedCad: real("estimated_cad"),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  planId: text("plan_id").notNull().references(() => plans.id),
  dayKey: text("day_key").notNull(),
  mealIdx: integer("meal_idx").notNull(),
  mealName: text("meal_name").notNull(),
  ingredientsJson: text("ingredients_json").notNull(),
  stepsJson: text("steps_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
});

export const checkins = sqliteTable("checkins", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  weightLb: real("weight_lb"),
  energy: integer("energy"),
  adherence: integer("adherence"),
  cravings: text("cravings"),
  noteToMia: text("note_to_mia"),
});
