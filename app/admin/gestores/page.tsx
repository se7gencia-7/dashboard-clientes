'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Minus,
  ExternalLink, Settings2, BarChart3,
  StickyNote, Send, RefreshCw, ChevronDown,
  Users, AlertCircle, CheckCircle2, Clock,
  Plus, ArrowUpRight,
} from 'lucide-react';

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '#0D0D0D';
const CARD   = '#181818';
const CARD2  = '#1F1F1F';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';
const ORANGE = '#F97316';
const YELLOW = '#EAB308';
const BLUE   = '#3B82F6';

// ── Clientes configurados ─────────────────────────────────────────────────────

interface ClientConfig {
  id:        string;
  name:      string;
  accountId: string;
  slug:      string;         // rota do dashboard
  goal?:     { metric: string; value: number }; // meta de CPL, ex
  tags:      string[];
}

const CLIENTS: ClientConfig[] = [
  {
    id:        'dunamis',
    name:      'Dunamis Movimente',
    accountId: '1248776741801685',
    slug:      'dunamis',
    goal:      { metric: 'CPL', value: 50 },
    tags:      ['leads', 'educação'],
  },
  {
    id:        '4ventos',
    name:      '4VENTOS2.0',
    accountId: '1050253385684120',
    slug:      '4ventos',
    goal:      { metric: 'CPL', value: 40 },
    tags:      ['leads', 'vendas'],
  },
];

const DATE_PRESETS = [
  { value: 'today',      label: 'Hoje'            },
  { value: 'last_7d',    label: 'Últimos 7 dias'  },
  { value: 'last_14d',   label: 'Últimos 14 dias' },
  { value: 'last_30d',   label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês'        },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientMetrics {
  spend:       number;
  leads:       number;
  clicks:      number;
  impressions: number;
  reach:       number;
  lpv:         number;
  cpl:         number;
  ctr:         number;
  cpm:         number;
  connectRate: number;
  activeCamps: number;
}

interface Note {
  id:        string;
  text:      string;
  author:    string;
  createdAt: string;
}

type HealthStatus = 'ok' | 'warning' | 'alert' | 'loading';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = {
  brl: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number) => `${v.toFixed(2)}%`,
  k:   (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v),
};

function getHealth(client: ClientConfig, metrics: ClientMetrics | null): HealthStatus {
  if (!metrics) return 'loading';
  if (metrics.leads === 0 && metrics.spend > 0) return 'alert';
  if (!client.goal) return 'ok';
  const ratio = metrics.cpl / client.goal.value;
  if (ratio <= 1.1) return 'ok';
  if (ratio <= 1.5) return 'warning';
  return 'alert';
}

function HealthDot({ status }: { status: HealthStatus }) {
  const cfg = {
    ok:      { color: GREEN,  icon: CheckCircle2, label: 'Saudável'   },
    warning: { color: YELLOW, icon: Clock,        label: 'Atenção'    },
    alert:   { color: RED,    icon: AlertCircle,  label: 'Crítico'    },
    loading: { color: MUTED,  icon: RefreshCw,    label: 'Carregando' },
  }[status];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} style={{ color: cfg.color }} />
      <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

function MetricChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: MUTED }}>{label}</span>
      <span className="text-sm font-bold" style={{ color: highlight ? GREEN : '#fff' }}>{value}</span>
    </div>
  );
}

// ── Notes storage (localStorage) ─────────────────────────────────────────────

function loadNotes(clientId: string): Note[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(`notes_${clientId}`) ?? '[]'); }
  catch { return []; }
}

function saveNotes(clientId: string, notes: Note[]) {
  localStorage.setItem(`notes_${clientId}`, JSON.stringify(notes));
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function GestoresHub() {
  const [activeId,   setActiveId]   = useState(CLIENTS[0].id);
  const [datePreset, setDatePreset] = useState('last_7d');
  const [showDates,  setShowDates]  = useState(false);
  const [noteText,   setNoteText]   = useState('');
  const [authorName, setAuthorName] = useState('');
  const [notes,      setNotes]      = useState<Note[]>([]);

  const [metricsMap, setMetricsMap] = useState<Record<string, ClientMetrics | null>>({});
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set(CLIENTS.map(c => c.id)));

  const client = CLIENTS.find(c => c.id === activeId)!;
  const metrics = metricsMap[activeId] ?? null;
  const health  = getHealth(client, metrics);

  // ── Fetch metrics for all clients ─────────────────────────────────────────

  const fetchClient = useCallback(async (cl: ClientConfig, preset: string) => {
    setLoadingSet(prev => new Set([...prev, cl.id]));
    try {
      const res  = await fetch(`/api/meta/insights?account_id=${cl.accountId}&level=campaign&date_preset=${preset}`);
      const data = await res.json();
      const rows = (data.insights ?? []).filter((i: any) => i.spend > 0);

      const spend       = rows.reduce((s: number, i: any) => s + i.spend, 0);
      const leads       = rows.reduce((s: number, i: any) => s + i.conversions, 0);
      const clicks      = rows.reduce((s: number, i: any) => s + i.clicks, 0);
      const impressions = rows.reduce((s: number, i: any) => s + i.impressions, 0);
      const reach       = rows.reduce((s: number, i: any) => s + i.reach, 0);
      const lpv         = rows.reduce((s: number, i: any) => s + (i.landingPageViews ?? 0), 0);

      const m: ClientMetrics = {
        spend, leads, clicks, impressions, reach, lpv,
        cpl:         leads       > 0 ? spend / leads : 0,
        ctr:         impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpm:         impressions > 0 ? (spend / impressions) * 1000 : 0,
        connectRate: clicks > 0 ? (lpv / clicks) * 100 : 0,
        activeCamps: rows.length,
      };
      setMetricsMap(prev => ({ ...prev, [cl.id]: m }));
    } catch {
      setMetricsMap(prev => ({ ...prev, [cl.id]: null }));
    } finally {
      setLoadingSet(prev => { const s = new Set(prev); s.delete(cl.id); return s; });
    }
  }, []);

  useEffect(() => {
    setMetricsMap({});
    CLIENTS.forEach(cl => fetchClient(cl, datePreset));
  }, [datePreset, fetchClient]);

  // ── Notes ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setNotes(loadNotes(activeId));
  }, [activeId]);

  function addNote() {
    if (!noteText.trim()) return;
    const n: Note = {
      id:        Date.now().toString(),
      text:      noteText.trim(),
      author:    authorName.trim() || 'Gestor',
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    const updated = [n, ...notes];
    setNotes(updated);
    saveNotes(activeId, updated);
    setNoteText('');
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(activeId, updated);
  }

  const selectedPreset = DATE_PRESETS.find(d => d.value === datePreset)?.label ?? datePreset;
  const isLoading = loadingSet.has(activeId);

  // ── Goal comparison ───────────────────────────────────────────────────────

  const goalRatio = client.goal && metrics?.cpl
    ? metrics.cpl / client.goal.value
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: BG }}>

      {/* Header */}
      <header className="sticky top-0 z-50 shrink-0" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight">Se7</span>
            <span className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: RED }} />
            <span className="text-xl font-black tracking-tight">Gência</span>
            <span className="ml-3 text-xs font-semibold px-2.5 py-1 rounded"
              style={{ backgroundColor: 'rgba(232,0,28,0.15)', color: RED }}>
              Área dos Gestores
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Date picker */}
            <div className="relative">
              <button onClick={() => setShowDates(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff' }}>
                <span>{selectedPreset}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: MUTED }} />
              </button>
              {showDates && (
                <div className="absolute right-0 top-10 z-50 rounded-lg overflow-hidden shadow-xl w-48"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                  {DATE_PRESETS.map(d => (
                    <button key={d.value} onClick={() => { setDatePreset(d.value); setShowDates(false); }}
                      className="w-full text-left px-4 py-2 text-sm transition hover:bg-white/5"
                      style={{ color: datePreset === d.value ? RED : '#fff' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/admin/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition hover:bg-white/5"
              style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
              <BarChart3 className="w-4 h-4" /> Painel Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 border-r flex flex-col" style={{ borderColor: BORDER }}>
          <div className="px-4 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: MUTED }}>Clientes</p>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-1">
            {CLIENTS.map(cl => {
              const m   = metricsMap[cl.id] ?? null;
              const h   = getHealth(cl, m);
              const active = cl.id === activeId;
              return (
                <button key={cl.id} onClick={() => setActiveId(cl.id)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(232,0,28,0.12)' : 'transparent',
                    border: active ? `1px solid rgba(232,0,28,0.3)` : '1px solid transparent',
                  }}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-white leading-tight">{cl.name}</span>
                    <HealthDot status={loadingSet.has(cl.id) ? 'loading' : h} />
                  </div>

                  {m ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: MUTED }}>Invest.</span>
                        <span className="text-white font-medium">{fmt.brl(m.spend)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: MUTED }}>Leads</span>
                        <span className="font-bold" style={{ color: GREEN }}>{fmt.num(m.leads)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: MUTED }}>CPL</span>
                        <span style={{ color: m.cpl > (cl.goal?.value ?? 999) ? RED : '#fff' }}>
                          {m.cpl > 0 ? fmt.brl(m.cpl) : '—'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-3 rounded animate-pulse" style={{ backgroundColor: BORDER, width: `${60 + i * 10}%` }} />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {cl.tags.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: CARD2, color: MUTED }}>{t}</span>
                    ))}
                  </div>
                </button>
              );
            })}

            <button className="w-full flex items-center gap-2 p-3 rounded-lg text-sm transition hover:bg-white/5"
              style={{ border: `1px dashed ${BORDER}`, color: MUTED }}>
              <Plus className="w-4 h-4" /> Novo cliente
            </button>
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-6 space-y-5">

          {/* Client header */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-white">{client.name}</h1>
                <HealthDot status={isLoading ? 'loading' : health} />
              </div>
              <p className="text-xs" style={{ color: MUTED }}>
                act_{client.accountId} · {selectedPreset}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/admin/clientes/${client.slug}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
                style={{ backgroundColor: RED }}>
                <ExternalLink className="w-4 h-4" /> Ver dashboard completo
              </Link>
              <Link href="/admin/metricas"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition hover:bg-white/5"
                style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
                <Settings2 className="w-4 h-4" /> Métricas
              </Link>
              <button onClick={() => fetchClient(client, datePreset)}
                className="p-2 rounded-lg transition hover:bg-white/5"
                style={{ border: `1px solid ${BORDER}` }}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: MUTED }} />
              </button>
            </div>
          </div>

          {/* ── Funil resumido ──────────────────────────────────────────── */}
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: CARD2, borderBottom: `1px solid ${BORDER}` }}>
              <TrendingUp className="w-4 h-4" style={{ color: RED }} />
              <span className="text-sm font-semibold text-white">Funil do período</span>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-4 lg:grid-cols-8" style={{ backgroundColor: CARD }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-4 border-r" style={{ borderColor: BORDER }}>
                    <div className="h-3 w-16 rounded animate-pulse mb-2" style={{ backgroundColor: BORDER }} />
                    <div className="h-6 w-20 rounded animate-pulse" style={{ backgroundColor: BORDER }} />
                  </div>
                ))}
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-4 lg:grid-cols-8" style={{ backgroundColor: CARD }}>
                {[
                  { label: 'Cliques',      value: fmt.k(metrics.clicks),                                      color: BLUE   },
                  { label: 'CTR',          value: fmt.pct(metrics.ctr),                                       color: BLUE   },
                  { label: 'CPM',          value: metrics.cpm > 0 ? fmt.brl(metrics.cpm) : '—',              color: '#8B5CF6' },
                  { label: 'Viz. Página',  value: fmt.k(metrics.lpv),                                         color: ORANGE },
                  { label: 'Connect Rate', value: metrics.connectRate > 0 ? fmt.pct(metrics.connectRate) : '—', color: ORANGE },
                  { label: 'Leads',        value: fmt.num(metrics.leads),                                     color: GREEN  },
                  { label: 'CPL',          value: metrics.cpl > 0 ? fmt.brl(metrics.cpl) : '—',              color: metrics.cpl > (client.goal?.value ?? 999) ? RED : GREEN },
                  { label: 'Investimento', value: fmt.brl(metrics.spend),                                     color: MUTED  },
                ].map((item, i) => (
                  <div key={i} className="p-4" style={{ borderRight: i < 7 ? `1px solid ${BORDER}` : 'none' }}>
                    <p className="text-xs mb-1 truncate" style={{ color: MUTED }}>{item.label}</p>
                    <p className="text-base font-bold truncate" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm" style={{ color: MUTED, backgroundColor: CARD }}>Sem dados no período</div>
            )}
          </div>

          {/* ── Meta vs Goal + Alcance ───────────────────────────────────── */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Goal */}
              <div className="rounded-lg p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>
                  Meta do período
                </p>
                {client.goal ? (
                  <div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-black" style={{ color: metrics.cpl > client.goal.value ? RED : GREEN }}>
                        {metrics.cpl > 0 ? fmt.brl(metrics.cpl) : '—'}
                      </span>
                      <span className="text-xs pb-1" style={{ color: MUTED }}>CPL atual</span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: MUTED }}>
                      Meta: <span className="text-white font-semibold">{fmt.brl(client.goal.value)}</span>
                    </p>
                    {goalRatio !== null && (
                      <div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(goalRatio * 100, 100)}%`,
                              backgroundColor: goalRatio <= 1 ? GREEN : goalRatio <= 1.5 ? YELLOW : RED,
                            }} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          {goalRatio <= 1
                            ? <><TrendingDown className="w-3.5 h-3.5" style={{ color: GREEN }} /><span className="text-xs" style={{ color: GREEN }}>Dentro da meta</span></>
                            : <><TrendingUp className="w-3.5 h-3.5" style={{ color: RED }} /><span className="text-xs" style={{ color: RED }}>{((goalRatio - 1) * 100).toFixed(0)}% acima da meta</span></>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: MUTED }}>Nenhuma meta configurada</p>
                )}
              </div>

              {/* Alcance + Impressões */}
              <div className="rounded-lg p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Distribuição</p>
                <div className="space-y-3">
                  <MetricChip label="Alcance"     value={fmt.num(metrics.reach)} />
                  <MetricChip label="Impressões"  value={fmt.num(metrics.impressions)} />
                  <MetricChip label="Campanhas c/ gasto" value={String(metrics.activeCamps)} />
                </div>
              </div>

              {/* Eficiência */}
              <div className="rounded-lg p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Eficiência</p>
                <div className="space-y-3">
                  <MetricChip label="Connect Rate" value={metrics.connectRate > 0 ? fmt.pct(metrics.connectRate) : '—'} highlight={metrics.connectRate > 50} />
                  <MetricChip label="CTR"          value={fmt.pct(metrics.ctr)} />
                  <MetricChip label="CPM"          value={metrics.cpm > 0 ? fmt.brl(metrics.cpm) : '—'} />
                </div>
              </div>
            </div>
          )}

          {/* ── Notas do gestor ──────────────────────────────────────────── */}
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: CARD2, borderBottom: `1px solid ${BORDER}` }}>
              <StickyNote className="w-4 h-4" style={{ color: YELLOW }} />
              <span className="text-sm font-semibold text-white">Notas internas</span>
              <span className="text-xs px-1.5 py-0.5 rounded ml-1" style={{ backgroundColor: BORDER, color: MUTED }}>
                {notes.length}
              </span>
            </div>

            {/* Compose */}
            <div className="p-4 space-y-3" style={{ backgroundColor: CARD, borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex gap-3">
                <input
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-32 shrink-0 px-3 py-2 rounded-lg text-sm text-white outline-none"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
                />
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); }}
                  placeholder="Adicionar observação sobre este cliente... (Ctrl+Enter para salvar)"
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
                />
                <button onClick={addNote}
                  disabled={!noteText.trim()}
                  className="self-end px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-40 shrink-0"
                  style={{ backgroundColor: noteText.trim() ? RED : BORDER }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notes list */}
            <div className="divide-y" style={{ borderColor: BORDER, backgroundColor: CARD }}>
              {notes.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <StickyNote className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: MUTED }} />
                  <p className="text-xs" style={{ color: MUTED }}>Nenhuma nota ainda para este cliente</p>
                </div>
              )}
              {notes.map(note => (
                <div key={note.id} className="px-5 py-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: 'rgba(232,0,28,0.2)', color: RED }}>
                          {note.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white">{note.author}</span>
                        <span className="text-xs" style={{ color: MUTED }}>{note.createdAt}</span>
                      </div>
                      <p className="text-sm text-white pl-8 leading-relaxed">{note.text}</p>
                    </div>
                    <button onClick={() => deleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded"
                      style={{ color: MUTED, border: `1px solid ${BORDER}` }}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Ações rápidas ────────────────────────────────────────────── */}
          <div className="rounded-lg p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Ações rápidas</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Dashboard completo', icon: ExternalLink, href: `/admin/clientes/${client.slug}`, color: RED },
                { label: 'Configurar métricas', icon: Settings2,   href: '/admin/metricas',                color: BLUE },
                { label: 'Gerenciar projetos',  icon: BarChart3,   href: '/admin/projetos',                color: '#8B5CF6' },
                { label: 'Painel admin',         icon: Users,       href: '/admin/dashboard',               color: GREEN },
              ].map(({ label, icon: Icon, href, color }) => (
                <Link key={label} href={href}
                  className="flex items-center gap-3 p-3 rounded-lg transition hover:bg-white/5 group"
                  style={{ border: `1px solid ${BORDER}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-xs font-medium text-white">{label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-60 transition" style={{ color: MUTED }} />
                </Link>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
