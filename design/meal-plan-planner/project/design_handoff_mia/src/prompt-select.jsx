// prompt-select.jsx — recommendation + browse screens

const { useState: useStateS } = React;

function PromptIcon({ id, size = 44 }) {
  // Simple colored glyphs per prompt — minimal food-y shapes
  const map = {
    'mayo-blueprint':    { bg: 'var(--olive-soft)',    fg: 'var(--olive-deep)',  glyph: '◐' },
    'precision-7day':    { bg: 'var(--tomato-soft)',   fg: 'var(--tomato)',      glyph: '⏽' },
    'rp-macros':         { bg: '#EDE4D1',              fg: 'var(--ink)',         glyph: '%' },
    'batch-sunday':      { bg: 'var(--tangerine-soft)', fg: 'var(--tangerine)',  glyph: '◇' },
    'gut-health':        { bg: '#E8EBDB',              fg: 'var(--olive)',       glyph: '✿' },
    'family-plate':      { bg: '#F6E4D3',              fg: '#C87A3C',            glyph: '◉' },
    'noom-habits':       { bg: '#E6DDF0',              fg: 'var(--plum)',        glyph: '∞' },
    'workout-fuel':      { bg: '#FDE5C9',              fg: '#C65A1A',            glyph: '⚡' },
    'if-protocol':       { bg: '#E2E6D3',              fg: 'var(--olive-deep)',  glyph: '◷' },
    'medical-adapter':   { bg: '#F4D8D3',              fg: 'var(--tomato)',      glyph: '+' },
    'mayo-30day':        { bg: '#E3D9C2',              fg: 'var(--ink)',         glyph: '30' },
  };
  const s = map[id] || { bg: '#eee', fg: '#333', glyph: '◐' };
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: s.bg, color: s.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--serif)', fontStyle: 'italic',
      fontSize: size * 0.55, flexShrink: 0,
      letterSpacing: -0.02,
    }}>{s.glyph}</div>
  );
}

function MatchBar({ score, max }) {
  const pct = Math.min(100, (score / max) * 100);
  return (
    <div style={{
      width: 44, height: 4, borderRadius: 999,
      background: 'rgba(31,36,25,0.08)', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: 'var(--olive)',
      }} />
    </div>
  );
}

function HeroCard({ prompt, onPick, maxScore }) {
  return (
    <div onClick={() => onPick(prompt)}
      style={{
        background: '#fff',
        borderRadius: 24,
        padding: 20,
        boxShadow: '0 2px 4px rgba(31,36,25,0.04), 0 10px 30px rgba(31,36,25,0.08), 0 0 0 1px rgba(31,36,25,0.03)',
        cursor: 'pointer',
        position: 'relative',
      }}>
      {/* Match badge */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--olive-soft)',
        padding: '4px 10px', borderRadius: 999,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--olive)' }} />
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 500,
          color: 'var(--olive-deep)', letterSpacing: 0.04,
        }}>BEST MATCH</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, marginTop: 20 }}>
        <PromptIcon id={prompt.id} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
            letterSpacing: 0.08, textTransform: 'uppercase',
          }}>Prompt #{prompt.num} · {prompt.persona}</div>
          <h3 style={{
            fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400,
            margin: '2px 0 0', letterSpacing: -0.01, lineHeight: 1.1,
            color: 'var(--ink)',
          }}>{prompt.title}</h3>
        </div>
      </div>

      <p style={{
        fontFamily: 'var(--sans)', fontSize: 14.5, lineHeight: 1.45,
        color: 'var(--ink-2)', margin: '0 0 14px',
      }}>{prompt.tagline}</p>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14,
      }}>
        {prompt.outputs.slice(0, 4).map(o => (
          <div key={o} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 10px', background: 'var(--cream-2)',
            borderRadius: 8,
            fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500,
            color: 'var(--ink-2)', letterSpacing: -0.1,
          }}>
            <div style={{
              width: 4, height: 4, borderRadius: '50%', background: 'var(--olive)',
            }} />
            {o}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: '1px solid var(--divider)',
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
            letterSpacing: 0.04,
          }}>FIT</span>
          <MatchBar score={prompt.score} max={maxScore} />
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--olive-deep)', fontWeight: 500,
          }}>{Math.round((prompt.score / maxScore) * 100)}%</span>
        </div>
        <div style={{
          background: 'var(--olive-deep)', color: '#fff',
          padding: '8px 14px', borderRadius: 999,
          fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
        }}>Use this →</div>
      </div>
    </div>
  );
}

function RunnerUp({ prompt, onPick, maxScore }) {
  return (
    <div onClick={() => onPick(prompt)}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(31,36,25,0.04), 0 0 0 1px rgba(31,36,25,0.04)',
      }}>
      <PromptIcon id={prompt.id} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)',
          letterSpacing: 0.08, textTransform: 'uppercase',
        }}>#{prompt.num}</div>
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400,
          color: 'var(--ink)', letterSpacing: -0.01, lineHeight: 1.1,
          marginTop: 1,
        }}>{prompt.title}</div>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 12.5, color: 'var(--ink-3)',
          marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{prompt.tagline}</div>
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
        color: 'var(--olive-deep)', flexShrink: 0,
      }}>{Math.round((prompt.score / maxScore) * 100)}%</div>
    </div>
  );
}

function PromptSelectScreen({ ranked, onPick, onBrowseAll, answers, onBack }) {
  const best = ranked[0];
  const runners = ranked.slice(1, 4);
  const maxScore = best.score || 1;
  return (
    <div style={{
      height: '100%', overflow: 'auto',
      background: 'var(--cream)',
    }}>
      {/* Header */}
      <div style={{
        padding: '62px 16px 18px',
        position: 'sticky', top: 0, zIndex: 2,
        background: 'linear-gradient(to bottom, var(--cream) 82%, transparent)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
        }}>
          <button onClick={onBack} style={{
            background: '#fff', border: 'none',
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(31,36,25,0.06), 0 0 0 1px rgba(31,36,25,0.05)',
            cursor: 'pointer',
          }}>
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke="var(--ink-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5,
            color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase',
          }}>Step 2 of 3</div>
        </div>
        <h1 style={{
          fontFamily: 'var(--serif)', fontSize: 38, fontWeight: 400,
          lineHeight: 1, letterSpacing: -0.02, margin: 0, color: 'var(--ink)',
        }}>Your <em style={{ color: 'var(--olive-deep)' }}>best-fit</em> plans</h1>
        <p style={{
          fontFamily: 'var(--sans)', fontSize: 14.5, color: 'var(--ink-2)',
          margin: '8px 0 0', letterSpacing: -0.1,
        }}>Based on your answers — ranked by fit for your <span style={{
          fontFamily: 'var(--script)', fontSize: 17, color: 'var(--olive-deep)',
        }}>actual</span> week.</p>
      </div>

      <div style={{ padding: '4px 16px 120px' }}>
        <HeroCard prompt={best} onPick={onPick} maxScore={maxScore} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          margin: '24px 0 10px',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10.5,
            color: 'var(--ink-3)', letterSpacing: 0.08, textTransform: 'uppercase',
          }}>Also worth a look</span>
          <div style={{ flex: 1, height: 1, background: 'var(--divider)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {runners.map(p => <RunnerUp key={p.id} prompt={p} onPick={onPick} maxScore={maxScore} />)}
        </div>

        <button onClick={onBrowseAll} style={{
          width: '100%', marginTop: 16,
          background: 'transparent',
          border: '1px dashed rgba(31,36,25,0.2)',
          borderRadius: 18, padding: '16px',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
          color: 'var(--ink-2)', cursor: 'pointer', letterSpacing: -0.1,
        }}>
          Browse all 11 prompts →
        </button>

        {/* Why these */}
        <div style={{
          marginTop: 24, padding: 16,
          background: 'rgba(255,255,255,0.5)', borderRadius: 18,
          border: '1px solid var(--divider)',
        }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
            letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 8,
          }}>Why these?</div>
          <div style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16,
            color: 'var(--ink)', lineHeight: 1.4, letterSpacing: -0.01,
          }}>
            "You mentioned <b style={{
              fontStyle: 'normal', fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 14,
              background: 'var(--tangerine-soft)', padding: '1px 6px', borderRadius: 4,
            }}>Sunday prep</b> and splitting the week between solo nights and kids — I pushed batch cooking and family-friendly plans to the top."
          </div>
        </div>
      </div>
    </div>
  );
}

function BrowseAllScreen({ ranked, onPick, onBack }) {
  const maxScore = ranked[0]?.score || 1;
  return (
    <div style={{
      height: '100%', overflow: 'auto',
      background: 'var(--cream)',
    }}>
      <div style={{
        padding: '62px 16px 16px',
        position: 'sticky', top: 0, zIndex: 2,
        background: 'linear-gradient(to bottom, var(--cream) 85%, transparent)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        }}>
          <button onClick={onBack} style={{
            background: '#fff', border: 'none',
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(31,36,25,0.06), 0 0 0 1px rgba(31,36,25,0.05)',
            cursor: 'pointer',
          }}>
            <svg width="10" height="16" viewBox="0 0 10 16">
              <path d="M8 2L2 8l6 6" stroke="var(--ink-2)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={{
            fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400,
            margin: 0, letterSpacing: -0.01, color: 'var(--ink)',
          }}>All prompts</h1>
        </div>
      </div>
      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ranked.map(p => <RunnerUp key={p.id} prompt={p} onPick={onPick} maxScore={maxScore} />)}
      </div>
    </div>
  );
}

window.PromptSelectScreen = PromptSelectScreen;
window.BrowseAllScreen = BrowseAllScreen;
window.PromptIcon = PromptIcon;
