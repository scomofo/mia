'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('MiaApp error boundary:', err, info); }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="mia-root" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', gap: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--tomato-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--tomato)',
        }}>!</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 22, margin: 0, fontStyle: 'italic' }}>Something broke.</h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink-3)', margin: 0, maxWidth: 280 }}>
          {this.state.err?.message?.slice(0, 140) ?? 'Unknown error'}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={() => location.reload()} style={{
            background: 'var(--olive-deep)', color: '#fff', border: 'none',
            borderRadius: 999, padding: '10px 18px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Reload</button>
          <button onClick={() => this.setState({ err: null })} style={{
            background: '#fff', color: 'var(--ink-2)', border: '1px solid var(--divider)',
            borderRadius: 999, padding: '10px 18px',
            fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>Retry</button>
        </div>
      </div>
    );
  }
}
