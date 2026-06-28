'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Users, MousePointer, DollarSign, Target, ShoppingCart, Eye, RefreshCw } from 'lucide-react';

interface CampaignRow {
  campaignId: string;
  campaignName: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpc: number;
  cpm: number;
  ctr: number;
  conversions: number;
  dateStart: string;
  dateStop: string;
}

interface Totals {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number;
}

const fmt = {
  brl: (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }),
  num: (v: number) => v.toLocaleString('pt-BR'),
  pct: (v: number) => `${v.toFixed(2)}%`,
};

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color = '#E8001C',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div
      style={{ background: '#181818', border: '1px solid #272727' }}
      className="rounded-xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#6B7280' }}>
          {label}
        </span>
        <div className="rounded-lg p-2" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  );
}

function statusBadge(name: string) {
  const isPaused = name.includes('PAUSED');
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={isPaused
        ? { background: '#27272780', color: '#9CA3AF' }
        : { background: '#22C55E18', color: '#22C55E' }}
    >
      {isPaused ? 'Pausada' : 'Ativa'}
    </span>
  );
}

function cleanName(name: string) {
  return name
    .replace(/\[|\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function Ventos4Dashboard() {
  const [insights, setInsights] = useState<CampaignRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datePreset, setDatePreset] = useState('last_30d');
  const [lastUpdated, setLastUpdated] = useState('');

  async function load(preset: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/meta/insights?date_preset=${preset}`);
      if (!res.ok) throw new Error('Erro ao buscar dados');
      const data = await res.json();
      const withSpend = (data.insights as CampaignRow[]).filter((r) => r.spend > 0);
      withSpend.sort((a, b) => b.spend - a.spend);
      setInsights(withSpend);
      setTotals(data.totals);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(datePreset); }, [datePreset]);

  const cpl = totals && totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  return (
    <div className="min-h-screen" style={{ background: '#0D0D0D', color: '#fff' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-8 py-4"
        style={{ background: '#0D0D0D', borderBottom: '1px solid #272727' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: '#E8001C', color: '#fff' }}
          >
            S7
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">4VENTOS2.0</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Meta Ads · act_1050253385684120
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de período */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none"
            style={{ background: '#181818', border: '1px solid #272727', color: '#fff' }}
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="last_7d">Últimos 7 dias</option>
            <option value="last_14d">Últimos 14 dias</option>
            <option value="last_30d">Últimos 30 dias</option>
            <option value="this_month">Este mês</option>
            <option value="last_month">Mês passado</option>
          </select>

          <button
            onClick={() => load(datePreset)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            style={{ background: '#181818', border: '1px solid #272727', color: '#9CA3AF' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>

          {lastUpdated && (
            <span className="text-xs" style={{ color: '#6B7280' }}>
              às {lastUpdated}
            </span>
          )}
        </div>
      </header>

      <main className="px-8 py-8 max-w-screen-xl mx-auto space-y-8">
        {error && (
          <div className="rounded-xl p-4 text-sm" style={{ background: '#E8001C18', color: '#E8001C', border: '1px solid #E8001C40' }}>
            {error}
          </div>
        )}

        {/* KPIs */}
        {loading && !totals ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="rounded-xl h-28 animate-pulse" style={{ background: '#181818' }} />
            ))}
          </div>
        ) : totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <KpiCard
              label="Investido"
              value={fmt.brl(totals.spend)}
              icon={DollarSign}
              color="#E8001C"
            />
            <KpiCard
              label="Alcance"
              value={fmt.num(totals.reach)}
              icon={Users}
              color="#3B82F6"
            />
            <KpiCard
              label="Impressões"
              value={fmt.num(totals.impressions)}
              icon={Eye}
              color="#8B5CF6"
            />
            <KpiCard
              label="Cliques"
              value={fmt.num(totals.clicks)}
              icon={MousePointer}
              color="#F59E0B"
            />
            <KpiCard
              label="Leads"
              value={fmt.num(totals.conversions)}
              icon={Target}
              color="#22C55E"
            />
            <KpiCard
              label="CPL"
              value={cpl > 0 ? fmt.brl(cpl) : '—'}
              sub="custo por lead"
              icon={TrendingDown}
              color="#22C55E"
            />
            <KpiCard
              label="CTR"
              value={totals.impressions > 0 ? fmt.pct((totals.clicks / totals.impressions) * 100) : '—'}
              sub="taxa de clique"
              icon={TrendingUp}
              color="#F59E0B"
            />
          </div>
        )}

        {/* Tabela de campanhas */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#181818', border: '1px solid #272727' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #272727' }}>
            <h2 className="text-sm font-semibold text-white">
              Campanhas com gasto
              {!loading && <span className="ml-2 text-xs font-normal" style={{ color: '#6B7280' }}>({insights.length})</span>}
            </h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded animate-pulse" style={{ background: '#272727' }} />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="p-12 text-center text-sm" style={{ color: '#6B7280' }}>
              Nenhuma campanha com gasto no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #272727' }}>
                    {['Campanha', 'Investido', 'Alcance', 'Impressões', 'Cliques', 'CTR', 'CPM', 'Leads', 'CPL'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: '#6B7280' }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {insights.map((row, i) => {
                    const cplRow = row.conversions > 0 ? row.spend / row.conversions : 0;
                    const ctrRow = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
                    return (
                      <tr
                        key={row.campaignId}
                        style={{
                          borderBottom: i < insights.length - 1 ? '1px solid #1f1f1f' : 'none',
                          background: i % 2 === 0 ? 'transparent' : '#ffffff04',
                        }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-white font-medium truncate text-xs" title={row.campaignName}>
                            {cleanName(row.campaignName)}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>
                            {row.dateStart} → {row.dateStop}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-white whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span>{fmt.brl(row.spend)}</span>
                            <div
                              className="h-1 rounded-full"
                              style={{
                                background: '#E8001C',
                                width: `${Math.min((row.spend / insights[0].spend) * 100, 100)}%`,
                                minWidth: '4px',
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white">{fmt.num(row.reach)}</td>
                        <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{fmt.num(row.impressions)}</td>
                        <td className="px-4 py-3 text-white">{fmt.num(row.clicks)}</td>
                        <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{fmt.pct(ctrRow)}</td>
                        <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{fmt.brl(row.cpm)}</td>
                        <td className="px-4 py-3">
                          <span
                            className="font-semibold"
                            style={{ color: row.conversions > 0 ? '#22C55E' : '#6B7280' }}
                          >
                            {fmt.num(row.conversions)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ color: cplRow > 0 ? '#22C55E' : '#6B7280' }}>
                            {cplRow > 0 ? fmt.brl(cplRow) : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Linha de totais */}
                {totals && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #272727', background: '#111' }}>
                      <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#E8001C' }}>
                        Total
                      </td>
                      <td className="px-4 py-3 font-bold text-white font-mono">{fmt.brl(totals.spend)}</td>
                      <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.reach)}</td>
                      <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.impressions)}</td>
                      <td className="px-4 py-3 font-bold text-white">{fmt.num(totals.clicks)}</td>
                      <td className="px-4 py-3 font-bold text-white">
                        {totals.impressions > 0 ? fmt.pct((totals.clicks / totals.impressions) * 100) : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#6B7280' }}>—</td>
                      <td className="px-4 py-3 font-bold" style={{ color: '#22C55E' }}>{fmt.num(totals.conversions)}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: '#22C55E' }}>
                        {cpl > 0 ? fmt.brl(cpl) : '—'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
