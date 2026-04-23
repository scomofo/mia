// app.jsx — root app, screen routing, tweaks

const { useState: useSA, useEffect: useEA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "olive",
  "density": "comfortable",
  "startScreen": "chat"
}/*EDITMODE-END*/;

const ACCENTS = {
  olive: { '--olive': 'oklch(58% 0.12 130)', '--olive-deep': 'oklch(42% 0.11 130)', '--olive-soft': 'oklch(92% 0.06 130)' },
  tomato: { '--olive': 'oklch(62% 0.17 28)', '--olive-deep': 'oklch(45% 0.14 28)', '--olive-soft': 'oklch(93% 0.05 28)' },
  tangerine: { '--olive': 'oklch(72% 0.14 55)', '--olive-deep': 'oklch(52% 0.13 55)', '--olive-soft': 'oklch(93% 0.05 55)' },
  plum: { '--olive': 'oklch(55% 0.13 350)', '--olive-deep': 'oklch(40% 0.11 350)', '--olive-soft': 'oklch(92% 0.05 350)' },
};

function applyAccent(name) {
  const vars = ACCENTS[name] || ACCENTS.olive;
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

function App() {
  const [screen, setScreen] = useSA('chat'); // chat | select | browse | refine | plan | home | grocery | recipe | checkin | settings
  const isStandalone = typeof window !== 'undefined' && window.__MIA_STANDALONE__;
  const [answers, setAnswers] = useSA({});
  const [ranked, setRanked] = useSA([]);
  const [selected, setSelected] = useSA(null);
  const [tuning, setTuning] = useSA({ cals: 2200, protein: 160 });
  const [tweaks, setTweaks] = useSA(TWEAK_DEFAULTS);
  const [tweakMode, setTweakMode] = useSA(false);

  useEA(() => {
    applyAccent(tweaks.accent);
  }, [tweaks.accent]);

  // Edit mode protocol
  useEA(() => {
    const handler = (ev) => {
      const d = ev.data || {};
      if (d.type === '__activate_edit_mode') setTweakMode(true);
      if (d.type === '__deactivate_edit_mode') setTweakMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    setTweaks(t => {
      const nt = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return nt;
    });
  };

  const handleChatComplete = (r) => { setRanked(r); setScreen('select'); };
  const handlePick = (p) => { setSelected(p); setScreen('refine'); };
  const handleGenerate = (t) => {
    setTuning(t);
    // Build the Claude call for inspection / handoff
    if (window.buildClaudeCall && selected) {
      window.__lastClaudeCall = window.buildClaudeCall(answers, selected, t);
    }
    setScreen('plan');
  };
  const handleNav = (s) => setScreen(s);
  const handleRestart = () => { setAnswers({}); setRanked([]); setSelected(null); setScreen('chat'); window.location.reload(); };

  // Screen label for the left column annotation
  const screenInfo = {
    chat: { num: '01', title: 'Conversational onboarding', desc: 'A chat with Mia the dietitian — 15 turns, feels like a friend. Household, goal, constraints, loves/hates.' },
    select: { num: '02', title: 'Ranked recommendations', desc: 'Best-fit prompt gets the hero card; 3 runner-ups below; browse-all at the bottom.' },
    browse: { num: '02b', title: 'Browse all 11 prompts', desc: 'The full Nav Toor prompt catalog, still ranked by your fit score.' },
    refine: { num: '03', title: 'Refine before generating', desc: 'Show derived profile, let user adjust calories & protein, preview outputs.' },
    plan: { num: '04', title: '7-day meal plan', desc: 'The generated output — sample week with kids-nights and solo-nights, built from household pattern.' },
    home: { num: '05', title: 'Home dashboard', desc: 'Day 12. Today\u2019s meals, macro ring, quick tiles, bottom nav. Kid-night badge up top.' },
    grocery: { num: '06', title: 'Grocery list', desc: 'Categorized, tappable, estimated cost, Instacart send-off.' },
    recipe: { num: '07', title: 'Recipe detail', desc: 'Food photo placeholder, stats strip, ingredients, step-by-step method.' },
    checkin: { num: '08', title: 'Daily check-in', desc: 'Weight, energy, adherence, cravings, free-form note to Mia \u2014 adjusts the plan.' },
    settings: { num: '09', title: 'Profile & settings', desc: 'Identity card, household, plan targets, preferences, app settings.' },
  };
  const info = screenInfo[screen];

  // Frame wrapper: phone bezel when previewing in browser, fullscreen when installed as PWA
  const Frame = isStandalone
    ? ({ children }) => <div style={{ width: '100%', height: '100%', background: 'var(--cream)', overflow: 'hidden', position: 'relative' }}>{children}</div>
    : ({ children }) => <window.IOSDevice width={402} height={874}>{children}</window.IOSDevice>;

  return (
    <div className="page">
      <div className="brand">
        <div className="brand-eyebrow">Meal Plan Planner · 2026</div>
        <div className="brand-name">Mia<em>.</em></div>
        <div className="brand-tagline">A dietitian in your pocket — answers 15 questions, cooks your week.</div>
        <div className="brand-meta">
          <div><b>Output</b>iOS hi-fi prototype</div>
          <div><b>Platform</b>iPhone · 402×874</div>
          <div><b>Content</b>12 Nav Toor nutrition prompts</div>
          <div><b>Flow</b>Chat → match → refine → plan</div>
        </div>
        {tweakMode && (
          <div style={{
            marginTop: 28, padding: 16, background: '#fff',
            borderRadius: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            maxWidth: 320,
          }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
              letterSpacing: 0.1, textTransform: 'uppercase', marginBottom: 10,
            }}>Tweaks</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Accent</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.keys(ACCENTS).map(a => (
                  <button key={a} onClick={() => setTweak('accent', a)}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: ACCENTS[a]['--olive-deep'],
                      border: tweaks.accent === a ? '3px solid var(--ink)' : '1px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                    }}
                    title={a}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Jump to screen</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['chat','select','browse','refine','plan','home','grocery','recipe','checkin','settings'].map(s => (
                  <button key={s} onClick={() => {
                    if (['select','browse','refine','plan'].includes(s)) {
                      // seed minimal data if jumping straight in
                      const r = window.rankPrompts({ goal: 'lose-fat', household: 'split', kids: 'school', cooking: 'prep', activity: 'moderate', depth: 'balanced', pain: ['planning','cooking'] });
                      setRanked(r);
                      if (s === 'refine' || s === 'plan') setSelected(r[0]);
                    }
                    setScreen(s);
                  }}
                    style={{
                      padding: '6px 10px', borderRadius: 8,
                      background: screen === s ? 'var(--olive-deep)' : '#f4ecd6',
                      color: screen === s ? '#fff' : 'var(--ink-2)',
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 11,
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div data-screen-label={`${info.num} ${info.title}`}>
        <Frame>
          {screen === 'chat' && (
            <window.ChatApp onComplete={handleChatComplete} answers={answers} setAnswers={setAnswers} />
          )}
          {screen === 'select' && (
            <window.PromptSelectScreen ranked={ranked}
              onPick={handlePick}
              onBrowseAll={() => setScreen('browse')}
              onBack={() => setScreen('chat')}
              answers={answers}
            />
          )}
          {screen === 'browse' && (
            <window.BrowseAllScreen ranked={ranked}
              onPick={handlePick}
              onBack={() => setScreen('select')}
            />
          )}
          {screen === 'refine' && selected && (
            <window.RefineScreen prompt={selected} answers={answers}
              onGenerate={handleGenerate}
              onBack={() => setScreen('select')}
            />
          )}
          {screen === 'plan' && selected && (
            <window.PlanPreviewScreen prompt={selected} answers={answers} tuning={tuning}
              onRestart={handleRestart}
              onBack={() => setScreen('refine')}
              onNav={handleNav}
            />
          )}
          {screen === 'home' && (
            <window.Dashboard onNav={handleNav} />
          )}
          {screen === 'grocery' && (
            <window.GroceryScreen onBack={() => setScreen('home')} onNav={handleNav} />
          )}
          {screen === 'recipe' && (
            <window.RecipeScreen onBack={() => setScreen('home')} onNav={handleNav} />
          )}
          {screen === 'checkin' && (
            <window.CheckinScreen onBack={() => setScreen('home')} onNav={handleNav} />
          )}
          {screen === 'settings' && (
            <window.SettingsScreen onBack={() => setScreen('home')} onNav={handleNav} />
          )}
        </Frame>
      </div>

      <div className="screen-label">
        <div>{info.num}</div>
        <h4>{info.title}</h4>
        <p>{info.desc}</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
