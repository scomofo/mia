'use client';

import { useState, useEffect } from 'react';
import { PromptIcon } from './PromptSelect';

function deriveProfile(a) {
  const goalLabel = {
    'lose-fat': 'Fat loss',
    'build-muscle': 'Muscle gain',
    'maintain': 'Maintain',
    'energy': 'More energy',
    'health': 'Health',
    'family': 'Family nutrition',
  }[a.goal] || '—';

  let calories = null;
  if (a.body && a.body.w && a.age) {
    const w = a.body.w;
    const sex = a.body.sex;
    const bmr = sex === 'male'
      ? 10 * (w / 2.2) + 6.25 * 178 - 5 * a.age + 5
      : 10 * (w / 2.2) + 6.25 * 165 - 5 * a.age - 161;
    const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, athletic: 1.9 }[a.activity] || 1.4;
    let tdee = bmr * mult;
    if (a.goal === 'lose-fat') tdee -= 400;
    if (a.goal === 'build-muscle') tdee += 300;
    calories = Math.round(tdee / 10) * 10;
  }
  return { goalLabel, calories };
}

function ProfileChip({ label, value }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginTop: 1 }}>{value}</div>
    </div>
  );
}

export function RefineScreen({ prompt, answers, onGenerate, onBack }) {
  const profile = deriveProfile(answers);
  const [cals, setCals] = useState(profile.calories || 2200);
  const [protein, setProtein] = useState(160);

  const hhLabel = {
    'solo': 'Solo',
    'couple': 'Me + partner',
    'family': 'Family',
    'split': '4 kid nights / 3 solo',
  }[answers.household] || '—';

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)' }}>
      <div style={{
        padding: '62px 16px 16px',
        position: 'sticky', top: 0, zIndex: 2,
        background: 'linear-gradient(to bottom, var(--cream) 85%, transparent)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={onBack} style={{
            background: '#fff', border: 'none',
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(31,36,25,0.06), 0 0 0 1px rgba(31,36,25,0.05)',
            cursor: 'pointer',
          }}>
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke="var(--ink-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>Step 3 of 3 · Refine</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 140px' }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: 16,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
          marginBottom: 18,
        }}>
          <PromptIcon id={prompt.id} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>Selected</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', letterSpacing: -0.01, lineHeight: 1.1, marginTop: 2 }}>{prompt.title}</div>
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 400, letterSpacing: -0.02, margin: '8px 0 14px', lineHeight: 1.05 }}>
          Fine-tune before <em style={{ color: 'var(--olive-deep)' }}>generating</em>
        </h2>

        <div style={{ background: 'var(--cream-2)', borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 10 }}>Your profile</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ProfileChip label="Goal" value={profile.goalLabel} />
            <ProfileChip label="Household" value={hhLabel} />
            <ProfileChip label="Cooking" value={{ none: 'Assembly', weeknight: '20 min', prep: 'Sunday prep', daily: 'Daily' }[answers.cooking] || '—'} />
            <ProfileChip label="Time/meal" value={answers.time ? `${answers.time} min` : '—'} />
            <ProfileChip label="Activity" value={{ sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate', very: 'Very', athletic: 'Athletic' }[answers.activity] || '—'} />
            <ProfileChip label="Budget" value={{ tight: '<$100', normal: '$100-200', flex: '$200-350', open: 'Open' }[answers.budget] || '—'} />
          </div>
          {answers.restrictions && answers.restrictions.length > 0 && answers.restrictions[0] !== 'none' && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 4 }}>Restrictions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {answers.restrictions.map(r => (
                  <span key={r} style={{
                    padding: '3px 8px', background: 'var(--tomato-soft)',
                    color: 'var(--tomato)', borderRadius: 999,
                    fontSize: 11, fontWeight: 500, fontFamily: 'var(--sans)',
                  }}>{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {profile.calories && (
          <div style={{
            background: '#fff', borderRadius: 18, padding: 16, marginBottom: 10,
            boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500 }}>Daily calories</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--olive-deep)', fontStyle: 'italic' }}>
                {cals}<span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}> kcal</span>
              </div>
            </div>
            <input type="range" min="1400" max="3500" step="50" value={cals}
              onChange={e => setCals(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--olive-deep)', marginTop: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>
              <span>Cut -400</span><span>Recommended</span><span>Surplus +300</span>
            </div>
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: 18, padding: 16, marginBottom: 16,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500 }}>Protein target</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--olive-deep)', fontStyle: 'italic' }}>
              {protein}<span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>g/day</span>
            </div>
          </div>
          <input type="range" min="80" max="250" step="5" value={protein}
            onChange={e => setProtein(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--olive-deep)', marginTop: 6 }} />
        </div>

        <div style={{ background: 'var(--olive-soft)', borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--olive-deep)', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 8, fontWeight: 500 }}>You&apos;ll get</div>
          {prompt.outputs.map(o => (
            <div key={o} style={{ display: 'flex', gap: 10, padding: '6px 0', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M3 8l3 3 7-7" stroke="var(--olive-deep)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {o}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 16px 40px',
        background: 'linear-gradient(to top, var(--cream) 70%, transparent)',
      }}>
        <button onClick={() => onGenerate({ cals, protein })} style={{
          width: '100%', background: 'var(--olive-deep)', color: '#fff',
          border: 'none', borderRadius: 999, padding: '16px',
          fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 600,
          cursor: 'pointer', letterSpacing: -0.1,
          boxShadow: '0 4px 14px rgba(66,77,34,0.3)',
        }}>Generate my plan →</button>
      </div>
    </div>
  );
}

const SAMPLE_DAYS = [
  { day: 'MON', kid: true, meals: [
    { t: 'Breakfast', name: 'Greek yogurt bowl + berries', cal: 420, time: 5 },
    { t: 'Lunch', name: 'Chicken shawarma wrap', cal: 580, time: 10 },
    { t: 'Dinner', name: 'Sheet pan meatballs + rice (kids)', cal: 720, time: 30, kid: true },
    { t: 'Snack', name: 'Apple + peanut butter', cal: 220 },
  ]},
  { day: 'TUE', kid: true, meals: [
    { t: 'Breakfast', name: 'Overnight oats + almonds', cal: 440, time: 2 },
    { t: 'Lunch', name: 'Leftover meatballs bowl', cal: 540, time: 4 },
    { t: 'Dinner', name: 'Taco night — build-your-own', cal: 680, time: 25, kid: true },
    { t: 'Snack', name: 'Cottage cheese + honey', cal: 180 },
  ]},
  { day: 'WED', kid: true, meals: [
    { t: 'Breakfast', name: 'Egg + avocado toast', cal: 450, time: 8 },
    { t: 'Lunch', name: 'Mediterranean grain bowl', cal: 560, time: 5 },
    { t: 'Dinner', name: 'Baked salmon + sweet potato (adults), chicken tenders (kids)', cal: 640, time: 35, kid: true },
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
    { t: 'Dinner', name: 'Solo night — salmon poke bowl', cal: 620, time: 12 },
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
    { t: 'PREP', name: 'Sunday batch cook · 2.5 hrs', cal: null, time: 150, prep: true },
    { t: 'Dinner', name: 'Roast chicken + veg', cal: 640, time: 60 },
    { t: 'Snack', name: 'Hummus + veggies', cal: 180 },
  ]},
];

export function PlanPreviewScreen({ prompt, answers, tuning, initialPlan, onPlanReady, onOpenMeal, onRegenerateDay, onUpdateDayNote, onToggleSkipDay, onRestart, onBack, onNav }) {
  const [shuffling, setShuffling] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [liveDays, setLiveDays] = useState(initialPlan?.days ?? null);
  const [status, setStatus] = useState(initialPlan ? 'done' : 'idle');
  const [summary, setSummary] = useState(initialPlan?.summary ?? '');

  useEffect(() => {
    if (initialPlan) return;
    let cancelled = false;
    async function run() {
      setStatus('loading');
      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, prompt, tuning }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const plan = await res.json();
        if (cancelled) return;
        setLiveDays(plan.days);
        setSummary(plan.summary || '');
        setStatus('done');
        onPlanReady?.({ summary: plan.summary, days: plan.days });
      } catch (e) {
        if (cancelled) return;
        console.warn('Plan gen failed, using sample:', e);
        setStatus('error');
      }
    }
    run();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const days = liveDays || SAMPLE_DAYS;
  const day = days[dayIdx] || days[0];
  const totalCal = day.meals.filter(m => m.cal).reduce((s, m) => s + m.cal, 0);

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)' }}>
      <div style={{
        background: 'linear-gradient(160deg, var(--olive-deep) 0%, oklch(48% 0.13 130) 100%)',
        color: '#fff', padding: '62px 20px 24px',
        borderRadius: '0 0 28px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="9" height="14" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.08, textTransform: 'uppercase', opacity: 0.7 }}>Your plan · generated just now</div>
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: -0.02 }}>
          Your <em style={{ color: 'oklch(90% 0.1 130)' }}>7-day</em><br />meal plan
        </h1>
        <div style={{ display: 'flex', gap: 14, marginTop: 18, fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.85 }}>
          <div>
            <div style={{ opacity: 0.7 }}>Target</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, marginTop: 2 }}>{tuning.cals} kcal</div>
          </div>
          <div>
            <div style={{ opacity: 0.7 }}>Protein</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, marginTop: 2 }}>{tuning.protein}g</div>
          </div>
          <div>
            <div style={{ opacity: 0.7 }}>Meals</div>
            <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, marginTop: 2 }}>28</div>
          </div>
        </div>
        {status === 'loading' && (
          <div style={{
            marginTop: 18, padding: '10px 14px',
            background: 'rgba(255,255,255,0.15)', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              animation: 'spin 700ms linear infinite',
            }} />
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, opacity: 0.9, letterSpacing: -0.1 }}>Mia is cooking up your week…</div>
          </div>
        )}
        {status === 'done' && summary && (
          <div style={{
            marginTop: 14, padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)', borderRadius: 10,
            fontFamily: 'var(--sans)', fontStyle: 'italic', fontSize: 13,
            color: 'rgba(255,255,255,0.92)', letterSpacing: -0.1,
          }}>{summary}</div>
        )}
        {status === 'error' && (
          <div style={{
            marginTop: 14, padding: '8px 12px',
            background: 'rgba(255,255,255,0.1)', borderRadius: 10,
            fontFamily: 'var(--mono)', fontSize: 10.5,
            color: 'rgba(255,255,255,0.75)', letterSpacing: 0.04,
          }}>Using sample plan — Mia is offline</div>
        )}
      </div>

      <div style={{ padding: '16px 12px 6px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {(() => {
          const todayIdx = (new Date().getDay() + 6) % 7;
          return days.map((d, i) => {
            const isToday = i === todayIdx;
            const isSelected = dayIdx === i;
            return (
              <button key={d.day} onClick={() => setDayIdx(i)} style={{
                flexShrink: 0,
                padding: '10px 12px', borderRadius: 12,
                background: isSelected ? 'var(--ink)' : '#fff',
                color: isSelected ? '#fff' : 'var(--ink-2)',
                border: isToday && !isSelected ? '1.5px solid var(--olive)' : 'none',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                minWidth: 46,
                boxShadow: isSelected ? 'none' : '0 1px 2px rgba(31,36,25,0.05)',
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: 0.08, opacity: isSelected ? 0.7 : 0.55 }}>{isToday ? 'TODAY' : d.day}</span>
                <span style={{
                  fontFamily: 'var(--serif)', fontSize: 18, fontStyle: d.kid ? 'italic' : 'normal',
                  color: isSelected ? (d.kid ? 'oklch(88% 0.1 65)' : '#fff') : (d.kid ? 'var(--tangerine)' : 'var(--ink)'),
                }}>{i + 1}</span>
              </button>
            );
          });
        })()}
      </div>

      <div style={{ padding: '6px 16px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontStyle: 'italic', color: 'var(--ink)', letterSpacing: -0.01 }}>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][dayIdx]}
        </div>
        {day.kid && (
          <span style={{
            padding: '3px 8px', background: 'var(--tangerine-soft)',
            color: '#8B4A1A', borderRadius: 999,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 0.04, fontWeight: 500,
          }}>KIDS NIGHT</span>
        )}
        <div style={{ flex: 1 }} />
        {onToggleSkipDay && !shuffling && (
          <button onClick={() => onToggleSkipDay(day.day)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12, color: day.skipped ? 'var(--tomato)' : 'var(--ink-3)', fontWeight: 500,
            padding: '4px 8px',
          }}>{day.skipped ? '↺ Unskip' : '⊘ Skip'}</button>
        )}
        {onUpdateDayNote && !shuffling && (
          <button onClick={() => { setNoteDraft(day.note || ''); setNoteOpen(true); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12, color: day.note ? 'var(--olive-deep)' : 'var(--ink-3)', fontWeight: 500,
            padding: '4px 8px',
          }}>{day.note ? '✎ Note' : '+ Note'}</button>
        )}
        {onRegenerateDay && !shuffling && (
          <button onClick={async () => {
            setShuffling(true);
            await onRegenerateDay(day.day);
            setShuffling(false);
          }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--olive-deep)', fontWeight: 500,
            padding: '4px 8px',
          }}>Shuffle →</button>
        )}
        {shuffling && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>shuffling…</span>
        )}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{totalCal} kcal</div>
      </div>

      {day.note && (
        <div style={{ padding: '4px 16px 0' }}>
          <div style={{
            background: 'var(--cream-2)', borderRadius: 12, padding: '8px 12px',
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-2)',
            letterSpacing: -0.1, lineHeight: 1.4,
          }}>“{day.note}”</div>
        </div>
      )}

      <div style={{ padding: '10px 16px 120px', display: 'flex', flexDirection: 'column', gap: 8, opacity: day.skipped ? 0.45 : 1 }}>
        {day.meals.map((m, i) => (
          <div key={i}
            onClick={onOpenMeal ? () => onOpenMeal(day.day, i, m) : undefined}
            style={{
              background: m.prep ? 'var(--olive-soft)' : '#fff',
              borderRadius: 16, padding: 14,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: onOpenMeal ? 'pointer' : 'default',
              opacity: m.skipped ? 0.4 : m.eaten ? 0.55 : 1,
              textDecoration: m.skipped ? 'line-through' : 'none',
              boxShadow: m.prep ? 'none' : '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: m.prep ? 'var(--olive)' : 'var(--cream-2)',
              color: m.prep ? '#fff' : 'var(--ink-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
              letterSpacing: 0.04, flexShrink: 0,
            }}>{m.t}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3, letterSpacing: -0.1 }}>
                {m.name}{' '}
                {m.kid && <span style={{ fontFamily: 'var(--script)', fontSize: 15, color: 'var(--tangerine)' }}>kid-friendly</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 3, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
                {m.cal && <span>{m.cal} kcal</span>}
                {m.time && <span>· {m.time} min</span>}
              </div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0, opacity: 0.3 }}>
              <path d="M1 1l6 6-6 6" stroke="var(--ink-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '10px 16px 36px',
        background: 'linear-gradient(to top, var(--cream) 70%, transparent)',
        display: 'flex', gap: 8,
      }}>
        <button onClick={async () => {
          const text = days.map(d => {
            const head = `${d.day}${d.kid ? ' · kids' : ''}${d.skipped ? ' · SKIPPED' : ''}${d.note ? ` · note: ${d.note}` : ''}`;
            const lines = d.meals.map(m => `  ${m.t}: ${m.name}${m.cal ? ` (${m.cal} kcal, ${m.time || '?'} min)` : ''}`).join('\n');
            return `${head}\n${lines}`;
          }).join('\n\n');
          const full = `Mia · 7-day plan\n${summary ? `"${summary}"\n` : ''}Target: ${tuning.cals} kcal / ${tuning.protein}g protein\n\n${text}`;
          if (navigator.share) { try { await navigator.share({ title: 'Meal plan', text: full }); return; } catch {} }
          try { await navigator.clipboard.writeText(full); alert('Plan copied'); } catch { alert('Clipboard blocked'); }
        }} style={{
          background: '#fff', color: 'var(--ink-2)',
          border: '1px solid var(--divider)', borderRadius: 999,
          padding: '14px 18px',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
          cursor: 'pointer',
        }}>Copy</button>
        <button onClick={() => onNav && onNav('grocery')} style={{
          flex: 1, background: 'var(--olive-deep)', color: '#fff',
          border: 'none', borderRadius: 999, padding: '14px',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', letterSpacing: -0.1,
          boxShadow: '0 4px 14px rgba(66,77,34,0.25)',
        }}>Get grocery list →</button>
      </div>

      {noteOpen && (
        <div onClick={() => setNoteOpen(false)} style={{
          position: 'absolute', inset: 0, zIndex: 60,
          background: 'rgba(31,36,25,0.45)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', background: 'var(--cream)',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: '10px 20px 36px',
          }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(31,36,25,0.18)', margin: '6px auto 18px' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 6 }}>Note for {day.day}</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>Mia uses this when shuffling the day.</div>
            <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} autoFocus
              placeholder="e.g. I'm traveling — need something portable"
              style={{
                width: '100%', minHeight: 90, padding: 12,
                fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)',
                border: '1px solid var(--divider)', borderRadius: 12,
                background: '#fff', resize: 'none', outline: 'none',
              }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setNoteOpen(false)} style={{
                flex: 1, background: '#fff', border: '1px solid var(--divider)',
                borderRadius: 999, padding: '12px',
                fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
                color: 'var(--ink-2)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={async () => { await onUpdateDayNote?.(day.day, noteDraft); setNoteOpen(false); }} style={{
                flex: 2, background: 'var(--olive-deep)', color: '#fff',
                border: 'none', borderRadius: 999, padding: '12px',
                fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
