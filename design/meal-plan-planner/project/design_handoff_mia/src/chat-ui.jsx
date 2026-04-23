// chat-ui.jsx — conversational chat onboarding UI

const { useState, useEffect, useRef, useMemo } = React;

// Matching logic — ranks prompts by goal, household, depth
function rankPrompts(answers) {
  const P = window.PROMPTS;
  const scored = P.map(p => {
    let score = 0;
    // Goal match
    if (p.match.includes(answers.goal)) score += 5;
    // Household match
    if ((answers.household === 'family' || answers.household === 'split') && p.match.includes('family')) score += 3;
    if (answers.kids === 'school' || answers.kids === 'mix') { if (p.match.includes('family')) score += 2; }
    // Cooking style
    if (answers.cooking === 'prep' && p.id === 'batch-sunday') score += 4;
    if (answers.cooking === 'none' && p.id === 'precision-7day') score += 2;
    // Depth
    if (answers.depth === 'precise' && p.id === 'rp-macros') score += 4;
    if (answers.depth === 'precise' && p.tags.includes('macros')) score += 1;
    if (answers.depth === 'light' && p.complexity <= 2) score += 2;
    if (answers.depth === 'balanced' && p.complexity === 3) score += 1;
    // Pain points
    if (answers.pain?.includes('snacking') && p.id === 'noom-habits') score += 3;
    if (answers.pain?.includes('planning') && p.id === 'precision-7day') score += 2;
    if (answers.pain?.includes('cooking') && p.id === 'batch-sunday') score += 2;
    if (answers.pain?.includes('kids') && p.id === 'family-plate') score += 3;
    // Activity
    if ((answers.activity === 'very' || answers.activity === 'athletic') && p.id === 'workout-fuel') score += 3;
    // Health
    if (answers.goal === 'health' && (p.id === 'gut-health' || p.id === 'medical-adapter')) score += 3;
    // Fasting nudge
    if (answers.goal === 'lose-fat' && p.id === 'if-protocol') score += 0.5;

    return { ...p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ─── Message bubble ────────────────────────────────────────
function Bubble({ from, children, first, last }) {
  const isMia = from === 'mia';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isMia ? 'flex-start' : 'flex-end',
      marginBottom: last ? 10 : 3,
      paddingLeft: isMia ? 0 : 40,
      paddingRight: isMia ? 40 : 0,
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: 20,
        background: isMia ? '#fff' : 'var(--olive-deep)',
        color: isMia ? 'var(--ink)' : '#fff',
        fontSize: 15.5,
        lineHeight: 1.35,
        letterSpacing: -0.2,
        boxShadow: isMia
          ? '0 1px 2px rgba(31,36,25,0.05), 0 0 0 1px rgba(31,36,25,0.04)'
          : '0 1px 3px rgba(31,36,25,0.15)',
        borderBottomLeftRadius: isMia && last ? 6 : 20,
        borderBottomRightRadius: !isMia && last ? 6 : 20,
        borderTopLeftRadius: isMia && !first ? 8 : 20,
        borderTopRightRadius: !isMia && !first ? 8 : 20,
      }}>
        {children}
      </div>
    </div>
  );
}

function MiaAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'var(--olive)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--serif)', fontSize: 16, fontStyle: 'italic',
      color: '#fff', marginRight: 8, flexShrink: 0,
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    }}>m</div>
  );
}

function MiaHeader({ step, total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px 14px',
      borderBottom: '1px solid var(--divider)',
      background: 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(12px)',
    }}>
      <MiaAvatar />
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
          letterSpacing: -0.2, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Mia
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--olive)', marginLeft: 2,
          }} />
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5,
          color: 'var(--ink-3)', letterSpacing: 0.04, marginTop: 1,
        }}>
          dietitian AI · {step}/{total}
        </div>
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
        padding: '4px 8px', borderRadius: 6,
        background: 'rgba(31,36,25,0.04)',
      }}>meal-plan-01</div>
    </div>
  );
}

function ProgressStrip({ pct }) {
  return (
    <div style={{
      height: 3, background: 'rgba(31,36,25,0.06)',
      position: 'relative',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: 'var(--olive)',
        transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
}

// ─── Inputs ────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--ink-mute)',
          animation: `typing 1.2s ease-in-out ${i*0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

function QuickReply({ options, onPick }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      padding: '2px 12px 12px', justifyContent: 'flex-end',
    }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onPick(o)}
          className="qr-btn"
          style={{
            background: '#fff',
            border: '1px solid rgba(31,36,25,0.12)',
            borderRadius: 999,
            padding: '10px 14px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
            color: 'var(--olive-deep)',
            cursor: 'pointer',
            letterSpacing: -0.1,
            boxShadow: '0 1px 2px rgba(31,36,25,0.04)',
            transition: 'all 120ms ease',
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

function ChipPicker({ options, multi, max, min = 1, onSubmit }) {
  const [sel, setSel] = useState([]);
  const toggle = (id) => {
    if (id === 'none') { setSel(['none']); return; }
    let next = sel.filter(x => x !== 'none');
    if (next.includes(id)) next = next.filter(x => x !== id);
    else {
      if (max && next.length >= max) return;
      next = [...next, id];
    }
    setSel(next);
  };
  const canSubmit = sel.length >= min;
  return (
    <div style={{ padding: '2px 12px 12px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
        {options.map(o => {
          const active = sel.includes(o.id);
          return (
            <button key={o.id} onClick={() => toggle(o.id)}
              style={{
                background: active ? 'var(--olive-deep)' : '#fff',
                border: active ? '1px solid var(--olive-deep)' : '1px solid rgba(31,36,25,0.12)',
                borderRadius: 999,
                padding: '8px 13px',
                fontFamily: 'var(--sans)', fontSize: 13.5, fontWeight: 500,
                color: active ? '#fff' : 'var(--ink-2)',
                cursor: 'pointer',
                letterSpacing: -0.1,
                boxShadow: active ? 'none' : '0 1px 2px rgba(31,36,25,0.04)',
                transition: 'all 100ms ease',
              }}
            >{active && '✓ '}{o.label}</button>
          );
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 8,
      }}>
        {max && <span style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
          alignSelf: 'center',
        }}>{sel.length}/{max}</span>}
        <button onClick={() => onSubmit(sel)} disabled={!canSubmit}
          style={{
            background: canSubmit ? 'var(--olive-deep)' : 'rgba(31,36,25,0.1)',
            color: canSubmit ? '#fff' : 'var(--ink-mute)',
            border: 'none', borderRadius: 999,
            padding: '10px 18px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            letterSpacing: -0.1,
          }}
        >Send →</button>
      </div>
    </div>
  );
}

function SliderInput({ min, max, step, defaultVal, unit, marks, onSubmit }) {
  const [val, setVal] = useState(defaultVal);
  const pct = ((val - min) / (max - min)) * 100;
  return (
    <div style={{ padding: '8px 12px 14px' }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 1px 2px rgba(31,36,25,0.05), 0 0 0 1px rgba(31,36,25,0.04)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10,
        }}>
          <span style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 42, lineHeight: 1, color: 'var(--olive-deep)',
          }}>{val}</span>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 13,
            color: 'var(--ink-3)',
          }}>{unit}</span>
        </div>
        <div style={{ position: 'relative', padding: '8px 0 4px' }}>
          <div style={{
            height: 6, borderRadius: 999,
            background: 'rgba(31,36,25,0.08)', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${pct}%`, background: 'var(--olive)',
              borderRadius: 999,
            }} />
          </div>
          <input type="range" min={min} max={max} step={step} value={val}
            onChange={e => setVal(+e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%',
            }} />
          <div style={{
            position: 'absolute', left: `calc(${pct}% - 11px)`, top: 2,
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff', border: '2px solid var(--olive-deep)',
            pointerEvents: 'none',
            boxShadow: '0 2px 4px rgba(31,36,25,0.1)',
          }} />
        </div>
        {marks && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10,
            color: 'var(--ink-3)', letterSpacing: 0.04,
          }}>
            {marks.map(m => <span key={m.v}>{m.label}</span>)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={() => onSubmit(val)}
          style={{
            background: 'var(--olive-deep)', color: '#fff',
            border: 'none', borderRadius: 999,
            padding: '10px 18px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', letterSpacing: -0.1,
          }}
        >Set {val}{unit} →</button>
      </div>
    </div>
  );
}

function AgeInput({ onSubmit }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ padding: '2px 12px 12px', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', borderRadius: 999,
        padding: '4px 4px 4px 16px',
        boxShadow: '0 1px 2px rgba(31,36,25,0.05), 0 0 0 1px rgba(31,36,25,0.06)',
      }}>
        <input type="number" value={val} onChange={e => setVal(e.target.value)}
          placeholder="age" min="13" max="99"
          style={{
            border: 'none', outline: 'none', width: 60,
            fontFamily: 'var(--sans)', fontSize: 15,
            background: 'transparent', color: 'var(--ink)',
          }}
        />
        <button onClick={() => val && onSubmit(+val)}
          disabled={!val}
          style={{
            background: val ? 'var(--olive-deep)' : 'rgba(31,36,25,0.1)',
            color: val ? '#fff' : 'var(--ink-mute)',
            border: 'none', borderRadius: 999,
            padding: '8px 14px',
            fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
            cursor: val ? 'pointer' : 'not-allowed',
          }}
        >Send</button>
      </div>
    </div>
  );
}

function BodyInput({ onSubmit, onSkip }) {
  const [h, setH] = useState('5\'10"');
  const [w, setW] = useState(175);
  const [sex, setSex] = useState('male');
  return (
    <div style={{ padding: '2px 12px 12px' }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 14,
        boxShadow: '0 1px 2px rgba(31,36,25,0.05), 0 0 0 1px rgba(31,36,25,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {['male','female','other'].map(s => (
            <button key={s} onClick={() => setSex(s)} style={{
              flex: 1, padding: '8px 0',
              background: sex === s ? 'var(--olive-soft)' : 'transparent',
              border: '1px solid ' + (sex === s ? 'var(--olive)' : 'rgba(31,36,25,0.1)'),
              borderRadius: 10,
              fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
              color: sex === s ? 'var(--olive-deep)' : 'var(--ink-3)',
              cursor: 'pointer', textTransform: 'capitalize',
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
              letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 3,
            }}>Height</div>
            <input value={h} onChange={e => setH(e.target.value)}
              style={{
                width: '100%', border: '1px solid rgba(31,36,25,0.1)',
                borderRadius: 8, padding: '8px 10px', fontSize: 14,
                fontFamily: 'var(--sans)', background: '#FBF8F0',
              }}
            />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)',
              letterSpacing: 0.08, textTransform: 'uppercase', marginBottom: 3,
            }}>Weight (lb)</div>
            <input type="number" value={w} onChange={e => setW(+e.target.value)}
              style={{
                width: '100%', border: '1px solid rgba(31,36,25,0.1)',
                borderRadius: 8, padding: '8px 10px', fontSize: 14,
                fontFamily: 'var(--sans)', background: '#FBF8F0',
              }}
            />
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 6 }}>
        <button onClick={onSkip} style={{
          background: 'transparent', border: 'none',
          fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)',
          cursor: 'pointer', padding: '10px 14px',
        }}>Skip</button>
        <button onClick={() => onSubmit({ h, w, sex })} style={{
          background: 'var(--olive-deep)', color: '#fff',
          border: 'none', borderRadius: 999,
          padding: '10px 18px',
          fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
        }}>Send →</button>
      </div>
    </div>
  );
}

// ─── Main chat component ──────────────────────────────────

function ChatApp({ onComplete, answers, setAnswers }) {
  const [visible, setVisible] = useState([]); // indices of shown turns
  const [cursor, setCursor] = useState(0);
  const [typing, setTyping] = useState(false);
  const [userReplies, setUserReplies] = useState({});
  const scrollRef = useRef(null);

  const flow = window.CHAT_FLOW;

  // Count question turns for progress
  const questionTurns = useMemo(() => flow.filter(t => t.kind !== 'message' && t.kind !== 'thinking').length, []);
  const answeredCount = Object.keys(userReplies).length;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
    }
  }, [visible, typing, userReplies]);

  // Drive the flow forward
  useEffect(() => {
    if (cursor >= flow.length) return;
    const turn = flow[cursor];

    // Skip-if based on answers
    if (turn.showIf && !turn.showIf(answers)) {
      setCursor(cursor + 1);
      return;
    }

    if (turn.kind === 'message' || turn.kind === 'thinking') {
      const delay = turn.delay || 500;
      setTyping(true);
      const t1 = setTimeout(() => {
        setTyping(false);
        if (turn.kind === 'message') {
          setVisible(v => [...v, cursor]);
        }
        setCursor(cursor + 1);
      }, delay);
      return () => clearTimeout(t1);
    } else {
      // Show the question (with typing indicator briefly)
      setTyping(true);
      const t2 = setTimeout(() => {
        setTyping(false);
        setVisible(v => [...v, cursor]);
      }, 400);
      return () => clearTimeout(t2);
    }
  }, [cursor]);

  const handleAnswer = (turn, reply, value) => {
    setUserReplies(r => ({ ...r, [turn.id]: reply }));
    setAnswers(a => ({ ...a, [turn.field]: value }));
    // advance
    setTimeout(() => setCursor(c => c + 1), 350);
  };

  // Completion
  useEffect(() => {
    if (cursor >= flow.length && !typing) {
      setTimeout(() => onComplete(rankPrompts(answers)), 500);
    }
  }, [cursor, typing]);

  const renderTurn = (turn, idx) => {
    const prev = flow[idx - 1];
    const next = flow[idx + 1];
    const isFirstInGroup = !prev || prev.from !== turn.from || !visible.includes(idx - 1);
    const isLastInGroup = !next || next.from !== turn.from || !visible.includes(idx + 1);

    if (turn.kind === 'message') {
      return (
        <div key={turn.id} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: 28, marginRight: 8, flexShrink: 0 }}>
            {isLastInGroup && <MiaAvatar />}
          </div>
          <div style={{ flex: 1 }}>
            <Bubble from="mia" first={isFirstInGroup} last={isLastInGroup}>{turn.text}</Bubble>
          </div>
        </div>
      );
    }
    // Input turn — show preamble + question as bubble(s)
    return (
      <div key={turn.id}>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: 28, marginRight: 8, flexShrink: 0 }}>
            {!userReplies[turn.id] && <MiaAvatar />}
          </div>
          <div style={{ flex: 1 }}>
            {turn.preamble && <Bubble from="mia" first last={!turn.text}>{turn.preamble}</Bubble>}
            {turn.text && <Bubble from="mia" first={!turn.preamble} last>{turn.text}</Bubble>}
            {turn.hint && !userReplies[turn.id] && (
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)',
                padding: '2px 14px 6px', letterSpacing: 0.04,
              }}>{turn.hint}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Active (un-answered) input at the bottom
  const activeTurnIdx = visible[visible.length - 1];
  const activeTurn = activeTurnIdx != null ? flow[activeTurnIdx] : null;
  const activeAnswered = activeTurn ? !!userReplies[activeTurn.id] : true;
  const showInput = activeTurn && !activeAnswered && activeTurn.kind !== 'message';

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--cream)',
    }}>
      <div style={{ paddingTop: 52 }}>
        <MiaHeader step={Math.min(answeredCount + 1, questionTurns)} total={questionTurns} />
        <ProgressStrip pct={(answeredCount / questionTurns) * 100} />
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto',
        padding: '14px 12px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {/* Render visible turns + user replies */}
        {visible.map(idx => {
          const turn = flow[idx];
          const myReply = userReplies[turn.id];
          return (
            <React.Fragment key={turn.id}>
              {renderTurn(turn, idx)}
              {myReply && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
                  <Bubble from="user" first last>{myReply}</Bubble>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 4 }}>
            <div style={{ width: 28, marginRight: 8 }}><MiaAvatar /></div>
            <div style={{
              background: '#fff', borderRadius: 20,
              padding: '10px 14px',
              boxShadow: '0 1px 2px rgba(31,36,25,0.05), 0 0 0 1px rgba(31,36,25,0.04)',
            }}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{
        background: 'rgba(244,235,212,0.85)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--divider)',
        paddingBottom: 34,
      }}>
        {showInput && activeTurn.kind === 'quick-reply' && (
          <QuickReply options={activeTurn.options}
            onPick={o => handleAnswer(activeTurn, o.reply, o.id)} />
        )}
        {showInput && activeTurn.kind === 'chips' && (
          <ChipPicker options={activeTurn.options}
            multi={activeTurn.multi} max={activeTurn.max} min={activeTurn.min || 1}
            onSubmit={vals => {
              const labels = vals.map(v => activeTurn.options.find(o => o.id === v)?.label).join(', ');
              handleAnswer(activeTurn, labels || '—', vals);
            }} />
        )}
        {showInput && activeTurn.kind === 'slider' && (
          <SliderInput min={activeTurn.min} max={activeTurn.max} step={activeTurn.step}
            defaultVal={activeTurn.default} unit={activeTurn.unit} marks={activeTurn.marks}
            onSubmit={v => handleAnswer(activeTurn, `${v} ${activeTurn.unit}`, v)} />
        )}
        {showInput && activeTurn.kind === 'input-age' && (
          <AgeInput onSubmit={v => handleAnswer(activeTurn, `${v} years old`, v)} />
        )}
        {showInput && activeTurn.kind === 'body-input' && (
          <BodyInput onSubmit={v => handleAnswer(activeTurn, `${v.h} · ${v.w}lb`, v)}
            onSkip={() => handleAnswer(activeTurn, 'Skipped', null)} />
        )}
      </div>
    </div>
  );
}

window.ChatApp = ChatApp;
window.rankPrompts = rankPrompts;
