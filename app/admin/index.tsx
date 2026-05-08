// @ts-nocheck
/**
 * Mirar Admin Operations Dashboard
 * Web-only. Secret-gated.
 * Access: /admin?s=<ADMIN_SECRET>
 *
 * Sections:
 * 1. Overview strip (4 stat cards)
 * 2. 30-day activity bar chart (SVG)
 * 3. User table with expandable rows (14-day sparkline per user)
 * 4. Trial funnel + theme health (from admin-analytics)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, ActivityIndicator } from 'react-native';

// ── Only render on web ───────────────────────────────────────────────────────
if (Platform.OS !== 'web') {
  module.exports = function AdminNotAvailable() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#9494A0' }}>Admin dashboard — web only</Text>
      </View>
    );
  };
}

// ── Constants ────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const ADMIN_SECRET_ENV = process.env.EXPO_PUBLIC_ADMIN_SECRET ?? '';

const STATUS_COLORS: Record<string, string> = {
  Aligned: '#5A8A6A',
  Forming: '#B07A2A',
  Stabilizing: '#4A7CA8',
  'Under Load': '#B85A4A',
  Calibrating: '#9494A0',
};

const THEME_NAMES: Record<string, string> = {
  IAP: 'Direction',
  EWB: 'Energy & Well-being',
  FAF: 'Attention',
  RC: 'Connection',
  GAL: 'Growth & Learning',
  RA: 'Movement',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function alignmentColor(score: number | null): string {
  if (score === null) return '#C8C4BF';
  if (score < 38) return '#C47058';
  if (score < 50) return '#6B8FB5';
  if (score < 75) return '#D4A843';
  return '#5B8C5A';
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Mini Sparkline (SVG) ──────────────────────────────────────────────────────
function MiniSparkline({ history, width = 120, height = 28 }: {
  history: Array<{ date: string; score: number }>;
  width?: number;
  height?: number;
}) {
  if (!history || history.length < 2) {
    return (
      <span style={{ fontSize: 10, color: '#9494A0' }}>No data</span>
    );
  }

  const scores = history.map((h) => h.score);
  const min = Math.max(0, Math.min(...scores) - 5);
  const max = Math.min(100, Math.max(...scores) + 5);
  const range = max - min || 10;
  const padX = 4; const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pts = scores.map((s, i) => ({
    x: padX + (i / (scores.length - 1)) * innerW,
    y: padY + (1 - (s - min) / range) * innerH,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const lastPt = pts[pts.length - 1];
  const lineColor = alignmentColor(scores[scores.length - 1]);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sf-${width}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L${lastPt.x.toFixed(1)},${(padY + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(padY + innerH).toFixed(1)} Z`}
        fill={`url(#sf-${width})`}
      />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)} r="3" fill={lineColor} />
    </svg>
  );
}

// ── Activity Bar Chart ────────────────────────────────────────────────────────
function ActivityBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartW = 860;
  const chartH = 80;
  const barW = Math.floor((chartW - 40) / data.length) - 2;
  const padX = 20;

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 28}`} style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(2, (d.count / maxCount) * chartH);
        const x = padX + i * (barW + 2);
        const y = chartH - barH;
        const opacity = d.count === 0 ? 0.12 : 0.3 + (d.count / maxCount) * 0.7;

        // Show date label every 7 days
        const showLabel = i === 0 || i === data.length - 1 || i % 7 === 0;
        const label = showLabel ? formatDate(d.date) : '';

        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={barH} rx="2" fill="#5A9E8F" opacity={opacity} />
            {showLabel && (
              <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="9" fill="#9494A0">
                {label}
              </text>
            )}
            {d.count > 0 && (
              <title>{`${d.date}: ${d.count} check-in${d.count > 1 ? 's' : ''}`}</title>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Retention Bar ─────────────────────────────────────────────────────────────
function RetentionBar({ label, pct, count }: { label: string; pct: number; count: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#6B6B78', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: '#4A4A55', fontWeight: 600 }}>{pct}% <span style={{ color: '#9494A0', fontWeight: 400 }}>({count})</span></span>
      </div>
      <div style={{ background: '#EAE7E2', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ background: '#5A9E8F', height: '100%', width: `${pct}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #EAE7E2',
      borderRadius: 12,
      padding: '16px 20px',
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#4A4A55', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9494A0', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── User Row ─────────────────────────────────────────────────────────────────
function UserRow({ user }: { user: any }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = STATUS_COLORS[user.today_status] ?? '#9494A0';
  const trialColor = user.conversion_status === 'expired' ? '#B85A4A'
    : user.conversion_status === 'converted' ? '#5A8A6A'
    : '#B07A2A';

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{
          cursor: 'pointer',
          borderBottom: '1px solid #EAE7E2',
          background: expanded ? '#F7F5F2' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <td style={tdStyle}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B6B78', background: '#F0EDE8', padding: '2px 6px', borderRadius: 4 }}>
            {user.mirar_id ?? '—'}
          </span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 12, color: '#9494A0' }}>{user.email?.split('@')[0]}</span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 13, color: user.last_checkin_label ? '#4A4A55' : '#C4C4CC' }}>
            {user.last_checkin_label ?? 'Never'}
          </span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 13, color: '#4A4A55' }}>Day {user.current_cycle_day}</span>
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 13, color: user.streak_length > 0 ? '#4A4A55' : '#C4C4CC' }}>
            {user.streak_length > 0 ? `${user.streak_length} days` : '—'}
          </span>
        </td>
        <td style={tdStyle}>
          {user.today_score !== null ? (
            <span style={{ fontSize: 15, fontWeight: 600, color: alignmentColor(user.today_score) }}>
              {user.today_score}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: '#C4C4CC' }}>—</span>
          )}
        </td>
        <td style={tdStyle}>
          {user.today_status ? (
            <span style={{
              fontSize: 11,
              color: statusColor,
              background: statusColor + '18',
              padding: '2px 8px',
              borderRadius: 20,
              fontWeight: 500,
            }}>
              {user.today_status}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: '#C4C4CC' }}>—</span>
          )}
        </td>
        <td style={tdStyle}>
          <span style={{ fontSize: 11, color: trialColor, fontWeight: 500 }}>{user.trial_display}</span>
        </td>
        <td style={{ ...tdStyle, textAlign: 'right', color: '#C4C4CC', fontSize: 13 }}>
          {expanded ? '▲' : '▼'}
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: '#F7F5F2', borderBottom: '1px solid #EAE7E2' }}>
          <td colSpan={9} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* 14-day sparkline */}
              <div>
                <div style={{ fontSize: 10, color: '#9494A0', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 8 }}>
                  14-day alignment signal
                </div>
                {user.alignment_history?.length >= 2 ? (
                  <MiniSparkline history={user.alignment_history} width={200} height={40} />
                ) : (
                  <span style={{ fontSize: 12, color: '#C4C4CC' }}>Not enough data yet</span>
                )}
              </div>

              {/* Context message */}
              {user.context_message && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 10, color: '#9494A0', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 8 }}>
                    Context line
                  </div>
                  <div style={{ fontSize: 13, color: '#6B6B78', fontStyle: 'italic' }}>
                    "{user.context_message}"
                  </div>
                </div>
              )}

              {/* Latest signal */}
              {user.latest_signal_text && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 10, color: '#9494A0', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 8 }}>
                    Latest weekly signal
                  </div>
                  <div style={{ fontSize: 13, color: '#6B6B78' }}>
                    {user.latest_signal_text}
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div>
                <div style={{ fontSize: 10, color: '#9494A0', letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Stats
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 16px' }}>
                  <span style={{ fontSize: 12, color: '#9494A0' }}>Total check-ins</span>
                  <span style={{ fontSize: 12, color: '#4A4A55', fontWeight: 500 }}>{user.total_reflections}</span>
                  <span style={{ fontSize: 12, color: '#9494A0' }}>Stage</span>
                  <span style={{ fontSize: 12, color: '#4A4A55', fontWeight: 500 }}>Chapter {user.current_stage}</span>
                  <span style={{ fontSize: 12, color: '#9494A0' }}>Joined</span>
                  <span style={{ fontSize: 12, color: '#4A4A55', fontWeight: 500 }}>{formatDate(user.created_at)}</span>
                  {user.trial_ends_at && (
                    <>
                      <span style={{ fontSize: 12, color: '#9494A0' }}>Trial ends</span>
                      <span style={{ fontSize: 12, color: '#4A4A55', fontWeight: 500 }}>{formatDate(user.trial_ends_at)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 13,
  verticalAlign: 'middle',
};

// ── Theme Health Grid ─────────────────────────────────────────────────────────
function ThemeHealthGrid({ themeHealth }: { themeHealth: Record<string, any> }) {
  const themes = Object.entries(THEME_NAMES);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {themes.map(([code, name]) => {
        const h = themeHealth?.[code];
        if (!h) {
          return (
            <div key={code} style={{ background: '#F7F5F2', border: '1px solid #EAE7E2', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '0.5px', marginBottom: 4 }}>{code}</div>
              <div style={{ fontSize: 12, color: '#C4C4CC' }}>No data</div>
            </div>
          );
        }
        const total = h.count || 1;
        const alignedPct = Math.round((h.aligned / total) * 100);
        const underLoadPct = Math.round((h.under_load / total) * 100);

        return (
          <div key={code} style={{ background: '#FFFFFF', border: '1px solid #EAE7E2', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 11, color: '#9494A0', letterSpacing: '0.5px', fontWeight: 500 }}>{code}</span>
                <div style={{ fontSize: 12, color: '#6B6B78', marginTop: 1 }}>{name}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: alignmentColor(h.avg_score * 33.3) }}>
                {h.avg_score?.toFixed(1)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 10, background: '#EAF4EC', color: '#5A8A6A', padding: '1px 6px', borderRadius: 10 }}>
                {alignedPct}% aligned
              </span>
              {underLoadPct > 0 && (
                <span style={{ fontSize: 10, background: '#FAE8E5', color: '#B85A4A', padding: '1px 6px', borderRadius: 10 }}>
                  {underLoadPct}% load
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#9494A0' }}>Admin dashboard — web only</Text>
      </View>
    );
  }

  const [authed, setAuthed] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [userListData, setUserListData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Pull secret from URL param ?s=xxx or localStorage
  const [adminSecret, setAdminSecret] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('s');
    const fromStorage = localStorage.getItem('mirar_admin_auth');
    const resolved = fromUrl ?? fromStorage ?? '';
    if (resolved) {
      setAdminSecret(resolved);
      setAuthed(true);
    }
  }, []);

  const handleAuth = () => {
    if (!secretInput.trim()) return;
    localStorage.setItem('mirar_admin_auth', secretInput.trim());
    setAdminSecret(secretInput.trim());
    setAuthed(true);
    setAuthError('');
  };

  const fetchData = useCallback(async (secret: string) => {
    if (!SUPABASE_URL || !secret) return;
    setLoading(true);
    setError('');

    try {
      const [listRes, analyticsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/admin-user-list`, {
          headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        }),
        fetch(`${SUPABASE_URL}/functions/v1/admin-analytics`, {
          headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json' },
        }),
      ]);

      const listJson = await listRes.json();
      const analyticsJson = await analyticsRes.json();

      if (listJson.error === 'Unauthorized' || analyticsJson.error === 'Unauthorized') {
        setAuthed(false);
        localStorage.removeItem('mirar_admin_auth');
        setError('Invalid admin secret.');
        return;
      }

      setUserListData(listJson);
      setAnalyticsData(analyticsJson);
      setLastRefresh(new Date());
    } catch (e) {
      setError(`Failed to load: ${e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && adminSecret) {
      fetchData(adminSecret);
    }
  }, [authed, adminSecret, fetchData]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 40, width: 360, border: '1px solid #EAE7E2' }}>
          <div style={{ fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase', color: '#9494A0', marginBottom: 8 }}>
            MIRAR
          </div>
          <h2 style={{ fontSize: 20, color: '#4A4A55', margin: '0 0 6px', fontWeight: 600 }}>
            Operator Dashboard
          </h2>
          <p style={{ fontSize: 13, color: '#9494A0', margin: '0 0 24px' }}>
            Enter your admin secret to continue.
          </p>
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            placeholder="Admin secret"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #EAE7E2',
              fontSize: 14,
              background: '#F7F5F2',
              color: '#4A4A55',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
          {authError && <p style={{ fontSize: 12, color: '#B85A4A', margin: '0 0 12px' }}>{authError}</p>}
          <button
            onClick={handleAuth}
            style={{
              width: '100%',
              padding: '11px 0',
              background: '#4A4A55',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && !userListData) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#9494A0', letterSpacing: '1px' }}>Loading operator data…</div>
        </div>
      </div>
    );
  }

  if (error && !userListData) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 32, maxWidth: 400 }}>
          <div style={{ fontSize: 13, color: '#B85A4A' }}>{error}</div>
          <button onClick={() => fetchData(adminSecret)} style={{ marginTop: 16, padding: '8px 16px', background: '#4A4A55', color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = userListData?.summary ?? {};
  const users = userListData?.users ?? [];
  const activityChart = userListData?.activity_chart ?? [];
  const retention = analyticsData?.retention ?? {};
  const themeHealth = analyticsData?.theme_health_90d ?? {};
  const trialFunnel = analyticsData?.trial_funnel ?? {};

  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EAE7E2', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: '#9494A0', marginRight: 16 }}>MIRAR</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#4A4A55' }}>Operator Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: '#9494A0' }}>
              Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchData(adminSecret)}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: loading ? '#EAE7E2' : '#4A4A55',
              color: loading ? '#9494A0' : '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              cursor: loading ? 'default' : 'pointer',
              fontWeight: 500,
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => { localStorage.removeItem('mirar_admin_auth'); setAuthed(false); setAdminSecret(''); setUserListData(null); setAnalyticsData(null); }}
            style={{ padding: '6px 14px', background: 'transparent', color: '#9494A0', border: '1px solid #EAE7E2', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Section 1: Overview strip ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <StatCard label="Total Users" value={summary.total_users ?? '—'} />
          <StatCard
            label="Active Today"
            value={summary.active_today ?? 0}
            sub={summary.total_users ? `${Math.round(((summary.active_today ?? 0) / summary.total_users) * 100)}% of users` : undefined}
          />
          <StatCard
            label="Day 7 Retention"
            value={`${summary.day7_retention_pct ?? 0}%`}
            sub={`${retention.day7?.count ?? 0} users reached 7 check-ins`}
          />
          <StatCard
            label="Avg Score Today"
            value={summary.avg_score_today !== null && summary.avg_score_today !== undefined ? summary.avg_score_today : '—'}
            sub="Alignment signal (0–100)"
          />
        </div>

        {/* ── Section 2: Activity chart ───────────────────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #EAE7E2', borderRadius: 16, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Check-in Activity</div>
              <div style={{ fontSize: 14, color: '#6B6B78' }}>Users who checked in each day · last 30 days</div>
            </div>
          </div>
          {activityChart.length > 0 ? (
            <ActivityBarChart data={activityChart} />
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: '#C4C4CC', fontSize: 13 }}>No activity data yet</div>
          )}
        </div>

        {/* ── Section 3: User table ───────────────────────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #EAE7E2', borderRadius: 16, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #EAE7E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Users</div>
              <div style={{ fontSize: 14, color: '#6B6B78' }}>{users.length} registered · click any row to expand</div>
            </div>
          </div>

          {users.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#C4C4CC', fontSize: 13 }}>No users yet</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #EAE7E2' }}>
                    {['Mirar ID', 'Email', 'Last Check-in', 'Day', 'Streak', 'Score', 'Status', 'Trial', ''].map((h) => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, color: '#9494A0', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <UserRow key={user.id} user={user} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Section 4: Retention + Theme Health ────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Retention funnel */}
          <div style={{ background: '#FFFFFF', border: '1px solid #EAE7E2', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Retention Funnel</div>
            <RetentionBar label="Day 3" pct={retention.day3?.pct ?? 0} count={retention.day3?.count ?? 0} />
            <RetentionBar label="Day 7" pct={retention.day7?.pct ?? 0} count={retention.day7?.count ?? 0} />
            <RetentionBar label="Day 14" pct={retention.day14?.pct ?? 0} count={retention.day14?.count ?? 0} />
            <RetentionBar label="Day 28" pct={retention.day28?.pct ?? 0} count={retention.day28?.count ?? 0} />

            <div style={{ borderTop: '1px solid #EAE7E2', marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Trial Funnel</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  { label: 'Active trial', value: trialFunnel.active_trial ?? 0, color: '#B07A2A' },
                  { label: 'Converted', value: trialFunnel.converted ?? 0, color: '#5A8A6A' },
                  { label: 'Expired', value: trialFunnel.expired ?? 0, color: '#B85A4A' },
                  { label: 'Conv. rate', value: `${trialFunnel.conversion_pct ?? 0}%`, color: '#5A8A6A' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#F7F5F2', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: '#9494A0', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Theme health */}
          <div style={{ background: '#FFFFFF', border: '1px solid #EAE7E2', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, color: '#9494A0', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>
              Theme Health · 90 days
            </div>
            <ThemeHealthGrid themeHealth={themeHealth} />
          </div>
        </div>

        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}
