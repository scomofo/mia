'use client';

import { useState, useEffect } from 'react';

function ScreenHeader({ title, onBack, right, sticky = true }) {
  return (
    <div style={{
      padding: '62px 16px 14px',
      position: sticky ? 'sticky' : 'static', top: 0, zIndex: 5,
      background: 'linear-gradient(to bottom, var(--cream) 85%, transparent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(31,36,25,0.06), 0 0 0 1px rgba(31,36,25,0.05)',
            cursor: 'pointer',
          }}>
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke="var(--ink-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 style={{
          flex: 1, margin: 0,
          fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 400,
          letterSpacing: -0.02, color: 'var(--ink)',
        }}>{title}</h1>
        {right}
      </div>
    </div>
  );
}

function MealCard({ t, name, kcal, time, kid, status, onOpen }) {
  return (
    <div onClick={onOpen} style={{
      background: '#fff', borderRadius: 18, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
      position: 'relative', overflow: 'hidden',
    }}>
      {status === 'next' && <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'var(--olive)',
      }} />}
      <div style={{
        width: 46, height: 46, borderRadius: 10,
        background: status === 'done' ? 'var(--olive-soft)' : 'var(--cream-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {status === 'done' ? (
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M4 9l3.5 3.5L14 6" stroke="var(--olive-deep)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
            color: 'var(--ink-2)', letterSpacing: 0.04,
          }}>{t.toUpperCase().slice(0, 3)}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
          letterSpacing: 0.08, textTransform: 'uppercase',
        }}>{t}{kid && <span style={{ color: 'var(--tangerine)', marginLeft: 6 }}>· kids</span>}</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 500,
          color: status === 'done' ? 'var(--ink-3)' : 'var(--ink)',
          textDecoration: status === 'done' ? 'line-through' : 'none',
          marginTop: 2, lineHeight: 1.3, letterSpacing: -0.1,
        }}>{name}</div>
        <div style={{
          display: 'flex', gap: 10, marginTop: 3,
          fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
        }}>
          <span>{kcal} kcal</span>
          {time && <span>· {time} min</span>}
        </div>
      </div>
      {status === 'next' && (
        <div style={{
          background: 'var(--olive-deep)', color: '#fff',
          padding: '5px 10px', borderRadius: 999,
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
          letterSpacing: 0.04,
        }}>NEXT</div>
      )}
    </div>
  );
}

function MacroRing({ consumed, target }) {
  const pct = Math.min(100, (consumed / target) * 100);
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} stroke="rgba(31,36,25,0.08)" strokeWidth="6" fill="none" />
        <circle cx="40" cy="40" r={r} stroke="var(--olive)" strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22,
          color: 'var(--olive-deep)', lineHeight: 1,
        }}>{consumed}</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--ink-3)',
          letterSpacing: 0.06, marginTop: 1,
        }}>OF {target}</div>
      </div>
    </div>
  );
}

function QuickTile({ label, sub, glyph, tone, onClick }) {
  const tones = {
    olive: { bg: 'var(--olive-soft)', fg: 'var(--olive-deep)' },
    tomato: { bg: 'var(--tomato-soft)', fg: 'var(--tomato)' },
    tangerine: { bg: 'var(--tangerine-soft)', fg: '#B45A18' },
    ink: { bg: 'var(--cream-3)', fg: 'var(--ink)' },
  };
  const t = tones[tone] || tones.olive;
  return (
    <button onClick={onClick} style={{
      background: '#fff', border: 'none', borderRadius: 18,
      padding: 14, cursor: 'pointer', textAlign: 'left',
      boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, background: t.bg, color: t.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, marginBottom: 6,
      }}>{glyph}</div>
      <div style={{
        fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1,
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: 0.04,
      }}>{sub}</div>
    </button>
  );
}

function BottomNav({ active, onNav }) {
  const items = [
    { id: 'home', label: 'Today', glyph: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 10l8-7 8 7v9a1 1 0 01-1 1h-4v-6H8v6H4a1 1 0 01-1-1v-9z" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} fill={a ? 'var(--olive-soft)' : 'none'} strokeLinejoin="round" /></svg> },
    { id: 'plan', label: 'Plan', glyph: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="4" width="16" height="15" rx="2" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} fill={a ? 'var(--olive-soft)' : 'none'} /><path d="M7 2v4M15 2v4M3 9h16" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} strokeLinecap="round" /></svg> },
    { id: 'grocery', label: 'Shop', glyph: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 5h3l2 10h10l2-7H7" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="19" r="1.2" fill={a ? 'var(--olive-deep)' : 'var(--ink-3)'} /><circle cx="17" cy="19" r="1.2" fill={a ? 'var(--olive-deep)' : 'var(--ink-3)'} /></svg> },
    { id: 'checkin', label: 'Log', glyph: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} fill={a ? 'var(--olive-soft)' : 'none'} /><path d="M11 7v4l3 2" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} strokeLinecap="round" /></svg> },
    { id: 'settings', label: 'You', glyph: (a) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} fill={a ? 'var(--olive-soft)' : 'none'} /><path d="M3 20c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke={a ? 'var(--olive-deep)' : 'var(--ink-3)'} strokeWidth={a ? 2 : 1.6} strokeLinecap="round" fill="none" /></svg> },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      padding: '10px 12px 30px',
      background: 'rgba(250,245,233,0.92)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--divider)',
      display: 'flex', justifyContent: 'space-around',
    }}>
      {items.map(it => {
        const a = active === it.id;
        return (
          <button key={it.id} onClick={() => onNav(it.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 8px', minWidth: 48,
          }}>
            {it.glyph(a)}
            <span style={{
              fontFamily: 'var(--sans)', fontSize: 10, fontWeight: a ? 600 : 500,
              color: a ? 'var(--olive-deep)' : 'var(--ink-3)', letterSpacing: -0.1,
            }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Dashboard({ onNav, plan, tuning, onOpenMeal, onRegenerate }) {
  const today = new Date();
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  const dateLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const todayIdx = (today.getDay() + 6) % 7;
  const todayPlan = plan?.days?.[todayIdx] || null;
  const isKidNight = todayPlan ? !!todayPlan.kid : true;
  const calTarget = tuning?.cals ?? 2200;
  const consumed = todayPlan
    ? todayPlan.meals.filter(m => m.eaten && m.cal).reduce((s, m) => s + m.cal, 0)
    : 1480;
  const toGo = Math.max(0, calTarget - consumed);

  // Plan age
  const ageDays = plan?.startedOn
    ? Math.floor((today.getTime() - new Date(plan.startedOn).getTime()) / 86400000)
    : null;
  const isStale = ageDays != null && ageDays >= 7;
  const [regenStatus, setRegenStatus] = useState('idle'); // idle | generating

  const handleRegenerate = async () => {
    setRegenStatus('generating');
    await onRegenerate?.();
    setRegenStatus('idle');
  };

  // Check-in history
  const [checkins, setCheckins] = useState(null);
  useEffect(() => {
    fetch('/api/checkin')
      .then(r => r.json())
      .then(j => setCheckins(j.checkins || []))
      .catch(() => setCheckins([]));
  }, []);

  const latest = checkins?.[0];
  const previous = checkins?.[1];
  const weightDelta = latest?.weightLb && previous?.weightLb
    ? Math.round((latest.weightLb - previous.weightLb) * 10) / 10
    : null;
  const recent = (checkins || []).slice(0, 7);
  const avgAdherence = recent.length
    ? recent.reduce((s, c) => s + (c.adherence || 0), 0) / recent.length
    : null;

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)' }}>
      <div style={{
        padding: '62px 20px 28px',
        background: 'linear-gradient(165deg, oklch(96% 0.04 80) 0%, var(--cream) 65%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -20, top: 40, fontSize: 160,
          fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--olive-soft)',
          lineHeight: 1, pointerEvents: 'none', opacity: 0.7,
        }}>m</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
              letterSpacing: 0.08, textTransform: 'uppercase',
            }}>{dayName} · {dateLabel}</div>
            <h2 style={{
              margin: '6px 0 0', fontFamily: 'var(--serif)', fontSize: 36,
              fontWeight: 400, letterSpacing: -0.02, lineHeight: 1,
            }}>Good <em style={{ color: 'var(--olive-deep)' }}>morning</em></h2>
          </div>
          <button onClick={() => onNav('settings')} style={{
            background: '#fff', border: 'none',
            width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: 18, fontStyle: 'italic',
            color: 'var(--olive-deep)',
          }}>A</button>
        </div>

        {isKidNight && (
          <div style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', background: 'var(--tangerine-soft)', borderRadius: 999,
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.04,
            color: '#8B4A1A', fontWeight: 500,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tangerine)' }} />
            KIDS NIGHT · NIGHT 2 OF 4
          </div>
        )}
      </div>

      <div style={{ padding: '4px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '8px 4px' }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
            letterSpacing: 0.08, textTransform: 'uppercase',
          }}>Today&apos;s plan</div>
          <button onClick={() => onNav('plan')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--olive-deep)', fontWeight: 500,
          }}>Full week →</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todayPlan
            ? todayPlan.meals.map((m, i) => {
                const firstUneaten = todayPlan.meals.findIndex(x => !x.eaten);
                return (
                  <MealCard
                    key={i}
                    onOpen={() => onOpenMeal?.(todayPlan.day, i, m)}
                    t={m.t}
                    name={m.name}
                    kcal={m.cal}
                    time={m.time}
                    kid={m.kid}
                    status={m.eaten ? 'done' : i === firstUneaten ? 'next' : undefined}
                  />
                );
              })
            : (
              <>
                <MealCard onOpen={() => onNav('recipe')} t="Breakfast" name="Overnight oats + almonds" kcal={440} time={2} status="done" />
                <MealCard onOpen={() => onNav('recipe')} t="Lunch" name="Leftover meatballs bowl" kcal={540} time={4} status="next" />
                <MealCard onOpen={() => onNav('recipe')} t="Dinner" name="Taco night — build-your-own" kcal={680} time={25} kid />
                <MealCard onOpen={() => onNav('recipe')} t="Snack" name="Cottage cheese + honey" kcal={180} />
              </>
            )}
        </div>
      </div>

      {isStale && (
        <div style={{ padding: '8px 16px 0' }}>
          <div style={{
            background: 'var(--tomato-soft)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--tomato)', letterSpacing: 0.08, textTransform: 'uppercase', fontWeight: 600 }}>
                Plan is {ageDays} days old
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-2)', marginTop: 2, letterSpacing: -0.1 }}>
                Ready for a fresh week?
              </div>
            </div>
            <button onClick={handleRegenerate} disabled={regenStatus !== 'idle'} style={{
              background: 'var(--tomato)', color: '#fff', border: 'none',
              borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--sans)',
              fontSize: 12, fontWeight: 600, cursor: regenStatus !== 'idle' ? 'wait' : 'pointer',
              opacity: regenStatus !== 'idle' ? 0.6 : 1, whiteSpace: 'nowrap',
            }}>{regenStatus === 'generating' ? 'Cooking…' : 'New week →'}</button>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{
          background: '#fff', borderRadius: 22, padding: 18,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <MacroRing consumed={consumed} target={calTarget} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
              letterSpacing: 0.08, textTransform: 'uppercase',
            }}>On track</div>
            <div style={{
              fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, letterSpacing: -0.01,
              marginTop: 2, lineHeight: 1.1,
            }}>{toGo} kcal to go</div>
            <div style={{
              display: 'flex', gap: 10, marginTop: 10,
              fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
            }}>
              <span><b style={{ color: 'var(--olive-deep)', fontFamily: 'var(--sans)', fontSize: 12 }}>110g</b> protein</span>
              <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 12 }}>48g</b> fat</span>
              <span><b style={{ color: 'var(--ink)', fontFamily: 'var(--sans)', fontSize: 12 }}>145g</b> carbs</span>
            </div>
          </div>
        </div>
      </div>

      {checkins && (
        <div style={{ padding: '4px 16px 8px' }}>
          <div onClick={() => onNav('checkin')} style={{
            background: '#fff', borderRadius: 18, padding: 14,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
          }}>
            {latest ? (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>Weight</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--olive-deep)', lineHeight: 1 }}>{latest.weightLb ?? '—'}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>lb</span>
                    {weightDelta != null && weightDelta !== 0 && (
                      <span style={{
                        marginLeft: 6, padding: '2px 6px', borderRadius: 6,
                        background: weightDelta < 0 ? 'var(--olive-soft)' : 'var(--tomato-soft)',
                        color: weightDelta < 0 ? 'var(--olive-deep)' : 'var(--tomato)',
                        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                      }}>{weightDelta < 0 ? '▼' : '▲'} {Math.abs(weightDelta)}</span>
                    )}
                  </div>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--divider)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>Adherence</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--olive-deep)', lineHeight: 1 }}>
                      {avgAdherence != null ? `${Math.round((avgAdherence / 5) * 100)}%` : '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>last {recent.length}</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 17, color: 'var(--ink)', letterSpacing: -0.01 }}>Log your first check-in</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Weight, energy, and a note to Mia</div>
              </div>
            )}
            <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0, opacity: 0.3 }}>
              <path d="M1 1l6 6-6 6" stroke="var(--ink-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 16px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <QuickTile onClick={() => onNav('grocery')} label="Grocery" sub="14 items · $87" glyph="◈" tone="olive" />
          <QuickTile onClick={() => onNav('checkin')} label="Check-in" sub="Log today" glyph="◉" tone="tomato" />
          <QuickTile onClick={() => onNav('plan')} label="Meal plan" sub="7 days" glyph="◐" tone="tangerine" />
          <QuickTile onClick={() => onNav('settings')} label="Profile" sub="Edit & prefs" glyph="◇" tone="ink" />
        </div>
      </div>

      <BottomNav active="home" onNav={onNav} />
    </div>
  );
}

const GROCERY = [
  { cat: 'Produce', items: [
    { name: 'Avocados', qty: '4', done: false, offer: { kind: 'sale', label: '2/$5 at Sobeys', save: '$1.20' } },
    { name: 'Sweet potatoes', qty: '3 lb', done: true },
    { name: 'Spinach', qty: '2 bags', done: false, offer: { kind: 'pc', label: '500 pts loaded', save: '$0.50' } },
    { name: 'Lemons', qty: '6', done: false },
    { name: 'Bell peppers', qty: '4', done: true, offer: { kind: 'coop', label: 'Co-op member $1.88/ea', save: '$2.00' } },
    { name: 'Cherry tomatoes', qty: '2 pint', done: false, offer: { kind: 'pc', label: '750 pts when you buy 2', save: '$0.75' } },
  ]},
  { cat: 'Protein', items: [
    { name: 'Chicken breast', qty: '3 lb', done: false, offer: { kind: 'coop', label: 'Co-op boneless $4.99/lb', save: '$4.50' } },
    { name: 'Ground turkey', qty: '2 lb', done: false, offer: { kind: 'pc', label: '2,000 pts · PC Blue Menu', save: '$2.00' } },
    { name: 'Salmon fillets', qty: '4 × 6oz', done: false, offer: { kind: 'sale', label: '$3 off · RCSS flyer', save: '$3.00' } },
    { name: 'Eggs', qty: '2 dozen', done: true },
  ]},
  { cat: 'Pantry', items: [
    { name: 'Jasmine rice', qty: '2 lb', done: false },
    { name: 'Olive oil', qty: '1 bottle', done: false, offer: { kind: 'pc', label: '1,500 pts loaded', save: '$1.50' } },
    { name: 'Tortillas', qty: '1 pack', done: false },
    { name: 'Black beans', qty: '3 cans', done: false, offer: { kind: 'coop', label: 'Co-op Gold 3/$4', save: '$1.47' } },
  ]},
  { cat: 'Dairy', items: [
    { name: 'Greek yogurt', qty: '2 lb tub', done: false, offer: { kind: 'pc', label: '3,000 pts on 2 tubs', save: '$3.00' } },
    { name: 'Cottage cheese', qty: '16 oz', done: false },
  ]},
];

const OFFER_STYLES = {
  pc: { bg: '#fef3c7', fg: '#78350f', dot: '#eab308', short: 'PC' },
  coop: { bg: '#dbeafe', fg: '#1e3a8a', dot: '#2563eb', short: 'CO-OP' },
  sale: { bg: 'rgba(31,36,25,0.06)', fg: 'var(--ink-2)', dot: 'var(--ink-3)', short: 'SALE' },
};

function SendOption({ primary, dim, swatch, dot, title, sub, cta, badge, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: primary ? '#fff' : 'transparent',
      border: primary ? 'none' : '1px solid var(--divider)',
      borderRadius: 18, padding: '14px 16px', marginBottom: 8,
      boxShadow: primary ? '0 2px 8px rgba(31,36,25,0.06), 0 0 0 1px rgba(31,36,25,0.05)' : 'none',
      cursor: dim ? 'default' : 'pointer',
      opacity: dim ? 0.5 : 1,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: swatch,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1 }}>{title}</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
        {badge && !dim && (
          <div style={{
            display: 'inline-block', marginTop: 6, padding: '2px 7px',
            background: swatch, borderRadius: 6,
            fontFamily: 'var(--mono)', fontSize: 9.5, fontWeight: 600, letterSpacing: 0.06,
            color: 'var(--ink-2)',
          }}>{badge}</div>
        )}
      </div>
      {cta && (
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, color: 'var(--olive-deep)', whiteSpace: 'nowrap' }}>{cta}</div>
      )}
    </div>
  );
}

function ShareTile({ glyph, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: '#fff', border: 'none', borderRadius: 14,
      padding: '14px 12px', cursor: 'pointer', textAlign: 'left',
      boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.05)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>{glyph}</div>
      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.1, marginTop: 2 }}>{title}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.04 }}>{sub}</div>
    </button>
  );
}

function SendSheet({ open, onClose, store }) {
  if (!open) return null;
  const pcPrimary = store === 'rcss';
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(31,36,25,0.45)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fadeIn 180ms ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: 'var(--cream)',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '10px 16px 32px',
        maxHeight: '85%', overflow: 'auto',
        animation: 'slideUp 220ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(31,36,25,0.18)', margin: '6px auto 16px' }} />

        <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400, color: 'var(--ink)', letterSpacing: -0.02, lineHeight: 1.1 }}>Send your list</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginTop: 6, marginBottom: 18 }}>28 items · $87.40 estimated</div>

        <SendOption
          primary={pcPrimary} dim={!pcPrimary}
          swatch="#fef3c7" dot="#eab308"
          title="PC Express pickup"
          sub={pcPrimary ? 'RCSS Camrose · tomorrow 4–5pm' : 'Switch to RCSS store to use'}
          cta={pcPrimary ? 'Open PC Express →' : null}
          badge="7 PC Optimum offers pre-loaded"
          onClick={() => pcPrimary && window.open('https://www.pcexpress.ca', '_blank')}
        />
        <SendOption
          primary={!pcPrimary} dim={pcPrimary}
          swatch="#dbeafe" dot="#2563eb"
          title="Instacart · Camrose Co-op"
          sub={!pcPrimary ? 'Delivery in ~2 hrs · $3.99' : 'Switch to Co-op store to use'}
          cta={!pcPrimary ? 'Open Instacart →' : null}
          badge="Member pricing applied"
          onClick={() => !pcPrimary && window.open('https://www.instacart.ca', '_blank')}
        />

        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.1, textTransform: 'uppercase', margin: '20px 4px 10px' }}>Or</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ShareTile glyph="📱" title="Text to self" sub="SMS" onClick={onClose} />
          <ShareTile glyph="✉️" title="Email" sub="alex@…" onClick={onClose} />
          <ShareTile glyph="🗒️" title="Apple Notes" sub="Checklist" onClick={onClose} />
          <ShareTile glyph="🖨️" title="Print" sub="In-store list" onClick={() => window.print()} />
        </div>

        <button onClick={onClose} style={{
          width: '100%', marginTop: 18, background: 'transparent',
          border: 'none', padding: '12px',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
          color: 'var(--ink-2)', cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  );
}

export function GroceryScreen({ onBack, onNav }) {
  const [state, setState] = useState(null);
  const [estimated, setEstimated] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | empty | generating | ready | error
  const [store, setStore] = useState('rcss');
  const [sendOpen, setSendOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/generate-grocery')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.categories?.length) {
          setState(data.categories.map(c => ({ ...c, items: c.items.map(i => ({ done: false, ...i })) })));
          setEstimated(data.estimatedCad ?? null);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      })
      .catch(() => !cancelled && setStatus('empty'));
    return () => { cancelled = true; };
  }, []);

  const generate = async () => {
    setStatus('generating');
    try {
      const res = await fetch('/api/generate-grocery', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(data.categories.map(c => ({ ...c, items: c.items.map(i => ({ done: false, ...i })) })));
      setEstimated(data.estimatedCad ?? null);
      setStatus('ready');
    } catch (e) {
      console.warn('grocery gen failed, using sample:', e);
      setState(GROCERY.map(c => ({ ...c, items: c.items.map(i => ({ ...i })) })));
      setEstimated(87.40);
      setStatus('error');
    }
  };

  const total = state?.reduce((s, c) => s + c.items.length, 0) ?? 0;
  const doneCount = state?.reduce((s, c) => s + c.items.filter(i => i.done).length, 0) ?? 0;

  const allOffers = state?.flatMap(c => c.items.map(i => i.offer).filter(Boolean)) ?? [];
  const pcPts = allOffers.filter(o => o.kind === 'pc').reduce((s, o) => s + parseInt(o.label.match(/([\d,]+)\s*pts/)?.[1]?.replace(',', '') || '0', 10), 0);
  const coopSave = allOffers.filter(o => o.kind === 'coop').reduce((s, o) => s + parseFloat((o.save || '$0').replace('$', '')), 0);

  const toggle = (ci, ii) => {
    if (!state) return;
    const next = state.map((c, i) => ({
      ...c,
      items: c.items.map((it, j) => (i === ci && j === ii) ? { ...it, done: !it.done } : it),
    }));
    setState(next);
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)', position: 'relative' }}>
      <ScreenHeader title="Grocery list" onBack={onBack}
        right={<div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)',
          letterSpacing: 0.04, padding: '4px 10px', background: 'rgba(31,36,25,0.04)',
          borderRadius: 999,
        }}>{doneCount}/{total}</div>}
      />

      <div style={{ padding: '0 16px 120px' }}>
        <div style={{
          display: 'flex', gap: 6, padding: 4, marginBottom: 12,
          background: 'rgba(31,36,25,0.04)', borderRadius: 12,
        }}>
          {[
            { id: 'rcss', name: 'RCSS Camrose', sub: 'PC Optimum' },
            { id: 'coop', name: 'Camrose Co-op', sub: 'Member #' },
          ].map(s => (
            <button key={s.id} onClick={() => setStore(s.id)} style={{
              flex: 1, border: 'none', cursor: 'pointer',
              background: store === s.id ? '#fff' : 'transparent',
              borderRadius: 9, padding: '8px 10px', textAlign: 'left',
              boxShadow: store === s.id ? '0 1px 2px rgba(31,36,25,0.08)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
                color: store === s.id ? 'var(--ink)' : 'var(--ink-2)', letterSpacing: -0.1,
              }}>{s.name}</div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
                letterSpacing: 0.04, marginTop: 1,
              }}>{s.sub}</div>
            </button>
          ))}
        </div>

        <div style={{
          background: '#fff', borderRadius: 18, padding: '14px 16px', marginBottom: 10,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>Estimated</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--olive-deep)', lineHeight: 1, marginTop: 2 }}>${(estimated ?? 0).toFixed(2)}</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--divider)' }} />
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>For</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>7 days · {total} items</div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => setSendOpen(true)} style={{
              background: 'var(--olive-deep)', color: '#fff', border: 'none',
              borderRadius: 999, padding: '10px 14px',
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Send →</button>
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--divider)' }}>
            <div style={{ flex: 1, background: OFFER_STYLES.pc.bg, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: OFFER_STYLES.pc.dot }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: OFFER_STYLES.pc.fg, letterSpacing: 0.08, textTransform: 'uppercase', fontWeight: 600 }}>PC Optimum</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', color: OFFER_STYLES.pc.fg, lineHeight: 1, marginTop: 6 }}>{(pcPts / 1000).toFixed(1)}k pts</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10.5, color: OFFER_STYLES.pc.fg, opacity: 0.75, marginTop: 2 }}>≈ ${(pcPts / 1000).toFixed(2)} back</div>
            </div>
            <div style={{ flex: 1, background: OFFER_STYLES.coop.bg, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: OFFER_STYLES.coop.dot }} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: OFFER_STYLES.coop.fg, letterSpacing: 0.08, textTransform: 'uppercase', fontWeight: 600 }}>Co-op saving</div>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontStyle: 'italic', color: OFFER_STYLES.coop.fg, lineHeight: 1, marginTop: 6 }}>${coopSave.toFixed(2)}</div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 10.5, color: OFFER_STYLES.coop.fg, opacity: 0.75, marginTop: 2 }}>member price + equity</div>
            </div>
          </div>

          <button style={{
            width: '100%', marginTop: 10, background: 'transparent',
            border: '1px dashed rgba(31,36,25,0.25)', borderRadius: 10,
            padding: '9px 12px', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            Load 7 new PC Optimum offers to your card
          </button>
        </div>

        {status === 'empty' && (
          <div style={{
            background: '#fff', borderRadius: 18, padding: 18, marginBottom: 12,
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
          }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}>No list yet</div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>Build a grocery list from your 7-day plan.</div>
            <button onClick={generate} style={{
              background: 'var(--olive-deep)', color: '#fff', border: 'none',
              borderRadius: 999, padding: '10px 18px',
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Generate from plan →</button>
          </div>
        )}
        {status === 'generating' && (
          <div style={{
            background: '#fff', borderRadius: 18, padding: 24, marginBottom: 12,
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)',
          }}>Mia is building your list…</div>
        )}
        {status === 'error' && (
          <div style={{
            padding: '6px 10px', marginBottom: 10,
            background: 'var(--tomato-soft)', borderRadius: 8,
            fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--tomato)',
            letterSpacing: 0.04,
          }}>Using sample list — couldn&apos;t reach Mia</div>
        )}
        {state?.map((cat, ci) => (
          <div key={cat.cat} style={{ marginBottom: 18 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
              letterSpacing: 0.1, textTransform: 'uppercase',
              padding: '4px 4px 8px', fontWeight: 500,
            }}>{cat.cat} · {cat.items.length}</div>
            <div style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
            }}>
              {cat.items.map((it, ii) => (
                <div key={it.name} onClick={() => toggle(ci, ii)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', cursor: 'pointer',
                  borderBottom: ii < cat.items.length - 1 ? '1px solid var(--divider)' : 'none',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7,
                    border: it.done ? 'none' : '1.5px solid rgba(31,36,25,0.18)',
                    background: it.done ? 'var(--olive-deep)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {it.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
                      color: it.done ? 'var(--ink-mute)' : 'var(--ink)',
                      textDecoration: it.done ? 'line-through' : 'none', letterSpacing: -0.1,
                    }}>{it.name}</div>
                    {it.offer && !it.done && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        marginTop: 4, padding: '2px 7px',
                        background: OFFER_STYLES[it.offer.kind].bg,
                        borderRadius: 6,
                      }}>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                          color: OFFER_STYLES[it.offer.kind].fg,
                          letterSpacing: 0.08,
                        }}>{OFFER_STYLES[it.offer.kind].short}</span>
                        <span style={{
                          fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 500,
                          color: OFFER_STYLES[it.offer.kind].fg,
                        }}>{it.offer.label}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.04 }}>{it.qty}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SendSheet open={sendOpen} onClose={() => setSendOpen(false)} store={store} />
      <BottomNav active="grocery" onNav={onNav} />
    </div>
  );
}

const DAY_NAMES = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };

export function RecipeScreen({ onBack, onNav, selected, onPlanDaysUpdated, onMealSwapped }) {
  const [step, setStep] = useState(0);
  const [ingredients, setIngredients] = useState(null);
  const [steps, setSteps] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | generating | error
  const [acting, setActing] = useState(null); // 'eating' | 'swapping'
  const meal = selected?.meal;
  const isEaten = !!meal?.eaten;

  const markEaten = async () => {
    if (!selected || acting) return;
    setActing('eating');
    try {
      const r = await fetch('/api/mark-eaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selected.dayKey, idx: selected.idx, eaten: !isEaten }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { days } = await r.json();
      onPlanDaysUpdated?.(days);
      onBack?.();
    } catch (e) {
      console.warn('mark-eaten failed:', e);
      setActing(null);
    }
  };

  const swap = async () => {
    if (!selected || acting) return;
    setActing('swapping');
    setStatus('generating');
    try {
      const r = await fetch('/api/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selected.dayKey, idx: selected.idx }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { meal: newMeal, days } = await r.json();
      setIngredients(null);
      setSteps(null);
      setStep(0);
      onMealSwapped?.(selected.dayKey, selected.idx, newMeal, days);
    } catch (e) {
      console.warn('swap failed:', e);
      setStatus('ready');
    } finally {
      setActing(null);
    }
  };

  useEffect(() => {
    if (!selected) { setStatus('error'); return; }
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`/api/generate-recipe?day=${selected.dayKey}&idx=${selected.idx}`);
        const j = await r.json();
        if (cancelled) return;
        if (j.recipe) {
          setIngredients(j.recipe.ingredients);
          setSteps(j.recipe.steps);
          setStatus('ready');
          return;
        }
        setStatus('generating');
        const g = await fetch('/api/generate-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day: selected.dayKey, idx: selected.idx }),
        });
        if (!g.ok) throw new Error(`HTTP ${g.status}`);
        const gj = await g.json();
        if (cancelled) return;
        setIngredients(gj.recipe.ingredients);
        setSteps(gj.recipe.steps);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        console.warn('recipe load failed:', e);
        setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selected]);

  const dayLabel = selected ? DAY_NAMES[selected.dayKey] ?? selected.dayKey : '';
  const mealLabel = meal?.t ?? '';
  const mealName = meal?.name ?? 'Recipe';

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)' }}>
      <div style={{
        position: 'relative', height: 260,
        background: 'linear-gradient(135deg, oklch(90% 0.09 80), oklch(78% 0.11 55))',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.15,
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 14px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.85)',
          letterSpacing: 0.1, textTransform: 'uppercase',
        }}>[ Food photo ]</div>
        <div style={{ padding: '62px 16px 14px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.85)', border: 'none',
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}>
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke="var(--ink)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--cream)', marginTop: -24, borderRadius: '24px 24px 0 0', padding: '20px 20px 160px', position: 'relative' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: 0.1, textTransform: 'uppercase' }}>{dayLabel} · {mealLabel}</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, letterSpacing: -0.02, margin: '4px 0 0', lineHeight: 1.05 }}>{mealName}</h1>
        {meal?.kid && (
          <div style={{ fontFamily: 'var(--script)', fontSize: 19, color: 'var(--tangerine)', marginTop: 2 }}>kid-friendly</div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
          {[
            { l: 'Time', v: meal?.time ? `${meal.time} min` : '—' },
            { l: 'Kcal', v: meal?.cal ? String(meal.cal) : '—' },
            { l: 'Meal', v: mealLabel || '—' },
            { l: 'Serves', v: '1' },
          ].map(s => (
            <div key={s.l} style={{
              flex: 1, background: '#fff', borderRadius: 12, padding: '10px 8px',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
            }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', marginTop: 1 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {(status === 'loading' || status === 'generating') && (
          <div style={{
            marginTop: 22, padding: 24, textAlign: 'center',
            background: '#fff', borderRadius: 16,
            boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)',
          }}>{status === 'generating' ? 'Mia is writing this recipe…' : 'Loading…'}</div>
        )}

        {status === 'error' && (
          <div style={{
            marginTop: 22, padding: 18, textAlign: 'center',
            background: 'var(--tomato-soft)', borderRadius: 14,
            fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--tomato)',
          }}>Couldn&apos;t load this recipe.</div>
        )}

        {status === 'ready' && (
          <>
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: 0, fontStyle: 'italic' }}>Ingredients</h3>
              </div>
              <div style={{
                background: '#fff', borderRadius: 16, padding: '6px 14px', marginTop: 10,
                boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
              }}>
                {ingredients?.map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, padding: '10px 0',
                    borderBottom: i < ingredients.length - 1 ? '1px solid var(--divider)' : 'none',
                  }}>
                    <div style={{ width: 72, flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--olive-deep)', fontWeight: 500 }}>{row.qty}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink)' }}>{row.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 22 }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: '0 0 10px', fontStyle: 'italic' }}>Method</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps?.map((s, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div key={i} onClick={() => setStep(i)} style={{
                  background: active ? 'var(--olive-soft)' : '#fff',
                  borderRadius: 14, padding: 14,
                  display: 'flex', gap: 12, cursor: 'pointer',
                  boxShadow: active ? 'none' : '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
                  border: active ? '1px solid var(--olive)' : '1px solid transparent',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? 'var(--olive-deep)' : (active ? 'var(--olive)' : 'var(--cream-2)'),
                    color: done || active ? '#fff' : 'var(--ink-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15,
                    flexShrink: 0,
                  }}>{done ? '✓' : i + 1}</div>
                  <div style={{
                    flex: 1, fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.45,
                    color: done ? 'var(--ink-3)' : 'var(--ink-2)',
                  }}>{s}</div>
                </div>
              );
            })}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 70, zIndex: 30,
        padding: '12px 16px 12px',
        background: 'linear-gradient(to top, var(--cream) 70%, transparent)',
        display: 'flex', gap: 8,
      }}>
        <button onClick={swap} disabled={!!acting} style={{
          background: '#fff', border: '1px solid var(--divider)',
          borderRadius: 999, padding: '14px 16px',
          fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--ink-2)', fontWeight: 500,
          cursor: acting ? 'wait' : 'pointer',
          opacity: acting ? 0.6 : 1,
        }}>{acting === 'swapping' ? 'Swapping…' : 'Swap'}</button>
        <button onClick={markEaten} disabled={!!acting} style={{
          flex: 1,
          background: isEaten ? 'var(--ink-2)' : 'var(--olive-deep)', color: '#fff',
          border: 'none', borderRadius: 999, padding: '14px',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: acting ? 'wait' : 'pointer', letterSpacing: -0.1,
          boxShadow: '0 4px 14px rgba(66,77,34,0.25)',
          opacity: acting === 'eating' ? 0.6 : 1,
        }}>{acting === 'eating' ? 'Saving…' : isEaten ? 'Unmark eaten' : 'Mark eaten →'}</button>
      </div>
      <BottomNav active="plan" onNav={onNav} />
    </div>
  );
}

function ScaleInput({ label, value, onChange, lowLabel, highLabel }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 18, marginBottom: 12,
      boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--olive-deep)' }}>{value}/5</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, height: 42, borderRadius: 10,
            background: n <= value ? 'var(--olive)' : 'var(--cream-2)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            color: n <= value ? '#fff' : 'var(--ink-mute)',
          }}>{n}</button>
        ))}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 6,
        fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)',
        letterSpacing: 0.04, textTransform: 'uppercase',
      }}>
        <span>{lowLabel}</span><span>{highLabel}</span>
      </div>
    </div>
  );
}

export function CheckinScreen({ onBack, onNav }) {
  const [weight, setWeight] = useState(173);
  const [energy, setEnergy] = useState(3);
  const [adherence, setAdherence] = useState(4);
  const [mood, setMood] = useState('neutral');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightLb: weight, energy, adherence, cravings: mood, noteToMia: note }),
      });
      setSaved(true);
      setTimeout(() => onNav('home'), 600);
    } catch (e) {
      console.warn('checkin save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)' }}>
      <ScreenHeader title={<>Check-in <em style={{ fontStyle: 'italic', color: 'var(--olive-deep)' }}>·</em> <span style={{ fontFamily: 'var(--script)', fontSize: 26, color: 'var(--tangerine)' }}>today</span></>} onBack={onBack} />
      <div style={{ padding: '0 16px 160px' }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: 18, marginBottom: 12,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>Weight</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 44, color: 'var(--olive-deep)', lineHeight: 1 }}>{weight}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>lb</span>
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--olive-deep)',
              background: 'var(--olive-soft)', padding: '4px 10px', borderRadius: 999,
              fontWeight: 500,
            }}>▼ 1.4 lb this week</div>
          </div>
          <input type="range" min="150" max="220" step="0.2" value={weight}
            onChange={e => setWeight(+e.target.value)}
            style={{ width: '100%', marginTop: 12, accentColor: 'var(--olive-deep)' }} />
        </div>

        <ScaleInput label="Energy" value={energy} onChange={setEnergy} lowLabel="drained" highLabel="pumped" />
        <ScaleInput label="Plan adherence" value={adherence} onChange={setAdherence} lowLabel="off the rails" highLabel="nailed it" />

        <div style={{
          background: '#fff', borderRadius: 20, padding: 18, marginBottom: 12,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 10 }}>Cravings</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'none', label: 'None' },
              { id: 'sweet', label: 'Sweet' },
              { id: 'salty', label: 'Salty' },
              { id: 'carbs', label: 'Carbs' },
              { id: 'chocolate', label: 'Chocolate' },
              { id: 'meat', label: 'Meat' },
            ].map(m => (
              <button key={m.id} onClick={() => setMood(m.id)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 10,
                background: mood === m.id ? 'var(--olive-deep)' : 'var(--cream-2)',
                color: mood === m.id ? '#fff' : 'var(--ink-2)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500,
              }}>{m.label}</button>
            ))}
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: 20, padding: 18,
          boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 8 }}>Note to Mia</div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. kids' pizza night tanked my week — can we prep leaner Sundays?"
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16,
              color: 'var(--ink)', minHeight: 70, lineHeight: 1.4,
              background: 'transparent',
            }} />
        </div>
      </div>

      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 70, zIndex: 30,
        padding: '12px 16px 12px',
        background: 'linear-gradient(to top, var(--cream) 70%, transparent)',
      }}>
        <button onClick={save} disabled={saving} style={{
          width: '100%',
          background: saved ? 'var(--olive)' : 'var(--olive-deep)', color: '#fff',
          border: 'none', borderRadius: 999, padding: '16px',
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          cursor: saving ? 'wait' : 'pointer', letterSpacing: -0.1,
          boxShadow: '0 4px 14px rgba(66,77,34,0.25)',
          opacity: saving ? 0.7 : 1,
        }}>{saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save check-in →'}</button>
      </div>
      <BottomNav active="checkin" onNav={onNav} />
    </div>
  );
}

function Stat({ v, u, l }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--olive-deep)', lineHeight: 1 }}>{v}</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{u}</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
    </div>
  );
}

function SettingGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
        letterSpacing: 0.1, textTransform: 'uppercase',
        padding: '0 4px 8px', fontWeight: 500,
      }}>{title}</div>
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
      }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, value, onClick, chevron = true, toggle = false, tone = 'normal' }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '13px 16px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: '1px solid var(--divider)',
    }}>
      <div style={{
        flex: 1, fontFamily: 'var(--sans)', fontSize: 14.5, fontWeight: 500,
        color: tone === 'muted' ? 'var(--ink-3)' : 'var(--ink)', letterSpacing: -0.1,
      }}>{label}</div>
      {toggle ? (
        <div style={{
          width: 40, height: 24, borderRadius: 12,
          background: value ? 'var(--olive)' : 'rgba(31,36,25,0.15)',
          position: 'relative', transition: 'background 150ms',
        }}>
          <div style={{
            position: 'absolute', top: 2, left: value ? 18 : 2,
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transition: 'left 150ms', boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }} />
        </div>
      ) : (
        <>
          {value && <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)' }}>{value}</span>}
          {chevron && (
            <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0, opacity: 0.35 }}>
              <path d="M1 1l5 5-5 5" stroke="var(--ink-2)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </>
      )}
    </div>
  );
}

const HOUSEHOLD_LABEL = {
  solo: 'Just me', couple: 'Me + partner', family: 'Family', split: 'Split — kids part time',
};
const PATTERN_LABEL = {
  same: 'Same every day', weekday: 'Weekday vs weekend',
  alternating: 'Alternating weeks', shifting: 'Shifts all the time',
};
const KIDS_LABEL = {
  'no-kids': 'No kids', toddler: 'Under 5', school: '6–12', teen: '13+', mix: 'Mixed ages',
};
const GOAL_LABEL = {
  'lose-fat': 'Fat loss', 'build-muscle': 'Muscle gain', maintain: 'Maintain',
  energy: 'Energy', health: 'Health', family: 'Family nutrition',
};
const BUDGET_LABEL = {
  tight: '< $100/wk', normal: '$100–200/wk', flex: '$200–350/wk', open: 'Open',
};
const fmtList = (arr, fallback = 'None') => {
  if (!arr?.length) return fallback;
  const filtered = arr.filter(x => x !== 'none');
  if (!filtered.length) return fallback;
  return filtered.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(', ');
};

function TargetEditor({ open, label, unit, min, max, step, value, onSave, onClose }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value, open]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
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
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4, marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 44, color: 'var(--olive-deep)', lineHeight: 1 }}>{v}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>{unit}</span>
        </div>
        <input type="range" min={min} max={max} step={step} value={v}
          onChange={e => setV(+e.target.value)}
          style={{ width: '100%', accentColor: 'var(--olive-deep)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 18 }}>
          <span>{min}</span><span>{max}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, background: '#fff', border: '1px solid var(--divider)',
            borderRadius: 999, padding: '12px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--ink-2)', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={() => onSave(v)} style={{
            flex: 2, background: 'var(--olive-deep)', color: '#fff',
            border: 'none', borderRadius: 999, padding: '12px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function SettingsScreen({ onBack, onNav, onRestart, onRegenerate, onUpdateTargets, answers = {}, tuning, prompt }) {
  const [editor, setEditor] = useState(null); // 'cals' | 'protein' | null
  const hh = HOUSEHOLD_LABEL[answers.household] || '—';
  const pat = PATTERN_LABEL[answers.pattern] || '—';
  const kids = KIDS_LABEL[answers.kids] || '—';
  const goal = GOAL_LABEL[answers.goal] || '—';
  const budget = BUDGET_LABEL[answers.budget] || '—';
  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--cream)' }}>
      <ScreenHeader title="Profile" onBack={onBack} />
      <div style={{ padding: '0 16px 120px' }}>
        <div style={{
          background: 'linear-gradient(145deg, var(--cream-3) 0%, var(--cream-2) 100%)',
          borderRadius: 22, padding: 20, marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--olive-deep)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 32,
            }}>A</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.1 }}>You</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.04, marginTop: 2 }}>{prompt?.title || 'Meal plan'} · {goal.toLowerCase()}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(31,36,25,0.08)' }}>
            <Stat v="−3.2" u="lb" l="Lost" />
            <Stat v="87%" u="" l="Adherence" />
            <Stat v="28" u="" l="Meals logged" />
          </div>
        </div>

        <SettingGroup title="Store & loyalty">
          <SettingRow label="Home store" value="RCSS Camrose" onClick={() => {}} />
          <SettingRow label="PC Optimum" value="•••• 4829 · 42,150 pts" onClick={() => {}} />
          <SettingRow label="Load PC offers" value="7 new this week" chevron onClick={() => window.open('https://www.pcoptimum.ca/load?page=RCSSDigitalCouponBoard20220929', '_blank')} />
          <SettingRow label="Co-op membership" value="#CR-3104 · $127 equity" onClick={() => {}} />
          <SettingRow label="Flyer-match savings" toggle value={true} />
        </SettingGroup>

        <SettingGroup title="Household">
          <SettingRow label="Who's eating" value={hh} onClick={() => {}} />
          <SettingRow label="Pattern" value={pat} onClick={() => {}} />
          <SettingRow label="Kids" value={kids} onClick={() => {}} />
        </SettingGroup>

        <SettingGroup title="Plan">
          <SettingRow label="Active prompt" value={prompt?.title || '—'} onClick={() => {}} />
          <SettingRow label="Calorie target" value={tuning?.cals ? `${tuning.cals.toLocaleString()} kcal` : '—'} onClick={() => setEditor('cals')} />
          <SettingRow label="Protein target" value={tuning?.protein ? `${tuning.protein} g/day` : '—'} onClick={() => setEditor('protein')} />
          <SettingRow label="Generate new week" value="" chevron onClick={async () => { await onRegenerate?.(); onNav?.('home'); }} />
          <SettingRow label="Restart onboarding" value="" chevron onClick={() => onRestart?.()} tone="muted" />
        </SettingGroup>

        <SettingGroup title="Preferences">
          <SettingRow label="Loves" value={fmtList(answers.loves, '—')} onClick={() => {}} />
          <SettingRow label="Hard no" value={fmtList(answers.hates, 'Nothing')} onClick={() => {}} />
          <SettingRow label="Restrictions" value={fmtList(answers.restrictions, 'None')} onClick={() => {}} />
          <SettingRow label="Budget" value={budget} onClick={() => {}} />
        </SettingGroup>

        <SettingGroup title="App">
          <SettingRow label="Notifications" toggle value={true} />
          <SettingRow label="Dark mode" toggle value={false} />
          <SettingRow label="Export plan" chevron onClick={() => {}} />
          <SettingRow label="Sign out" tone="muted" chevron onClick={() => {}} />
        </SettingGroup>
      </div>
      <BottomNav active="settings" onNav={onNav} />
      <TargetEditor
        open={editor === 'cals'}
        label="Daily calories"
        unit="kcal"
        min={1400} max={3500} step={50}
        value={tuning?.cals ?? 2200}
        onClose={() => setEditor(null)}
        onSave={async v => { await onUpdateTargets?.({ cals: v }); setEditor(null); }}
      />
      <TargetEditor
        open={editor === 'protein'}
        label="Daily protein"
        unit="g"
        min={80} max={250} step={5}
        value={tuning?.protein ?? 160}
        onClose={() => setEditor(null)}
        onSave={async v => { await onUpdateTargets?.({ protein: v }); setEditor(null); }}
      />
    </div>
  );
}
