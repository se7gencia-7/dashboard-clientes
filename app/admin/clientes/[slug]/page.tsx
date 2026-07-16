'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, ChevronRight, Download, Play, X, Image as ImageIcon, Filter } from 'lucide-react';
import DateRangePicker, { DateSelection } from '@/components/DateRangePicker';
import { getConfigBySlug, ClientConfig, MetricId } from '@/lib/client-configs';

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';
const ORANGE = '#F97316';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = {
  brl: (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number, d = 2) => `${v.toFixed(d)}%`,
  x:   (v: number) => `${v.toFixed(2)}x`,
};

function cleanName(s: string) {
  return s.replace(/\[|\]/g, '').replace(/\s+/g, ' ').trim();
}

function matchProject(name: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  const upper = name.toUpperCase();
  return patterns.some(p => upper.includes(p.toUpperCase()));
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
interface Totals {
  impressions:      number;
  reach:            number;
  clicks:           number;
  spend:            number;
  conversions:      number;
  purchases:        number;
  initiateCheckout: number;
  messages:         number;
  landingPageViews: number;
  frequency:        number;
}

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
  initiateCheckout:  number;
  messages:          number;
  landingPageViews:  number;
  dateStart:         string;
  dateStop:          string;
}

interface Campaign { id: string; name: string; status: string }

interface AdCreative {
  id:             string;
  thumbnail_url?: string;
  video_id?:      string;
  image_url?:     string;
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

// ── Sort helpers (module-level so React doesn't remount on each render) ────────
type SortDir = 'asc' | 'desc';
interface SortState { field: string; dir: SortDir }

function sortRows(rows: InsightRow[], field: string, dir: SortDir): InsightRow[] {
  const val = (r: InsightRow): number => {
    switch (field) {
      case 'purchases':        return r.purchases        ?? 0;
      case 'initiateCheckout': return r.initiateCheckout ?? 0;
      case 'messages':         return r.messages         ?? 0;
      case 'conversions':      return r.conversions;
      case 'clicks':           return r.clicks;
      case 'ctr':              return r.ctr;
      case 'cpm':              return r.cpm;
      default:                 return r.spend;
    }
  };
  return [...rows].sort((a, b) => dir === 'desc' ? val(b) - val(a) : val(a) - val(b));
}

function SortTh({ label, field, sort, setSort }: {
  label: string; field: string;
  sort: SortState; setSort: (s: SortState) => void;
}) {
  const active = sort.field === field;
  return (
    <th
      className="px-4 py-3 text-left font-semibold whitespace-nowrap cursor-pointer select-none"
      style={{ color: active ? '#FFFFFF' : '#6B7280' }}
      onClick={() => setSort({ field, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' })}>
      <span className="flex items-center gap-1">
        {label}
        <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>
          {active ? (sort.dir === 'desc' ? '▼' : '▲') : '⬍'}
        </span>
      </span>
    </th>
  );
}

// ── Compute metric value from totals ──────────────────────────────────────────
function computeMetric(id: MetricId, totals: Totals, campCount: number): number {
  switch (id) {
    case 'spend':            return totals.spend;
    case 'impressions':      return totals.impressions;
    case 'reach':            return totals.reach;
    case 'clicks':           return totals.clicks;
    case 'conversions':      return totals.conversions;
    case 'purchases':        return totals.purchases;
    case 'initiate_checkout':return totals.initiateCheckout;
    case 'lpv':              return totals.landingPageViews;
    case 'frequency':        return campCount > 0 ? totals.frequency / campCount : 0;
    case 'ctr':              return totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    case 'cpm':              return totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;
    case 'connect_rate':     return totals.clicks > 0 ? (totals.landingPageViews / totals.clicks) * 100 : 0;
    case 'checkout_rate':    return totals.initiateCheckout > 0 ? (totals.purchases / totals.initiateCheckout) * 100 : 0;
    case 'messages':         return totals.messages;
    case 'cpm_msg':          return totals.messages > 0 ? totals.spend / totals.messages : 0;
    case 'cpa':              return totals.conversions > 0 ? totals.spend / totals.conversions : 0;
    case 'revenue':          return 0;
    case 'roas':             return 0;
    default:                 return 0;
  }
}

function formatMetricValue(id: MetricId, value: number, format?: string): string {
  if (value === 0) return '—';
  const f = format ?? 'num';
  switch (f) {
    case 'brl': return fmt.brl(value);
    case 'pct': return fmt.pct(value);
    case 'x':   return fmt.x(value);
    case 'num': return fmt.num(Math.round(value));
    default:    return fmt.num(Math.round(value));
  }
}

// ── Funnel Step ───────────────────────────────────────────────────────────────
function FunnelStep({
  step, label, value, color, last, loading,
}: {
  step: number; label: string; value: string;
  color: string; last?: boolean; loading: boolean;
}) {
  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex-1 min-w-0 px-4 py-4 flex flex-col gap-1"
        style={{ backgroundColor: CARD, borderTop: `2px solid ${color}` }}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-bold tabular-nums w-4 shrink-0" style={{ color }}>{step}</span>
          <span className="text-xs truncate" style={{ color: MUTED }}>{label}</span>
        </div>
        {loading
          ? <div className="h-6 w-20 rounded animate-pulse" style={{ backgroundColor: BORDER }} />
          : <span className="text-xl font-black text-white tabular-nums truncate">{value}</span>
        }
      </div>
      {!last && <ChevronRight className="w-4 h-4 shrink-0" style={{ color: BORDER }} />}
    </div>
  );
}

// ── InvBar ────────────────────────────────────────────────────────────────────
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

function LeadCell({ v, label }: { v: number; label: string }) {
  return (
    <span title={label}
      className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${v > 0 ? 'text-green-400' : 'text-white'}`}
      style={v > 0 ? { backgroundColor: 'rgba(34,197,94,0.15)' } : {}}>
      {fmt.num(v)}
    </span>
  );
}

// ── CreativeThumb ─────────────────────────────────────────────────────────────
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

// ── Sections ──────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'campanhas', label: 'Campanhas'  },
  { id: 'conjuntos', label: 'Conjuntos'  },
  { id: 'criativos', label: 'Criativos'  },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UniversalClientDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const config: ClientConfig | undefined = getConfigBySlug(slug);

  const [section,    setSection]    = useState('campanhas');
  const [dateSel,    setDateSel]    = useState<DateSelection>({
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
  const [modal,         setModal]         = useState<VideoModal | null>(null);

  const [projId,     setProjId]     = useState<string>(() => config?.projects?.[0]?.id ?? 'all');

  const [loading,    setLoading]    = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [error,      setError]      = useState('');

  const defaultSort = 'spend';

  const [campSort,  setCampSort]  = useState<SortState>({ field: defaultSort, dir: 'desc' });
  const [adsetSort, setAdsetSort] = useState<SortState>({ field: defaultSort, dir: 'desc' });
  const [adSort,    setAdSort]    = useState<SortState>({ field: defaultSort, dir: 'desc' });

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="text-center">
          <p className="text-lg font-bold text-white mb-2">Cliente não encontrado</p>
          <p className="text-sm" style={{ color: MUTED }}>Slug: {slug}</p>
        </div>
      </div>
    );
  }

  const API = (path: string, extra = '') =>
    `/api/meta/${path}?account_id=${config.accountId}${extra}`;

  const dateParam = `&since=${dateSel.since}&until=${dateSel.until}`;

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadBase = useCallback(async (sel: DateSelection) => {
    if (!config) return;
    setLoading(true);
    setError('');
    const dp = `&since=${sel.since}&until=${sel.until}`;
    try {
      const [campRes, insRes, dailyRes] = await Promise.all([
        fetch(`/api/meta/campaigns?account_id=${config.accountId}`).then(r => r.json()),
        fetch(API('insights', `&level=campaign${dp}`)).then(r => r.json()),
        fetch(API('insights', `&level=campaign${dp}&time_increment=1`)).then(r => r.json()),
      ]);
      setCampaigns(campRes.campaigns ?? []);
      setCampInsights((insRes.insights ?? []).filter((i: InsightRow) => i.spend > 0));
      setDailyInsights(dailyRes.insights ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.accountId]);

  useEffect(() => { loadBase(dateSel); }, [dateSel.since, dateSel.until, loadBase]);

  // ── Project filtering ────────────────────────────────────────────────────────
  const activeProject = config?.projects?.find(p => p.id === projId);
  const projCampInsights = (activeProject && activeProject.patterns.length > 0)
    ? campInsights.filter(i => matchProject(i.campaignName ?? '', activeProject.patterns))
    : campInsights;
  const projDailyInsights = (activeProject && activeProject.patterns.length > 0)
    ? dailyInsights.filter(i => matchProject(i.campaignName ?? '', activeProject.patterns))
    : dailyInsights;
  const projIds = projCampInsights.map(i => i.campaignId).filter(Boolean).join(',');

  // ── Load adsets ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'conjuntos' || projCampInsights.length === 0) return;
    setSubLoading(true);
    const ids = projIds;
    fetch(API('insights', `&level=adset${dateParam}&campaign_ids=${ids}`))
      .then(r => r.json())
      .then(res => setAdsetInsights((res.insights ?? []).filter((i: InsightRow) => i.spend > 0)))
      .catch(e => setError(e.message))
      .finally(() => setSubLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, dateSel.since, dateSel.until, projIds]);

  // ── Load ads + creatives ─────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'criativos' || projCampInsights.length === 0) return;
    setSubLoading(true);
    const ids = projIds;
    Promise.all([
      fetch(API('insights', `&level=ad${dateParam}&campaign_ids=${ids}`)).then(r => r.json()),
      fetch(API('ads', `&campaign_ids=${ids}`)).then(r => r.json()),
    ])
      .then(([insRes, adsRes]) => {
        setAdInsights((insRes.insights ?? []).filter((i: InsightRow) => i.spend > 0));
        const map: Record<string, Ad> = {};
        (adsRes.ads ?? []).forEach((ad: Ad) => { map[ad.id] = ad; });
        setAdsMap(map);
      })
      .catch(e => setError(e.message))
      .finally(() => setSubLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, dateSel.since, dateSel.until, projIds]);

  // ── Open creative modal ───────────────────────────────────────────────────────
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

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totals: Totals = projCampInsights.reduce(
    (acc, i) => ({
      impressions:      acc.impressions      + i.impressions,
      reach:            acc.reach            + i.reach,
      clicks:           acc.clicks           + i.clicks,
      spend:            acc.spend            + i.spend,
      conversions:      acc.conversions      + i.conversions,
      purchases:        acc.purchases        + (i.purchases        ?? 0),
      initiateCheckout: acc.initiateCheckout + (i.initiateCheckout ?? 0),
      messages:         acc.messages         + (i.messages         ?? 0),
      landingPageViews: acc.landingPageViews + i.landingPageViews,
      frequency:        acc.frequency        + i.frequency,
    }),
    { impressions: 0, reach: 0, clicks: 0, spend: 0, conversions: 0, purchases: 0, initiateCheckout: 0, messages: 0, landingPageViews: 0, frequency: 0 }
  );

  // ── Daily chart data ─────────────────────────────────────────────────────────
  const dailyMap = new Map<string, { spend: number; conversions: number; clicks: number }>();
  projDailyInsights.forEach(i => {
    const key = i.dateStart;
    const cur = dailyMap.get(key) ?? { spend: 0, conversions: 0, clicks: 0 };
    dailyMap.set(key, {
      spend:       cur.spend       + i.spend,
      conversions: cur.conversions + i.conversions,
      clicks:      cur.clicks      + i.clicks,
    });
  });
  const chartData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date: date.slice(5), invest: d.spend, conv: d.conversions, clicks: d.clicks }));

  // ── Active funnel — per-project overrides account-level ─────────────────────
  const activeFunnel          = activeProject?.funnel          ?? config.funnel;
  const activeConvType        = activeProject?.conversionType  ?? config.conversionType;
  const activeConvLabel       = activeProject?.conversionLabel ?? config.conversionLabel;
  const activeGoal            = activeProject?.goal            ?? config.goal;

  // ── Funnel values ────────────────────────────────────────────────────────────
  const funnelValues = activeFunnel.map(step => ({
    ...step,
    computed: computeMetric(step.metric, totals, projCampInsights.length),
  }));

  // ── Goal check ───────────────────────────────────────────────────────────────
  const convDivisor  = activeConvType === 'purchase' ? totals.purchases
                     : activeConvType === 'message'  ? totals.messages
                     : totals.conversions;
  const cpa          = convDivisor > 0 ? totals.spend / convDivisor : 0;
  const goalOk       = activeGoal ? cpa <= activeGoal.value : null;
  const isPurchase   = activeConvType === 'purchase';
  const isMessage    = activeConvType === 'message';
  const convField    = isPurchase ? 'purchases' : isMessage ? 'messages' : 'conversions';

  const maxSpend      = projCampInsights[0]?.spend ?? 1;
  const maxAdsetSpend = adsetInsights[0]?.spend ?? 1;
  const ttStyle = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11, color: '#fff' };

  const maxAdInsightSpend = adInsights[0]?.spend ?? 1;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* ── MODAL ──────────────────────────────────────────────────────────── */}
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

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4 justify-between flex-wrap">

          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-2xl font-black tracking-tight">Se7</span>
            <span className="w-2.5 h-2.5 rounded-full mb-4 mx-0.5" style={{ backgroundColor: RED }} />
            <span className="text-2xl font-black tracking-tight">Gência</span>
            <span className="ml-3 text-xs font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(232,0,28,0.15)', color: RED }}>
              {config.name}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DateRangePicker value={dateSel} onChange={sel => setDateSel(sel)} />

            <button onClick={() => loadBase(dateSel)}
              className="p-2 rounded-lg transition hover:bg-white/5"
              style={{ border: `1px solid ${BORDER}` }}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: MUTED }} />
            </button>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: RED }}>
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        {/* Project tabs (only when config has splits) */}
        {config.projects && config.projects.length > 1 && (
          <div className="max-w-[1600px] mx-auto px-6 flex gap-2 py-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            {config.projects.map(p => (
              <button key={p.id} onClick={() => setProjId(p.id)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition"
                style={{
                  backgroundColor: projId === p.id ? RED : 'transparent',
                  color:           projId === p.id ? '#fff' : MUTED,
                  border:          `1px solid ${projId === p.id ? RED : BORDER}`,
                }}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Section tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex" style={{ borderTop: `1px solid ${BORDER}` }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="px-5 py-3 text-sm font-medium border-b-2 transition"
              style={{
                borderColor: section === s.id ? RED : 'transparent',
                color:       section === s.id ? RED : MUTED,
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

        {/* ── FUNIL CONFIGURADO ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
              Funil — {activeConvLabel}
            </p>
            {activeGoal && !loading && cpa > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Meta: {fmt.brl(activeGoal.value)}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: goalOk ? 'rgba(34,197,94,0.15)' : 'rgba(232,0,28,0.15)',
                    color: goalOk ? GREEN : RED,
                  }}>
                  {goalOk ? '✓ Dentro da meta' : `${((cpa / activeGoal.value - 1) * 100).toFixed(0)}% acima`}
                </span>
              </div>
            )}
          </div>

          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {funnelValues.map((step, i) => (
              <FunnelStep
                key={step.metric}
                step={i + 1}
                label={step.label}
                value={formatMetricValue(step.metric, step.computed, step.format)}
                color={step.color}
                last={i === funnelValues.length - 1}
                loading={loading}
              />
            ))}
          </div>

          {/* Sub-métricas */}
          {!loading && (
            <div className="mt-3 flex items-center gap-6 px-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Investimento total:</span>
                <span className="text-sm font-bold text-white">{fmt.brl(totals.spend)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: MUTED }}>Alcance:</span>
                <span className="text-sm font-bold text-white">{fmt.num(totals.reach)}</span>
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

        {/* ── CAMPANHAS ─────────────────────────────────────────────────────── */}
        {section === 'campanhas' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">
                Campanhas <span className="font-normal text-xs" style={{ color: MUTED }}>({projCampInsights.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0" style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>Campanha</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>Status</th>
                    <SortTh label="Investimento" field="spend"   sort={campSort} setSort={setCampSort} />
                    <SortTh label="Cliques"      field="clicks"  sort={campSort} setSort={setCampSort} />
                    <SortTh label="CTR"          field="ctr"     sort={campSort} setSort={setCampSort} />
                    {isPurchase && <SortTh label="Init. Checkout" field="initiateCheckout" sort={campSort} setSort={setCampSort} />}
                    <SortTh label={activeConvLabel} field={convField} sort={campSort} setSort={setCampSort} />
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>
                      {isPurchase ? 'Custo/Compra' : isMessage ? 'Custo/Msg' : 'CPL'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projCampInsights.length === 0 && (
                    <tr><td colSpan={isPurchase ? 8 : 7} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {loading ? 'Carregando...' : 'Nenhuma campanha com gasto no período'}
                    </td></tr>
                  )}
                  {sortRows(projCampInsights, campSort.field, campSort.dir).map((row, i) => {
                    const rowDiv = isPurchase ? (row.purchases ?? 0) : isMessage ? (row.messages ?? 0) : row.conversions;
                    const rowCpa = rowDiv > 0 ? row.spend / rowDiv : 0;
                    const camp   = campaigns.find(c => c.id === row.campaignId);
                    return (
                      <tr key={i} className="hover:bg-white/5 transition"
                        style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3 max-w-[260px]">
                          <p className="text-white font-medium text-xs truncate" title={row.campaignName}>
                            {cleanName(row.campaignName ?? '')}
                          </p>
                        </td>
                        <td className="px-4 py-3">{statusBadge(camp?.status ?? 'PAUSED')}</td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxSpend} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                        {isPurchase && (
                          <td className="px-4 py-3">
                            <LeadCell v={row.initiateCheckout ?? 0} label="Init. Checkout" />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <LeadCell v={rowDiv} label={activeConvLabel} />
                        </td>
                        <td className="px-4 py-3" style={{ color: rowCpa > 0 ? GREEN : MUTED }}>
                          {rowCpa > 0 ? fmt.brl(rowCpa) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {projCampInsights.length > 0 && (
                    <tr style={{ backgroundColor: '#1F1F1F' }}>
                      <td className="px-4 py-3 font-bold text-white" colSpan={2}>Total</td>
                      <td className="px-4 py-3 font-bold text-white">{fmt.brl(totals.spend)}</td>
                      <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.clicks)}</td>
                      <td className="px-4 py-3 font-bold text-white">
                        {fmt.pct(totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0)}
                      </td>
                      {isPurchase && (
                        <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{fmt.num(totals.initiateCheckout)}</td>
                      )}
                      <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>
                        {fmt.num(convDivisor)}
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: GREEN }}>{cpa > 0 ? fmt.brl(cpa) : '—'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONJUNTOS ─────────────────────────────────────────────────────── */}
        {section === 'conjuntos' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">
                Conjuntos <span className="font-normal text-xs" style={{ color: MUTED }}>({adsetInsights.length})</span>
              </h3>
              {subLoading && <RefreshCw className="w-4 h-4 animate-spin" style={{ color: MUTED }} />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ backgroundColor: '#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>Conjunto</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>Campanha</th>
                    <SortTh label="Investimento"    field="spend"            sort={adsetSort} setSort={setAdsetSort} />
                    <SortTh label="Cliques"         field="clicks"           sort={adsetSort} setSort={setAdsetSort} />
                    <SortTh label="CTR"             field="ctr"              sort={adsetSort} setSort={setAdsetSort} />
                    <SortTh label="CPM"             field="cpm"              sort={adsetSort} setSort={setAdsetSort} />
                    {isPurchase && <SortTh label="Init. Checkout" field="initiateCheckout" sort={adsetSort} setSort={setAdsetSort} />}
                    <SortTh label={activeConvLabel} field={convField} sort={adsetSort} setSort={setAdsetSort} />
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>
                      {isPurchase ? 'Custo/Compra' : isMessage ? 'Custo/Msg' : 'CPL'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adsetInsights.length === 0 && (
                    <tr><td colSpan={isPurchase ? 9 : 8} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando conjuntos...' : 'Nenhum conjunto com gasto no período'}
                    </td></tr>
                  )}
                  {sortRows(adsetInsights, adsetSort.field, adsetSort.dir).map((row, i) => {
                    const rowDiv = isPurchase ? (row.purchases ?? 0) : isMessage ? (row.messages ?? 0) : row.conversions;
                    const rowCpa = rowDiv > 0 ? row.spend / rowDiv : 0;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition"
                        style={{ borderBottom: i < adsetInsights.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-white font-medium text-xs truncate" title={row.adsetName}>
                            {cleanName(row.adsetName ?? '')}
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate text-xs" style={{ color: MUTED }} title={row.campaignName}>
                            {cleanName(row.campaignName ?? '')}
                          </p>
                        </td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxAdsetSpend} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.pct(row.ctr)}</td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: MUTED }}>{fmt.brl(row.cpm)}</td>
                        {isPurchase && (
                          <td className="px-4 py-3">
                            <LeadCell v={row.initiateCheckout ?? 0} label="Init. Checkout" />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <LeadCell v={rowDiv} label={activeConvLabel} />
                        </td>
                        <td className="px-4 py-3" style={{ color: rowCpa > 0 ? GREEN : MUTED }}>
                          {rowCpa > 0 ? fmt.brl(rowCpa) : '—'}
                        </td>
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
              <h3 className="text-white text-sm font-semibold">
                Criativos
                <span className="ml-2 font-normal text-xs" style={{ color: MUTED }}>— clique na prévia para assistir</span>
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
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>Prévia</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>Anúncio</th>
                    <SortTh label="CTR"          field="ctr"              sort={adSort} setSort={setAdSort} />
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>Viz. Pág.</th>
                    {isPurchase
                      ? <SortTh label="Init. Checkout" field="initiateCheckout" sort={adSort} setSort={setAdSort} />
                      : <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>Connect%</th>
                    }
                    <SortTh label={activeConvLabel} field={convField} sort={adSort} setSort={setAdSort} />
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap" style={{ color: MUTED }}>
                      {isPurchase ? 'Custo/Compra' : isMessage ? 'Custo/Msg' : 'CPL'}
                    </th>
                    <SortTh label="Investimento" field="spend"            sort={adSort} setSort={setAdSort} />
                  </tr>
                </thead>
                <tbody>
                  {adInsights.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-center" style={{ color: MUTED }}>
                      {subLoading ? 'Carregando criativos...' : 'Sem dados de criativos no período'}
                    </td></tr>
                  )}
                  {sortRows(adInsights, adSort.field, adSort.dir).map((row, i) => {
                    const rowDiv = isPurchase ? (row.purchases ?? 0) : isMessage ? (row.messages ?? 0) : row.conversions;
                    const rowCpa = rowDiv > 0 ? row.spend / rowDiv : 0;
                    const rowCr   = row.clicks > 0 ? (row.landingPageViews / row.clicks) * 100 : 0;
                    const ad      = row.adId ? adsMap[row.adId] : undefined;
                    const isVid   = !!ad?.creative?.video_id;
                    return (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3">
                          <CreativeThumb ad={ad} onClick={() => openCreative(row)} />
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isVid && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
                                style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}>VÍD</span>
                            )}
                            <span className="line-clamp-2 text-xs text-white">{cleanName(row.adName ?? '')}</span>
                          </div>
                          <span className="text-xs block truncate" style={{ color: MUTED }}>{cleanName(row.adsetName ?? '')}</span>
                        </td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.pct(row.ctr)}</td>
                        <td className="px-4 py-3 text-white tabular-nums">{fmt.num(row.landingPageViews)}</td>
                        {isPurchase
                          ? <td className="px-4 py-3"><LeadCell v={row.initiateCheckout ?? 0} label="Init. Checkout" /></td>
                          : <td className="px-4 py-3 tabular-nums" style={{ color: rowCr > 50 ? GREEN : MUTED }}>
                              {rowCr > 0 ? fmt.pct(rowCr, 1) : '—'}
                            </td>
                        }
                        <td className="px-4 py-3">
                          <LeadCell v={rowDiv} label={activeConvLabel} />
                        </td>
                        <td className="px-4 py-3" style={{ color: rowCpa > 0 ? GREEN : MUTED }}>
                          {rowCpa > 0 ? fmt.brl(rowCpa) : '—'}
                        </td>
                        <td className="px-4 py-3"><InvBar value={row.spend} max={maxAdInsightSpend} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-xs pb-6" style={{ color: MUTED }}>
          Se7.Gência · {config.name} · act_{config.accountId} · Meta Ads v21.0
        </p>
      </main>
    </div>
  );
}
