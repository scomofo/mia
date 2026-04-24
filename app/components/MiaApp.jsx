'use client';

import { useState, useEffect } from 'react';
import ChatApp from './ChatApp';
import { PromptSelectScreen, BrowseAllScreen } from './PromptSelect';
import { RefineScreen, PlanPreviewScreen } from './PlanScreens';
import { Dashboard, GroceryScreen, RecipeScreen, CheckinScreen, SettingsScreen } from './HomeScreens';
import { PROMPTS, rankPrompts } from './data/prompts';

export default function MiaApp() {
  const [screen, setScreen] = useState('chat');
  const [answers, setAnswers] = useState({});
  const [ranked, setRanked] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tuning, setTuning] = useState({ cals: 2200, protein: 160 });
  const [plan, setPlan] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null); // { dayKey, idx, meal }
  const [booted, setBooted] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) throw new Error(`state ${res.status}`);
        const { answers: a, plan: p } = await res.json();
        if (cancelled) return;
        if (p && a) {
          setAnswers(a);
          setPlan({ summary: p.summary, days: p.days, startedOn: p.startedOn });
          if (p.tuning) setTuning({ cals: p.tuning.cals ?? 2200, protein: p.tuning.protein ?? 160 });
          const prompt = PROMPTS.find(pr => pr.id === p.promptId);
          if (prompt) setSelected(prompt);
          setScreen('home');
        }
      } catch (e) {
        console.warn('boot: state fetch failed', e);
      } finally {
        if (!cancelled) setBooted(true);
      }
    }
    boot();
    return () => { cancelled = true; };
  }, []);

  const onChatComplete = (r) => { setRanked(r); setScreen('select'); };
  const onPick = (p) => { setSelected(p); setScreen('refine'); };
  const onGenerate = (t) => { setTuning(t); setScreen('plan'); };
  const onNav = (s) => setScreen(s);
  const onPlanReady = (p) => { setPlan(p); };
  const onOpenMeal = (dayKey, idx, meal) => { setSelectedMeal({ dayKey, idx, meal }); setScreen('recipe'); };
  const onPlanDaysUpdated = (days) => { setPlan(p => ({ ...(p || {}), days })); };
  const onChangePersona = () => {
    setRanked(rankPrompts(answers));
    setScreen('browse');
  };
  const onUpdatePrefs = async (patch) => {
    try {
      const r = await fetch('/api/update-prefs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { answers: a } = await r.json();
      setAnswers(a);
      return true;
    } catch (e) { console.warn('update-prefs failed:', e); return false; }
  };
  const onUpdateTargets = async (patch) => {
    try {
      const r = await fetch('/api/update-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { tuning: newTuning } = await r.json();
      setTuning(t => ({ ...t, ...newTuning }));
      return true;
    } catch (e) {
      console.warn('update-targets failed:', e);
      return false;
    }
  };
  const onToggleSkipDay = async (dayKey) => {
    try {
      const r = await fetch('/api/toggle-skip-day', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: dayKey }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { days } = await r.json();
      setPlan(p => ({ ...(p || {}), days }));
    } catch (e) { console.warn('toggle-skip-day failed:', e); }
  };
  const onUpdateDayNote = async (dayKey, note) => {
    try {
      const r = await fetch('/api/update-day-note', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: dayKey, note }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { days } = await r.json();
      setPlan(p => ({ ...(p || {}), days }));
    } catch (e) { console.warn('update-day-note failed:', e); }
  };
  const onToggleEaten = async (dayKey, idx, eaten) => {
    try {
      const r = await fetch('/api/mark-eaten', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: dayKey, idx, eaten }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { days } = await r.json();
      setPlan(p => ({ ...(p || {}), days }));
    } catch (e) { console.warn('toggle-eaten failed:', e); }
  };
  const onRegenerateDay = async (dayKey) => {
    try {
      const r = await fetch('/api/regenerate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: dayKey }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { days } = await r.json();
      setPlan(p => ({ ...(p || {}), days }));
      return true;
    } catch (e) {
      console.warn('regenerate-day failed:', e);
      return false;
    }
  };
  const onRegenerate = async () => {
    try {
      const r = await fetch('/api/regenerate-plan', { method: 'POST' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { summary, days, startedOn } = await r.json();
      setPlan({ summary, days, startedOn });
      return true;
    } catch (e) {
      console.warn('regenerate failed:', e);
      return false;
    }
  };
  const onMealSwapped = (dayKey, idx, meal, days) => {
    setPlan(p => ({ ...(p || {}), days }));
    setSelectedMeal({ dayKey, idx, meal });
  };
  const onRestart = async () => {
    try { await fetch('/api/state', { method: 'DELETE' }); } catch {}
    setAnswers({}); setRanked([]); setSelected(null); setPlan(null); setScreen('chat');
  };

  if (!booted) return (
    <div className="mia-root" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--olive)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 28,
        color: '#fff',
        animation: 'fadeIn 300ms ease-out',
        boxShadow: '0 4px 14px rgba(66,77,34,0.3)',
      }}>m</div>
    </div>
  );

  return (
    <div className="mia-root">
      {offline && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--tomato)', color: '#fff',
          padding: '4px 12px', textAlign: 'center',
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: 0.08, textTransform: 'uppercase',
          fontWeight: 600,
        }}>Offline — generation unavailable</div>
      )}
      {screen === 'chat' && (
        <ChatApp onComplete={onChatComplete} answers={answers} setAnswers={setAnswers} />
      )}
      {screen === 'select' && (
        <PromptSelectScreen
          ranked={ranked}
          onPick={onPick}
          onBrowseAll={() => setScreen('browse')}
          onBack={() => setScreen('chat')}
        />
      )}
      {screen === 'browse' && (
        <BrowseAllScreen ranked={ranked} onPick={onPick} onBack={() => setScreen('select')} />
      )}
      {screen === 'refine' && selected && (
        <RefineScreen
          prompt={selected}
          answers={answers}
          onGenerate={onGenerate}
          onBack={() => setScreen('select')}
        />
      )}
      {screen === 'plan' && selected && (
        <PlanPreviewScreen
          prompt={selected}
          answers={answers}
          tuning={tuning}
          initialPlan={plan}
          onPlanReady={onPlanReady}
          onOpenMeal={onOpenMeal}
          onRegenerateDay={onRegenerateDay}
          onUpdateDayNote={onUpdateDayNote}
          onToggleSkipDay={onToggleSkipDay}
          onRestart={onRestart}
          onBack={() => setScreen('refine')}
          onNav={onNav}
        />
      )}
      {screen === 'home' && <Dashboard onNav={onNav} plan={plan} answers={answers} tuning={tuning} onOpenMeal={onOpenMeal} onRegenerate={onRegenerate} onToggleEaten={onToggleEaten} />}
      {screen === 'grocery' && <GroceryScreen onBack={() => setScreen('home')} onNav={onNav} />}
      {screen === 'recipe' && <RecipeScreen onBack={() => setScreen('home')} onNav={onNav} selected={selectedMeal} onPlanDaysUpdated={onPlanDaysUpdated} onMealSwapped={onMealSwapped} />}
      {screen === 'checkin' && <CheckinScreen onBack={() => setScreen('home')} onNav={onNav} plan={plan} />}
      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('home')} onNav={onNav} onRestart={onRestart} onRegenerate={onRegenerate} onUpdateTargets={onUpdateTargets} onUpdatePrefs={onUpdatePrefs} onChangePersona={onChangePersona} answers={answers} tuning={tuning} prompt={selected} plan={plan} />}
    </div>
  );
}
