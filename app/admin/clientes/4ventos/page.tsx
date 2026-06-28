'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download, Settings2, ChevronDown, Calendar, Filter, RefreshCw } from 'lucide-react';

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';
const ORANGE = '#F97316';

// ── Projetos da conta 4VENTOS2.0 ──────────────────────────────────────────────
const PROJECTS = [
  { id: 'dunamis',     name: 'Dunamis Club',  type: 'leads',  patterns: ['DUNAMISCLUB','DNSMCLUB','DNSMXCLUB'] },
  { id: 'aniversario', name: 'Aniversário',   type: 'leads',  patterns: ['ANIVERSÁRIO','ANIVERSARIO'] },
  { id: 'editora',     name: 'Site Editora',  type: 'vendas', patterns: ['SITE EDITORA'] },
  { id: 'orei',        name: 'Orei Por Você', type: 'leads',  patterns: ['OREI POR VOCÊ','OREI POR VOCE'] },
];

const DATE_PRESETS = [
  { value: 'today',       label: 'Hoje' },
  { value: 'yesterday',   label: 'Ontem' },
  { value: 'last_7d',     label: 'Últimos 7 dias' },
  { value: 'last_14d',    label: 'Últimos 14 dias' },
  { value: 'last_30d',    label: 'Últimos 30 dias' },
  { value: 'this_month',  label: 'Este mês' },
  { value: 'last_month',  label: 'Mês passado' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matchProject(campaignName: string, patterns: string[]): boolean {
  const upper = campaignName.toUpperCase();
  return patterns.some(p => upper.includes(p.toUpperCase()));
}

const fmt = {
  brl:  (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }),
  num:  (v: number) => v.toLocaleString('pt-BR'),
  pct:  (v: number) => `${v.toFixed(2)}%`,
};

function InvBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-xs tabular-nums whitespace-nowrap">{fmt.brl(value)}</span>
      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: RED }} />
      </div>
    </div>
  );
}

function ConvCell({ v }: { v: number }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${v > 0 ? 'text-green-400' : 'text-white'}`}
      style={v > 0 ? { backgroundColor: 'rgba(34,197,94,0.15)' } : {}}>
      {fmt.num(v)}
    </span>
  );
}

function cleanName(name: string) {
  return name.replace(/\[|\]/g, '').replace(/\s+/g, ' ').trim();
}

function statusBadge(status: string) {
  const active = status === 'ACTIVE';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={active
        ? { background: 'rgba(34,197,94,0.15)', color: GREEN }
        : { background: BORDER, color: MUTED }}>
      {active ? 'Ativa' : 'Pausada'}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface InsightRow {
  campaignId?: string;
  campaignName?: string;
  adsetId?: string;
  adsetName?: string;
  adId?: string;
  adName?: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpc: number;
  cpm: number;
  ctr: number;
  conversions: number;
  purchases: number;
  dateStart: string;
  dateStop: string;
}


interface Campaign { id: string; name: string; status: string; objective: string }

// ── Main component ────────────────────────────────────────────────────────────

export default function Ventos4Dashboard() {
  const [projId,    setProjId]    = useState('dunamis');
  const [section,   setSection]   = useState('campanhas');
  const [datePreset,setDatePreset]= useState('last_30d');
  const [showDates, setShowDates] = useState(false);

  // data
  const [campaigns,  setCampaigns]  = useState<Campaign[]>([]);
  const [campInsights, setCampInsights] = useState<InsightRow[]>([]);
  const [adsetInsights,setAdsetInsights]= useState<InsightRow[]>([]);
  const [adInsights,   setAdInsights]   = useState<InsightRow[]>([]);
  const [dailyInsights,setDailyInsights]= useState<InsightRow[]>([]);

  const [loading,    setLoading]    = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [error,      setError]      = useState('');

  const project = PROJECTS.find(p => p.id === projId)!;

  // Campaign IDs for the selected project
  const projectCampaignIds = campaigns
    .filter(c => matchProject(c.name, project.patterns))
    .map(c => c.id);

  // ── Fetch campaigns + campaign insights ───────────────────────────────────

  const loadBase = useCallback(async (preset: string) => {
    setLoading(true);
    setError('');
    try {
      const [campRes, insRes] = await Promise.all([
        fetch('/api/meta/campaigns').then(r => r.json()),
        fetch(`/api/meta/insights?level=campaign&date_preset=${preset}`).then(r => r.json()),
      ]);
      setCampaigns(campRes.campaigns ?? []);
      setCampInsights(insRes.insights ?? []);
      // Daily breakdown for the chart
      const dailyRes = await fetch(`/api/meta/insights?level=campaign&date_preset=${preset}&time_increment=1`).then(r => r.json());
      setDailyInsights(dailyRes.insights ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBase(datePreset); }, [datePreset, loadBase]);

  // ── Fetch adsets when tab changes ─────────────────────────────────────────

  useEffect(() => {
    if (section !== 'conjuntos' || projectCampaignIds.length === 0) return;
    setSubLoading(true);
    const ids = projectCampaignIds.join(',');
    Promise.all([
      fetch(`/api/meta/adsets?campaign_ids=${ids}`).then(r => r.json()),
      fetch(`/api/meta/insights?level=adset&date_preset=${datePreset}&campaign_ids=${ids}`).then(r => r.json()),
    ]).then(([, insRes]) => {
      setAdsetInsights(insRes.insights ?? []);
    }).catch(e => setError(e.message)).finally(() => setSubLoading(false));
  }, [section, projId, projectCampaignIds.join(','), datePreset]);

  // ── Fetch ad-level insights ───────────────────────────────────────────────

  useEffect(() => {
    if ((section !== 'anuncios' && section !== 'criativos') || projectCampaignIds.length === 0) return;
    setSubLoading(true);
    const ids = projectCampaignIds.join(',');
    fetch(`/api/meta/insights?level=ad&date_preset=${datePreset}&campaign_ids=${ids}`)
      .then(r => r.json())
      .then(res => setAdInsights(res.insights ?? []))
      .catch(e => setError(e.message))
      .finally(() => setSubLoading(false));
  }, [section, projId, projectCampaignIds.join(','), datePreset]);

  // ── Filter helpers ────────────────────────────────────────────────────────

  const projCampInsights = campInsights
    .filter(i => i.campaignId && projectCampaignIds.includes(i.campaignId))
    .filter(i => i.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const projAdsetInsights = adsetInsights
    .filter(i => i.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const projAdInsights = adInsights
    .filter(i => i.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const projTotals = projCampInsights.reduce(
    (acc, i) => ({
      impressions: acc.impressions + i.impressions,
      reach:       acc.reach       + i.reach,
      clicks:      acc.clicks      + i.clicks,
      spend:       acc.spend       + i.spend,
      conversions: acc.conversions + i.conversions,
      purchases:   acc.purchases   + i.purchases,
    }),
    { impressions: 0, reach: 0, clicks: 0, spend: 0, conversions: 0, purchases: 0 }
  );

  const cpl = projTotals.conversions > 0 ? projTotals.spend / projTotals.conversions : 0;
  const ctr = projTotals.impressions > 0 ? (projTotals.clicks / projTotals.impressions) * 100 : 0;
  const cpc = projTotals.clicks > 0 ? projTotals.spend / projTotals.clicks : 0;
  const maxSpend = projCampInsights[0]?.spend ?? 1;

  // ── Daily chart data ──────────────────────────────────────────────────────

  const dailyMap = new Map<string, { spend: number; conversions: number; clicks: number; reach: number }>();
  dailyInsights
    .filter(i => i.campaignId && projectCampaignIds.includes(i.campaignId))
    .forEach(i => {
      const key = i.dateStart;
      const cur = dailyMap.get(key) ?? { spend: 0, conversions: 0, clicks: 0, reach: 0 };
      dailyMap.set(key, {
        spend:       cur.spend       + i.spend,
        conversions: cur.conversions + i.conversions,
        clicks:      cur.clicks      + i.clicks,
        reach:       cur.reach       + i.reach,
      });
    });
  const chartData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date: date.slice(5), // MM-DD
      invest: d.spend,
      leads: d.conversions,
      cliques: d.clicks,
      alcance: d.reach,
    }));

  // ── Daily table ───────────────────────────────────────────────────────────

  const dailyRows = Array.from(dailyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, d]) => ({ date, ...d }));
  const maxDailySpend = Math.max(...dailyRows.map(r => r.spend), 1);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const isLeads = project.type === 'leads';

  const kpis = isLeads
    ? [
        { label: 'Investimento', value: fmt.brl(projTotals.spend),       bar: 1,       color: MUTED   },
        { label: 'Leads',        value: fmt.num(projTotals.conversions),  bar: 0.98,    color: ORANGE  },
        { label: 'CPL',          value: cpl > 0 ? fmt.brl(cpl) : '—',   bar: 0.80,    color: GREEN   },
        { label: 'Alcance',      value: fmt.num(projTotals.reach),        bar: 0.70,    color: '#3B82F6'},
        { label: 'Impressões',   value: fmt.num(projTotals.impressions),  bar: 0.65,    color: '#8B5CF6'},
        { label: 'Cliques',      value: fmt.num(projTotals.clicks),       bar: 0.60,    color: ORANGE  },
        { label: 'CTR',          value: fmt.pct(ctr),                     bar: ctr/10,  color: GREEN   },
        { label: 'CPC Médio',    value: cpc > 0 ? fmt.brl(cpc) : '—',   bar: 0.55,    color: GREEN   },
      ]
    : [
        { label: 'Investimento', value: fmt.brl(projTotals.spend),       bar: 1,       color: MUTED   },
        { label: 'Compras',      value: fmt.num(projTotals.purchases),    bar: 0.63,    color: ORANGE  },
        { label: 'Faturamento',  value: '—',                              bar: 0.45,    color: ORANGE  },
        { label: 'ROAS',         value: '—',                              bar: 0.30,    color: ORANGE  },
        { label: 'Alcance',      value: fmt.num(projTotals.reach),        bar: 0.70,    color: '#3B82F6'},
        { label: 'Cliques',      value: fmt.num(projTotals.clicks),       bar: 0.60,    color: ORANGE  },
        { label: 'CTR',          value: fmt.pct(ctr),                     bar: ctr/10,  color: GREEN   },
        { label: 'CPC Médio',    value: cpc > 0 ? fmt.brl(cpc) : '—',   bar: 0.55,    color: GREEN   },
      ];

  const SECTIONS = [
    { id: 'campanhas',   label: 'Campanhas'  },
    { id: 'conjuntos',   label: 'Conjuntos'  },
    { id: 'anuncios',    label: 'Anúncios'   },
    { id: 'criativos',   label: 'Criativos'  },
    { id: 'publicos',    label: 'Públicos'   },
    { id: 'demografico', label: 'Demográfico'},
  ];

  const ttStyle = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11, color: '#fff' };

  const selectedPreset = DATE_PRESETS.find(d => d.value === datePreset)?.label ?? datePreset;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4 justify-between flex-wrap">

          {/* Logo */}
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-2xl font-black tracking-tight">Se7</span>
            <span className="w-2.5 h-2.5 rounded-full mb-4 mx-0.5" style={{ backgroundColor: RED }} />
            <span className="text-2xl font-black tracking-tight">Gência</span>
          </div>

          {/* Project tabs */}
          <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${BORDER}` }}>
            {PROJECTS.map(p => (
              <button key={p.id}
                onClick={() => { setProjId(p.id); setSection('campanhas'); }}
                className="px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: projId === p.id ? RED : 'transparent',
                  color: projId === p.id ? '#fff' : MUTED,
                }}>
                {p.name}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Date picker */}
            <div className="relative">
              <button
                onClick={() => setShowDates(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff' }}>
                <Calendar className="w-4 h-4" style={{ color: MUTED }} />
                <span>{selectedPreset}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: MUTED }} />
              </button>
              {showDates && (
                <div className="absolute right-0 top-10 z-50 rounded-lg overflow-hidden shadow-xl w-48"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                  {DATE_PRESETS.map(d => (
                    <button key={d.value}
                      onClick={() => { setDatePreset(d.value); setShowDates(false); }}
                      className="w-full text-left px-4 py-2 text-sm transition hover:bg-white/5"
                      style={{ color: datePreset === d.value ? RED : '#fff' }}>
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => loadBase(datePreset)}
              className="p-2 rounded-lg transition hover:bg-white/5"
              style={{ border: `1px solid ${BORDER}` }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: MUTED }} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: RED }}>
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>

            <button className="p-2 rounded-lg" style={{ border: `1px solid ${BORDER}` }}>
              <Settings2 className="w-4 h-4" style={{ color: MUTED }} />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex" style={{ borderTop: `1px solid ${BORDER}` }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="px-5 py-3 text-sm font-medium border-b-2 transition"
              style={{
                borderColor: section === s.id ? RED : 'transparent',
                color: section === s.id ? RED : MUTED,
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: '#E8001C18', color: RED, border: `1px solid ${RED}40` }}>
            {error}
          </div>
        )}

        {/* ── KPI ROW ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-px rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse" style={{ backgroundColor: CARD }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-8 rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {kpis.map((kpi, i) => (
              <div key={i} className="p-4" style={{
                backgroundColor: CARD,
                borderRight: i < kpis.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <p className="text-xs mb-1 truncate" style={{ color: MUTED }}>{kpi.label}</p>
                <p className="text-lg font-bold text-white truncate">{kpi.value}</p>
                <div className="h-1 rounded-full mt-3" style={{ backgroundColor: BORDER }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(kpi.bar * 100, 100)}%`, backgroundColor: kpi.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CAMPANHAS ─────────────────────────────────────────────────────── */}
        {section === 'campanhas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Line chart */}
            <div className="rounded-lg p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-4 mb-1 flex-wrap">
                {[{key:'leads',label:isLeads?'Leads':'Compras',color:'#fff'},{key:'invest',label:'Investimento',color:ORANGE}].map(l => (
                  <div key={l.key} className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                    <span className="w-6 h-px inline-block" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
              <h3 className="text-white text-sm font-semibold mb-4">
                {isLeads ? 'Leads × Investimento por dia' : 'Compras × Investimento por dia'}
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} />
                    <YAxis tick={{ fontSize: 10, fill: MUTED }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Line type="monotone" dataKey="leads"  stroke="#fff"   strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="invest" stroke={ORANGE} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-sm" style={{ color: MUTED }}>
                  {loading ? 'Carregando...' : 'Sem dados no período'}
                </div>
              )}
            </div>

            {/* Daily table */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">Relatório por dia</h3>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 320 }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0" style={{ backgroundColor: '#1F1F1F' }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Data','Investimento','Leads','Cliques','Alcance'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-xs" style={{ color: MUTED }}>Sem dados</td></tr>
                    )}
                    {dailyRows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3" style={{ color: MUTED }}>{row.date}</td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxDailySpend} /></td>
                        <td className="px-4 py-3"><ConvCell v={row.conversions} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.reach)}</td>
                      </tr>
                    ))}
                    {dailyRows.length > 0 && (
                      <tr style={{ backgroundColor: '#1F1F1F' }}>
                        <td className="px-4 py-3 font-bold text-white">Total</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.brl(projTotals.spend)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{fmt.num(projTotals.conversions)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(projTotals.clicks)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(projTotals.reach)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campaigns table */}
            <div className="lg:col-span-2 rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">
                  Campanhas
                  <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>({projCampInsights.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead style={{ backgroundColor: '#1F1F1F' }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Campanha','Status','Investimento','Alcance','Cliques','CTR','CPM','Leads','CPL'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projCampInsights.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                        {loading ? 'Carregando...' : 'Nenhuma campanha com gasto no período'}
                      </td></tr>
                    )}
                    {projCampInsights.map((row, i) => {
                      const cpl = row.conversions > 0 ? row.spend / row.conversions : 0;
                      const campObj = campaigns.find(c => c.id === row.campaignId);
                      return (
                        <tr key={i} className="hover:bg-white/5 transition"
                          style={{ borderBottom: i < projCampInsights.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-white font-medium text-xs truncate" title={row.campaignName}>
                              {cleanName(row.campaignName ?? '')}
                            </p>
                          </td>
                          <td className="px-4 py-3">{statusBadge(campObj?.status ?? 'PAUSED')}</td>
                          <td className="px-4 py-3"><InvBar value={row.spend} max={maxSpend} /></td>
                          <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.reach)}</td>
                          <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.brl(row.cpm)}</td>
                          <td className="px-4 py-3"><ConvCell v={row.conversions} /></td>
                          <td className="px-4 py-3" style={{ color: cpl > 0 ? GREEN : MUTED }}>
                            {cpl > 0 ? fmt.brl(cpl) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {projCampInsights.length > 0 && (
                      <tr style={{ backgroundColor: '#1F1F1F' }}>
                        <td className="px-4 py-3 font-bold text-white" colSpan={2}>Total geral</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.brl(projTotals.spend)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(projTotals.reach)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(projTotals.clicks)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.pct(ctr)}</td>
                        <td className="px-4 py-3" style={{ color: MUTED }}>—</td>
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{fmt.num(projTotals.conversions)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{cpl > 0 ? fmt.brl(cpl) : '—'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CONJUNTOS ─────────────────────────────────────────────────────── */}
        {section === 'conjuntos' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">
                Conjuntos de Anúncios
                <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>({projAdsetInsights.length})</span>
              </h3>
              {subLoading && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: MUTED }} />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Conjunto','Campanha','Investimento','Alcance','Cliques','CTR','CPM','Leads','CPL'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdsetInsights.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando conjuntos...' : 'Nenhum conjunto com gasto no período'}
                    </td></tr>
                  )}
                  {projAdsetInsights.map((row, i) => {
                    const cpl = row.conversions > 0 ? row.spend / row.conversions : 0;
                    const maxS = projAdsetInsights[0]?.spend ?? 1;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition"
                        style={{ borderBottom: i < projAdsetInsights.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-white font-medium text-xs truncate" title={row.adsetName}>{cleanName(row.adsetName ?? '')}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate text-xs" style={{ color: MUTED }} title={row.campaignName}>{cleanName(row.campaignName ?? '')}</p>
                        </td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxS} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.reach)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.brl(row.cpm)}</td>
                        <td className="px-4 py-3"><ConvCell v={row.conversions} /></td>
                        <td className="px-4 py-3" style={{ color: cpl > 0 ? GREEN : MUTED }}>{cpl > 0 ? fmt.brl(cpl) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANÚNCIOS ──────────────────────────────────────────────────────── */}
        {section === 'anuncios' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">
                Anúncios
                <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>({projAdInsights.length})</span>
              </h3>
              {subLoading && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: MUTED }} />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Anúncio','Conjunto','Investimento','Alcance','Cliques','CTR','CPM','Leads','CPL'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdInsights.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando anúncios...' : 'Nenhum anúncio com gasto no período'}
                    </td></tr>
                  )}
                  {projAdInsights.map((row, i) => {
                    const cpl = row.conversions > 0 ? row.spend / row.conversions : 0;
                    const maxS = projAdInsights[0]?.spend ?? 1;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition"
                        style={{ borderBottom: i < projAdInsights.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="text-white font-medium text-xs truncate" title={row.adName}>{cleanName(row.adName ?? '')}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate text-xs" style={{ color: MUTED }} title={row.adsetName}>{cleanName(row.adsetName ?? '')}</p>
                        </td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxS} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.reach)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.brl(row.cpm)}</td>
                        <td className="px-4 py-3"><ConvCell v={row.conversions} /></td>
                        <td className="px-4 py-3" style={{ color: cpl > 0 ? GREEN : MUTED }}>{cpl > 0 ? fmt.brl(cpl) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CRIATIVOS ─────────────────────────────────────────────────────── */}
        {section === 'criativos' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">Relatório de criativos</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: MUTED }}>{projAdInsights.length} criativos</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
                  style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
                  <Filter className="w-3 h-3" /> Filtros
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Prévia','Nomenclatura','CTR Link','Leads','Investimento','CPL','Alcance'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdInsights.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando...' : 'Sem dados de criativos no período'}
                    </td></tr>
                  )}
                  {projAdInsights.map((c, i) => {
                    const cpl = c.conversions > 0 ? c.spend / c.conversions : 0;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3">
                          <div className="w-14 h-14 rounded flex items-center justify-center text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg,#1f1f1f,#2a2a2a)', color: MUTED }}>
                            AD
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                          <span className="line-clamp-2 text-xs">{cleanName(c.adName ?? '')}</span>
                          <span className="text-xs block mt-0.5 truncate" style={{ color: MUTED }}>{cleanName(c.adsetName ?? '')}</span>
                        </td>
                        <td className="px-4 py-3 text-white">{fmt.pct(c.ctr)}</td>
                        <td className="px-4 py-3"><ConvCell v={c.conversions} /></td>
                        <td className="px-4 py-3"><InvBar value={c.spend} max={projAdInsights[0]?.spend ?? 1} /></td>
                        <td className="px-4 py-3" style={{ color: cpl > 0 ? GREEN : MUTED }}>
                          {cpl > 0 ? fmt.brl(cpl) : '—'}
                        </td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(c.reach)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PÚBLICOS ──────────────────────────────────────────────────────── */}
        {section === 'publicos' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">Relatório de públicos (por conjunto)</h3>
                <span className="text-xs" style={{ color: MUTED }}>{projAdsetInsights.length} conjuntos</span>
              </div>
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Público','Leads','Investimento','CPL','Alcance'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdsetInsights.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      Acesse a aba Conjuntos primeiro para carregar os dados
                    </td></tr>
                  )}
                  {projAdsetInsights.map((a, i) => {
                    const cpl = a.conversions > 0 ? a.spend / a.conversions : 0;
                    const maxS = projAdsetInsights[0]?.spend ?? 1;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3 text-white max-w-[220px]">
                          <span className="truncate block text-xs">{cleanName(a.adsetName ?? '')}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{fmt.num(a.conversions)}</span>
                            {a.conversions > 0 && (
                              <div className="h-2.5 rounded-sm" style={{ width: `${(a.conversions / (projAdsetInsights[0]?.conversions || 1)) * 40}px`, minWidth:4, backgroundColor: RED }} />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3"><InvBar value={a.spend} max={maxS} /></td>
                        <td className="px-4 py-3" style={{ color: cpl > 0 ? GREEN : MUTED }}>{cpl > 0 ? fmt.brl(cpl) : '—'}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(a.reach)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-2 rounded-lg p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold mb-4">Distribuição de investimento</h3>
              {projAdsetInsights.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={projAdsetInsights.slice(0, 6).map((a) => ({
                        name: cleanName(a.adsetName ?? '').slice(0, 28),
                        value: parseFloat(a.spend.toFixed(2)),
                      }))}
                      cx="50%" cy="50%" outerRadius={85} dataKey="value"
                      label={({ value }) => fmt.brl(value)}
                      labelLine={{ stroke: MUTED }}>
                      {['#E8001C','#3B82F6','#F97316','#22C55E','#8B5CF6','#EAB308'].map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <Legend formatter={v => <span style={{ color: MUTED, fontSize: 10 }}>{v}</span>} />
                    <Tooltip contentStyle={ttStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-sm" style={{ color: MUTED }}>
                  Acesse Conjuntos primeiro
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DEMOGRÁFICO ───────────────────────────────────────────────────── */}
        {section === 'demografico' && (
          <div className="rounded-lg p-8 text-center" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm" style={{ color: MUTED }}>
              Dados demográficos disponíveis via <strong className="text-white">Meta Ads Breakdowns</strong>.
            </p>
            <p className="text-xs mt-2" style={{ color: MUTED }}>
              Em breve: segmentação por sexo, faixa etária, região e dispositivo.
            </p>
          </div>
        )}

        <p className="text-center text-xs pb-6" style={{ color: MUTED }}>
          Se7.Gência · 4VENTOS2.0 · act_1050253385684120 · Meta Ads v21.0
        </p>
      </main>
    </div>
  );
}
