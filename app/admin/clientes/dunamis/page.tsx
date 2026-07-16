'use client';

import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw, ChevronRight, Settings2, Filter, Play, X, Image as ImageIcon } from 'lucide-react';
import DateRangePicker, { DateSelection } from '@/components/DateRangePicker';

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';
const ORANGE = '#F97316';
const BLUE   = '#3B82F6';
const PURPLE = '#8B5CF6';

// ── Conta ─────────────────────────────────────────────────────────────────────
const ACCOUNT_ID = '1248776741801685';

// ── Projetos — padrões nos nomes das campanhas ────────────────────────────────
const PROJECTS = [
  {
    id: 'geral',
    name: 'Geral',
    patterns: [], // vazio = todas as campanhas
  },
  {
    id: 'fornalha',
    name: 'Fornalha',
    patterns: ['FORNALHA', 'FORNO'],
  },
  {
    id: 'seminario',
    name: 'Seminário de Educação',
    patterns: ['SEMINAR', 'SEMINÁRIO', 'EDUCAÇÃO', 'EDUCACAO'],
  },
  {
    id: 'volta',
    name: 'Volta às Aulas',
    patterns: ['VOLTA', 'AULAS', 'VTA'],
  },
  {
    id: 'pedagogia',
    name: 'Pedagogia',
    patterns: ['PEDAGOGIA', 'PED'],
  },
  {
    id: 'ads',
    name: 'ADS',
    patterns: ['ANALISE', 'ANÁLISE', 'DESENVOLVIMENTO', 'SISTEMA', 'ADS'],
  },
];


// ── Helpers ───────────────────────────────────────────────────────────────────

function matchProject(name: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  const upper = name.toUpperCase();
  return patterns.some(p => upper.includes(p.toUpperCase()));
}

const fmt = {
  brl: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number, d = 2) => `${v.toFixed(d)}%`,
  x:   (v: number) => `${v.toFixed(2)}x`,
};

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

function InvBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-xs tabular-nums whitespace-nowrap">{fmt.brl(value)}</span>
      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: RED }} />
      </div>
    </div>
  );
}

function LeadCell({ v }: { v: number }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${v > 0 ? 'text-green-400' : 'text-white'}`}
      style={v > 0 ? { backgroundColor: 'rgba(34,197,94,0.15)' } : {}}>
      {fmt.num(v)}
    </span>
  );
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface InsightRow {
  campaignId?:       string;
  campaignName?:     string;
  adsetId?:          string;
  adsetName?:        string;
  adId?:             string;
  adName?:           string;
  impressions:       number;
  reach:             number;
  clicks:            number;
  spend:             number;
  cpc:               number;
  cpm:               number;
  ctr:               number;
  frequency:         number;
  conversions:       number;
  purchases:         number;
  landingPageViews:  number;
  dateStart:         string;
  dateStop:          string;
}

interface Campaign { id: string; name: string; status: string; objective: string }

interface AdCreative {
  id:               string;
  thumbnail_url?:   string;
  video_id?:        string;
  image_url?:       string;
  title?:           string;
  body?:            string;
  object_type?:     string;
}

interface Ad {
  id:          string;
  name:        string;
  adset_id:    string;
  campaign_id: string;
  status:      string;
  creative?:   AdCreative;
}

interface VideoModal {
  adName:    string;
  isVideo:   boolean;
  imageUrl?: string;
  thumbUrl?: string;
  videoSrc?: string;
  loading:   boolean;
}

// ── Creative Thumb ────────────────────────────────────────────────────────────

function CreativeThumb({ ad, onClick }: { ad?: Ad; onClick: () => void }) {
  const thumb = ad?.creative?.thumbnail_url;
  const isVid = !!ad?.creative?.video_id;
  if (!ad) {
    return (
      <div className="w-16 h-16 rounded flex items-center justify-center text-xs font-bold"
        style={{ background: 'linear-gradient(135deg,#1f1f1f,#2a2a2a)', color: MUTED }}>AD</div>
    );
  }
  return (
    <button onClick={onClick}
      className="relative w-16 h-16 rounded overflow-hidden group shrink-0 focus:outline-none"
      style={{ border: `1px solid ${BORDER}` }}>
      {thumb
        ? <img src={thumb} alt="" className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#1f1f1f,#2a2a2a)' }}>
            <ImageIcon className="w-5 h-5" style={{ color: MUTED }} />
          </div>
      }
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
        {isVid ? <Play className="w-5 h-5 text-white fill-white" /> : <ImageIcon className="w-5 h-5 text-white" />}
      </div>
    </button>
  );
}

// ── Funnel Step Component ─────────────────────────────────────────────────────

interface FunnelStepProps {
  step:    number;
  label:   string;
  value:   string;
  sub?:    string;
  color:   string;
  last?:   boolean;
  loading: boolean;
}

function FunnelStep({ step, label, value, sub, color, last, loading }: FunnelStepProps) {
  return (
    <div className="flex items-center gap-0 flex-1 min-w-0">
      <div className="flex-1 min-w-0 px-4 py-4 flex flex-col gap-1"
        style={{ backgroundColor: CARD, borderTop: `2px solid ${color}` }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-bold tabular-nums w-4 shrink-0"
            style={{ color }}>
            {step}
          </span>
          <span className="text-xs truncate" style={{ color: MUTED }}>{label}</span>
        </div>
        {loading
          ? <div className="h-6 w-20 rounded animate-pulse" style={{ backgroundColor: BORDER }} />
          : <span className="text-xl font-black text-white tabular-nums truncate">{value}</span>
        }
        {sub && !loading && (
          <span className="text-xs" style={{ color: MUTED }}>{sub}</span>
        )}
      </div>
      {!last && (
        <ChevronRight className="w-4 h-4 shrink-0 mx-0 z-10" style={{ color: BORDER }} />
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DunamisDashboard() {
  const [projId,   setProjId]   = useState('geral');
  const [section,  setSection]  = useState('campanhas');
  const [dateSel,  setDateSel]  = useState<DateSelection>({
    since:  (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().split('T')[0]; })(),
    until:  new Date().toISOString().split('T')[0],
    preset: 'last_30d',
    label:  'Últimos 30 dias',
  });

  const [campaigns,     setCampaigns]     = useState<Campaign[]>([]);
  const [campInsights,  setCampInsights]  = useState<InsightRow[]>([]);
  const [adsetInsights, setAdsetInsights] = useState<InsightRow[]>([]);
  const [adInsights,    setAdInsights]    = useState<InsightRow[]>([]);
  const [dailyInsights, setDailyInsights] = useState<InsightRow[]>([]);
  const [adsMap,        setAdsMap]        = useState<Record<string, Ad>>({});

  const [loading,    setLoading]    = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [error,      setError]      = useState('');
  const [modal,      setModal]      = useState<VideoModal | null>(null);

  const project = PROJECTS.find(p => p.id === projId)!;

  const API = (path: string, extra = '') =>
    `/api/meta/${path}?account_id=${ACCOUNT_ID}${extra}`;

  const projectCampaignIds = campaigns
    .filter(c => matchProject(c.name, project.patterns))
    .map(c => c.id);

  // ── Load base data ────────────────────────────────────────────────────────

  const loadBase = useCallback(async (sel: DateSelection) => {
    setLoading(true);
    setError('');
    const dp = `&since=${sel.since}&until=${sel.until}`;
    try {
      const [campRes, insRes, dailyRes] = await Promise.all([
        fetch(API('campaigns')).then(r => r.json()),
        fetch(API('insights', `&level=campaign${dp}`)).then(r => r.json()),
        fetch(API('insights', `&level=campaign${dp}&time_increment=1`)).then(r => r.json()),
      ]);
      setCampaigns(campRes.campaigns ?? []);
      setCampInsights(insRes.insights ?? []);
      setDailyInsights(dailyRes.insights ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBase(dateSel); }, [dateSel.since, dateSel.until, loadBase]);

  // ── Load adsets ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (section !== 'conjuntos' || projectCampaignIds.length === 0) return;
    setSubLoading(true);
    const ids = projectCampaignIds.join(',');
    fetch(API('insights', `&level=adset&since=${dateSel.since}&until=${dateSel.until}&campaign_ids=${ids}`))
      .then(r => r.json())
      .then(res => setAdsetInsights(res.insights ?? []))
      .catch(e => setError(e.message))
      .finally(() => setSubLoading(false));
  }, [section, projId, projectCampaignIds.join(','), dateSel.since, dateSel.until]);

  // ── Load ads + creatives ──────────────────────────────────────────────────

  useEffect(() => {
    if ((section !== 'anuncios' && section !== 'criativos') || projectCampaignIds.length === 0) return;
    setSubLoading(true);
    const ids = projectCampaignIds.join(',');
    Promise.all([
      fetch(API('insights', `&level=ad&since=${dateSel.since}&until=${dateSel.until}&campaign_ids=${ids}`)).then(r => r.json()),
      fetch(API('ads', `&campaign_ids=${ids}`)).then(r => r.json()),
    ])
      .then(([insRes, adsRes]) => {
        setAdInsights(insRes.insights ?? []);
        const map: Record<string, Ad> = {};
        (adsRes.ads ?? []).forEach((ad: Ad) => { map[ad.id] = ad; });
        setAdsMap(map);
      })
      .catch(e => setError(e.message))
      .finally(() => setSubLoading(false));
  }, [section, projId, projectCampaignIds.join(','), dateSel.since, dateSel.until]);

  // ── Open creative modal ───────────────────────────────────────────────────

  const openCreative = useCallback(async (row: InsightRow) => {
    const ad       = row.adId ? adsMap[row.adId] : undefined;
    const creative = ad?.creative;
    const isVideo  = !!creative?.video_id;
    setModal({ adName: row.adName ?? '', thumbUrl: creative?.thumbnail_url, isVideo, loading: isVideo });

    if (isVideo && creative?.video_id) {
      try {
        const res  = await fetch(`/api/meta/video?video_id=${creative.video_id}`);
        const data = await res.json();
        setModal(m => m ? { ...m, videoSrc: data.source ?? undefined, loading: false } : null);
      } catch {
        setModal(m => m ? { ...m, loading: false } : null);
      }
    } else {
      setModal(m => m ? { ...m, imageUrl: creative?.image_url ?? creative?.thumbnail_url, loading: false } : null);
    }
  }, [adsMap]);

  // ── Filtros ───────────────────────────────────────────────────────────────

  const projCampInsights = campInsights
    .filter(i => matchProject(i.campaignName ?? '', project.patterns) && i.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const projAdsetInsights = adsetInsights
    .filter(i => i.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const projAdInsights = adInsights
    .filter(i => i.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  // ── Totais ────────────────────────────────────────────────────────────────

  const totals = projCampInsights.reduce(
    (acc, i) => ({
      impressions:      acc.impressions      + i.impressions,
      reach:            acc.reach            + i.reach,
      clicks:           acc.clicks           + i.clicks,
      spend:            acc.spend            + i.spend,
      conversions:      acc.conversions      + i.conversions,
      frequency:        acc.frequency        + i.frequency,
      landingPageViews: acc.landingPageViews + i.landingPageViews,
    }),
    { impressions: 0, reach: 0, clicks: 0, spend: 0, conversions: 0, frequency: 0, landingPageViews: 0 }
  );

  // frequency é média, não soma
  const avgFrequency = projCampInsights.length > 0
    ? projCampInsights.reduce((s, i) => s + i.frequency, 0) / projCampInsights.length
    : 0;

  const ctr         = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpm         = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
  const connectRate = totals.clicks > 0 ? (totals.landingPageViews / totals.clicks) * 100 : 0;
  const cpl         = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  // ── Daily chart ───────────────────────────────────────────────────────────

  const dailyMap = new Map<string, { spend: number; conversions: number; clicks: number; lpv: number }>();
  dailyInsights
    .filter(i => matchProject(i.campaignName ?? '', project.patterns))
    .forEach(i => {
      const key = i.dateStart;
      const cur = dailyMap.get(key) ?? { spend: 0, conversions: 0, clicks: 0, lpv: 0 };
      dailyMap.set(key, {
        spend:       cur.spend       + i.spend,
        conversions: cur.conversions + i.conversions,
        clicks:      cur.clicks      + i.clicks,
        lpv:         cur.lpv         + i.landingPageViews,
      });
    });

  const chartData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date:   date.slice(5),
      invest: d.spend,
      leads:  d.conversions,
      clicks: d.clicks,
    }));

  const dailyRows = Array.from(dailyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, d]) => ({ date, ...d }));

  const maxSpend      = projCampInsights[0]?.spend ?? 1;
  const maxDailySpend = Math.max(...dailyRows.map(r => r.spend), 1);

  const ttStyle = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11, color: '#fff' };

  const SECTIONS = [
    { id: 'campanhas',   label: 'Campanhas'   },
    { id: 'conjuntos',   label: 'Conjuntos'   },
    { id: 'anuncios',    label: 'Anúncios'    },
    { id: 'criativos',   label: 'Criativos'   },
    { id: 'publicos',    label: 'Públicos'    },
  ];

  // ── Funil: 8 etapas ───────────────────────────────────────────────────────

  const funnelSteps = [
    { label: 'Cliques',           value: fmt.num(totals.clicks),                   sub: 'no link',             color: BLUE   },
    { label: 'CTR',               value: fmt.pct(ctr),                             sub: 'cliques/impressões',  color: BLUE   },
    { label: 'CPM',               value: cpm > 0 ? fmt.brl(cpm) : '—',            sub: 'custo por mil',       color: PURPLE },
    { label: 'Frequência',        value: fmt.x(avgFrequency),                      sub: 'média por pessoa',    color: PURPLE },
    { label: 'Viz. de Página',    value: fmt.num(totals.landingPageViews),          sub: 'landing page views',  color: ORANGE },
    { label: 'Connect Rate',      value: connectRate > 0 ? fmt.pct(connectRate) : '—', sub: 'lpv / cliques',  color: ORANGE },
    { label: 'Leads',             value: fmt.num(totals.conversions),              sub: 'conversões',          color: GREEN  },
    { label: 'Custo por Lead',    value: cpl > 0 ? fmt.brl(cpl) : '—',            sub: 'investimento / leads', color: GREEN },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setModal(null)}>
          <div className="relative w-full max-w-3xl rounded-xl overflow-hidden"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold text-white truncate pr-4">{cleanName(modal.adName)}</p>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 transition shrink-0">
                <X className="w-4 h-4" style={{ color: MUTED }} />
              </button>
            </div>
            <div className="p-5 flex items-center justify-center" style={{ minHeight: 360, backgroundColor: '#111' }}>
              {modal.loading ? (
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: MUTED }} />
                  <p className="text-xs" style={{ color: MUTED }}>Carregando criativo...</p>
                </div>
              ) : modal.isVideo && modal.videoSrc ? (
                <video src={modal.videoSrc} controls autoPlay className="max-w-full max-h-[60vh] rounded-lg" />
              ) : (modal.imageUrl || modal.thumbUrl) ? (
                <img src={modal.imageUrl ?? modal.thumbUrl} alt={modal.adName} className="max-w-full max-h-[60vh] rounded-lg object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon className="w-8 h-8" style={{ color: MUTED }} />
                  <p className="text-xs" style={{ color: MUTED }}>Prévia não disponível</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4 justify-between flex-wrap">

          {/* Logo */}
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-2xl font-black tracking-tight">Se7</span>
            <span className="w-2.5 h-2.5 rounded-full mb-4 mx-0.5" style={{ backgroundColor: RED }} />
            <span className="text-2xl font-black tracking-tight">Gência</span>
            <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(232,0,28,0.15)', color: RED }}>
              Dunamis Movimente
            </span>
          </div>

          {/* Project tabs */}
          <div className="flex rounded-lg overflow-hidden shrink-0 flex-wrap" style={{ border: `1px solid ${BORDER}` }}>
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
          <div className="flex items-center gap-2 shrink-0">
            <DateRangePicker value={dateSel} onChange={sel => { setDateSel(sel); }} />

            <button onClick={() => loadBase(dateSel)}
              className="p-2 rounded-lg transition hover:bg-white/5"
              style={{ border: `1px solid ${BORDER}` }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: MUTED }} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: RED }}>
              <Download className="w-4 h-4" /> PDF
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

        {/* FUNIL DO CLIENTE */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            Funil do cliente
          </p>
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {funnelSteps.map((step, i) => (
              <FunnelStep
                key={i}
                step={i + 1}
                label={step.label}
                value={step.value}
                sub={step.sub}
                color={step.color}
                last={i === funnelSteps.length - 1}
                loading={loading}
              />
            ))}
          </div>

          {/* Investimento total separado */}
          {!loading && (
            <div className="mt-3 flex items-center gap-6 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Investimento total:</span>
                <span className="text-sm font-bold text-white">{fmt.brl(totals.spend)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Alcance:</span>
                <span className="text-sm font-bold text-white">{fmt.num(totals.reach)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Impressões:</span>
                <span className="text-sm font-bold text-white">{fmt.num(totals.impressions)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Campanhas ativas:</span>
                <span className="text-sm font-bold" style={{ color: GREEN }}>
                  {projCampInsights.filter(i => campaigns.find(c => c.id === i.campaignId)?.status === 'ACTIVE').length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CAMPANHAS */}
        {section === 'campanhas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Gráfico */}
            <div className="rounded-lg p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-4 mb-1 flex-wrap">
                {[
                  { key: 'leads',  label: 'Leads',       color: '#fff'  },
                  { key: 'invest', label: 'Investimento', color: ORANGE  },
                  { key: 'clicks', label: 'Cliques',      color: BLUE    },
                ].map(l => (
                  <div key={l.key} className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                    <span className="w-6 h-px inline-block" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
              <h3 className="text-white text-sm font-semibold mb-4">Leads × Investimento por dia</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} />
                    <YAxis tick={{ fontSize: 10, fill: MUTED }} />
                    <Tooltip contentStyle={ttStyle} />
                    <Line type="monotone" dataKey="leads"  stroke="#fff"  strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="invest" stroke={ORANGE} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="clicks" stroke={BLUE}  strokeWidth={1}   dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-60 text-sm" style={{ color: MUTED }}>
                  {loading ? 'Carregando...' : 'Sem dados no período'}
                </div>
              )}
            </div>

            {/* Tabela diária */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">Relatório por dia</h3>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 320 }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0" style={{ backgroundColor: '#1F1F1F' }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Data', 'Investimento', 'Leads', 'Cliques', 'Viz. Pág.'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center" style={{ color: MUTED }}>Sem dados</td></tr>
                    )}
                    {dailyRows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3" style={{ color: MUTED }}>{row.date}</td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxDailySpend} /></td>
                        <td className="px-4 py-3"><LeadCell v={row.conversions} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.lpv)}</td>
                      </tr>
                    ))}
                    {dailyRows.length > 0 && (
                      <tr style={{ backgroundColor: '#1F1F1F' }}>
                        <td className="px-4 py-3 font-bold text-white">Total</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.brl(totals.spend)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{fmt.num(totals.conversions)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.clicks)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.landingPageViews)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de campanhas */}
            <div className="lg:col-span-2 rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">
                  Campanhas
                  <span className="ml-2 text-xs font-normal" style={{ color: MUTED }}>
                    ({projCampInsights.length})
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead style={{ backgroundColor: '#1F1F1F' }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Campanha', 'Status', 'Investimento', 'Cliques', 'CTR', 'CPM', 'Freq.', 'Viz. Pág.', 'Connect%', 'Leads', 'CPL'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projCampInsights.length === 0 && (
                      <tr><td colSpan={11} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                        {loading ? 'Carregando...' : 'Nenhuma campanha com gasto no período'}
                      </td></tr>
                    )}
                    {projCampInsights.map((row, i) => {
                      const rowCpl = row.conversions > 0 ? row.spend / row.conversions : 0;
                      const rowCr  = row.clicks > 0 ? (row.landingPageViews / row.clicks) * 100 : 0;
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
                          <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.brl(row.cpm)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.x(row.frequency)}</td>
                          <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.landingPageViews)}</td>
                          <td className="px-4 py-3 tabular-nums" style={{ color: rowCr > 50 ? GREEN : MUTED }}>
                            {rowCr > 0 ? fmt.pct(rowCr, 1) : '—'}
                          </td>
                          <td className="px-4 py-3"><LeadCell v={row.conversions} /></td>
                          <td className="px-4 py-3" style={{ color: rowCpl > 0 ? GREEN : MUTED }}>
                            {rowCpl > 0 ? fmt.brl(rowCpl) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {projCampInsights.length > 0 && (
                      <tr style={{ backgroundColor: '#1F1F1F' }}>
                        <td className="px-4 py-3 font-bold text-white" colSpan={2}>Total</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.brl(totals.spend)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.clicks)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.pct(ctr)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.brl(cpm)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.x(avgFrequency)}</td>
                        <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.landingPageViews)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: connectRate > 50 ? GREEN : MUTED }}>
                          {connectRate > 0 ? fmt.pct(connectRate, 1) : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{fmt.num(totals.conversions)}</td>
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{cpl > 0 ? fmt.brl(cpl) : '—'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CONJUNTOS */}
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
                    {['Conjunto', 'Campanha', 'Investimento', 'Cliques', 'CTR', 'CPM', 'Viz. Pág.', 'Connect%', 'Leads', 'CPL'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdsetInsights.length === 0 && (
                    <tr><td colSpan={10} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando conjuntos...' : 'Nenhum conjunto com gasto no período'}
                    </td></tr>
                  )}
                  {projAdsetInsights.map((row, i) => {
                    const rowCpl = row.conversions > 0 ? row.spend / row.conversions : 0;
                    const rowCr  = row.clicks > 0 ? (row.landingPageViews / row.clicks) * 100 : 0;
                    const maxS   = projAdsetInsights[0]?.spend ?? 1;
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
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.brl(row.cpm)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.landingPageViews)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: rowCr > 50 ? GREEN : MUTED }}>
                          {rowCr > 0 ? fmt.pct(rowCr, 1) : '—'}
                        </td>
                        <td className="px-4 py-3"><LeadCell v={row.conversions} /></td>
                        <td className="px-4 py-3" style={{ color: rowCpl > 0 ? GREEN : MUTED }}>{rowCpl > 0 ? fmt.brl(rowCpl) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANÚNCIOS */}
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
                    {['Anúncio', 'Conjunto', 'Investimento', 'Cliques', 'CTR', 'Viz. Pág.', 'Connect%', 'Leads', 'CPL'].map(h => (
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
                    const rowCpl = row.conversions > 0 ? row.spend / row.conversions : 0;
                    const rowCr  = row.clicks > 0 ? (row.landingPageViews / row.clicks) * 100 : 0;
                    const maxS   = projAdInsights[0]?.spend ?? 1;
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
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.landingPageViews)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: rowCr > 50 ? GREEN : MUTED }}>
                          {rowCr > 0 ? fmt.pct(rowCr, 1) : '—'}
                        </td>
                        <td className="px-4 py-3"><LeadCell v={row.conversions} /></td>
                        <td className="px-4 py-3" style={{ color: rowCpl > 0 ? GREEN : MUTED }}>{rowCpl > 0 ? fmt.brl(rowCpl) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRIATIVOS */}
        {section === 'criativos' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">
                Criativos
                <span className="ml-2 font-normal text-xs" style={{ color: MUTED }}>
                  — clique na prévia para assistir
                </span>
              </h3>
              <div className="flex items-center gap-3">
                {subLoading && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: MUTED }} />}
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
                    {['Prévia', 'Nomenclatura', 'CTR', 'Viz. Pág.', 'Connect%', 'Leads', 'CPL', 'Investimento'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdInsights.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando criativos...' : 'Sem dados de criativos no período'}
                    </td></tr>
                  )}
                  {projAdInsights.map((c, i) => {
                    const rowCpl = c.conversions > 0 ? c.spend / c.conversions : 0;
                    const rowCr  = c.clicks > 0 ? (c.landingPageViews / c.clicks) * 100 : 0;
                    const ad     = c.adId ? adsMap[c.adId] : undefined;
                    const isVid  = !!ad?.creative?.video_id;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3">
                          <CreativeThumb ad={ad} onClick={() => openCreative(c)} />
                        </td>
                        <td className="px-4 py-3 text-white font-medium max-w-[200px]">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isVid && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
                                style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: BLUE }}>
                                VÍD
                              </span>
                            )}
                            <span className="line-clamp-2 text-xs">{cleanName(c.adName ?? '')}</span>
                          </div>
                          <span className="text-xs block truncate" style={{ color: MUTED }}>{cleanName(c.adsetName ?? '')}</span>
                        </td>
                        <td className="px-4 py-3 text-white">{fmt.pct(c.ctr)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(c.landingPageViews)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: rowCr > 50 ? GREEN : MUTED }}>
                          {rowCr > 0 ? fmt.pct(rowCr, 1) : '—'}
                        </td>
                        <td className="px-4 py-3"><LeadCell v={c.conversions} /></td>
                        <td className="px-4 py-3" style={{ color: rowCpl > 0 ? GREEN : MUTED }}>
                          {rowCpl > 0 ? fmt.brl(rowCpl) : '—'}
                        </td>
                        <td className="px-4 py-3"><InvBar value={c.spend} max={projAdInsights[0]?.spend ?? 1} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PÚBLICOS */}
        {section === 'publicos' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">Públicos (por conjunto)</h3>
              {subLoading && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: MUTED }} />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Público', 'Cliques', 'Viz. Pág.', 'Connect%', 'Leads', 'Investimento', 'CPL', 'Alcance'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projAdsetInsights.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      Acesse a aba Conjuntos primeiro para carregar os dados
                    </td></tr>
                  )}
                  {projAdsetInsights.map((a, i) => {
                    const rowCpl = a.conversions > 0 ? a.spend / a.conversions : 0;
                    const rowCr  = a.clicks > 0 ? (a.landingPageViews / a.clicks) * 100 : 0;
                    const maxS   = projAdsetInsights[0]?.spend ?? 1;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3 text-white max-w-[220px]">
                          <span className="truncate block text-xs">{cleanName(a.adsetName ?? '')}</span>
                        </td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(a.clicks)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(a.landingPageViews)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: rowCr > 50 ? GREEN : MUTED }}>
                          {rowCr > 0 ? fmt.pct(rowCr, 1) : '—'}
                        </td>
                        <td className="px-4 py-3"><LeadCell v={a.conversions} /></td>
                        <td className="px-4 py-3"><InvBar value={a.spend} max={maxS} /></td>
                        <td className="px-4 py-3" style={{ color: rowCpl > 0 ? GREEN : MUTED }}>{rowCpl > 0 ? fmt.brl(rowCpl) : '—'}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(a.reach)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs pb-6" style={{ color: MUTED }}>
          Se7.Gência · Dunamis Movimente · act_{ACCOUNT_ID} · Meta Ads v21.0
        </p>
      </main>
    </div>
  );
}
