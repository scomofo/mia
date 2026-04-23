'use client';

import { useState, useEffect } from 'react';
import ChatApp from './ChatApp';
import { PromptSelectScreen, BrowseAllScreen } from './PromptSelect';
import { RefineScreen, PlanPreviewScreen } from './PlanScreens';
import { Dashboard, GroceryScreen, RecipeScreen, CheckinScreen, SettingsScreen } from './HomeScreens';
import { PROMPTS } from './data/prompts';

export default function MiaApp() {
  const [screen, setScreen] = useState('chat');
  const [answers, setAnswers] = useState({});
  const [ranked, setRanked] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tuning, setTuning] = useState({ cals: 2200, protein: 160 });
  const [plan, setPlan] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null); // { dayKey, idx, meal }
  const [booted, setBooted] = useState(false);

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
          onRestart={onRestart}
          onBack={() => setScreen('refine')}
          onNav={onNav}
        />
      )}
      {screen === 'home' && <Dashboard onNav={onNav} plan={plan} answers={answers} tuning={tuning} onOpenMeal={onOpenMeal} onRegenerate={onRegenerate} />}
      {/* answers already passed; hasKids derived inside Dashboard */}
      {screen === 'grocery' && <GroceryScreen onBack={() => setScreen('home')} onNav={onNav} />}
      {screen === 'recipe' && <RecipeScreen onBack={() => setScreen('home')} onNav={onNav} selected={selectedMeal} onPlanDaysUpdated={onPlanDaysUpdated} onMealSwapped={onMealSwapped} />}
      {screen === 'checkin' && <CheckinScreen onBack={() => setScreen('home')} onNav={onNav} />}
      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('home')} onNav={onNav} onRestart={onRestart} onRegenerate={onRegenerate} onUpdateTargets={onUpdateTargets} answers={answers} tuning={tuning} prompt={selected} />}
    </div>
  );
}
