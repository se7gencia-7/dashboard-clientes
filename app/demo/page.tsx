'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Download, Settings2, RefreshCw } from 'lucide-react';

// ── Mock Data ────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id: 'dunamis',    name: 'Dunamis Club',              type: 'leads'  },
  { id: 'livro',      name: 'Lançamento Livro Paulo',     type: 'vendas' },
  { id: 'aniversario',name: 'Aniversário E-commerce',     type: 'vendas' },
];

const PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'GA4'];

const KPI_BY_TYPE: Record<string, { label: string; value: string; trend?: string }[]> = {
  leads: [
    { label: 'Investimento',  value: 'R$ 12.450' },
    { label: 'Leads',         value: '843',         trend: '+12%' },
    { label: 'CPL',           value: 'R$ 14,77',    trend: '-8%'  },
    { label: 'CTR',           value: '3,84%',        trend: '+0,5%'},
    { label: 'Impressões',    value: '218.400',      trend: '+23%' },
    { label: 'Cliques',       value: '8.387',        trend: '+18%' },
    { label: 'Taxa de Conv.', value: '10,05%',       trend: '+2%'  },
    { label: 'CPC Médio',     value: 'R$ 1,48',      trend: '-5%'  },
  ],
  vendas: [
    { label: 'Investimento',  value: 'R$ 8.320'  },
    { label: 'Vendas',        value: '234',         trend: '+34%' },
    { label: 'Faturamento',   value: 'R$ 87.480',   trend: '+41%' },
    { label: 'ROAS',          value: '10,5x',        trend: '+1,2x'},
    { label: 'CPA',           value: 'R$ 35,55',    trend: '-12%' },
    { label: 'Ticket Médio',  value: 'R$ 374',      trend: '+5%'  },
    { label: 'CTR',           value: '4,2%',         trend: '+0,3%'},
    { label: 'Conversões',    value: '234',          trend: '+34%' },
  ],
};

const PERFORMANCE_DATA = [
  { date:'01/06', custo:420, impressoes:8200,  cliques:310, conversoes:28 },
  { date:'02/06', custo:380, impressoes:7800,  cliques:290, conversoes:24 },
  { date:'03/06', custo:450, impressoes:9100,  cliques:340, conversoes:31 },
  { date:'04/06', custo:510, impressoes:10200, cliques:390, conversoes:38 },
  { date:'05/06', custo:390, impressoes:7900,  cliques:300, conversoes:26 },
  { date:'06/06', custo:620, impressoes:12400, cliques:470, conversoes:45 },
  { date:'07/06', custo:480, impressoes:9600,  cliques:360, conversoes:33 },
  { date:'08/06', custo:720, impressoes:14400, cliques:550, conversoes:52 },
  { date:'09/06', custo:560, impressoes:11200, cliques:420, conversoes:40 },
  { date:'10/06', custo:640, impressoes:12800, cliques:490, conversoes:46 },
  { date:'11/06', custo:590, impressoes:11800, cliques:450, conversoes:43 },
  { date:'12/06', custo:680, impressoes:13600, cliques:520, conversoes:49 },
  { date:'13/06', custo:720, impressoes:14400, cliques:550, conversoes:52 },
  { date:'14/06', custo:590, impressoes:11800, cliques:450, conversoes:43 },
  { date:'15/06', custo:840, impressoes:16800, cliques:640, conversoes:61 },
  { date:'16/06', custo:760, impressoes:15200, cliques:580, conversoes:55 },
  { date:'17/06', custo:680, impressoes:13600, cliques:520, conversoes:49 },
  { date:'18/06', custo:590, impressoes:11800, cliques:450, conversoes:43 },
];

const METRIC_LINES = [
  { key:'custo',      label:'Custo',       color:'#EF4444' },
  { key:'impressoes', label:'Impressões',  color:'#8B5CF6' },
  { key:'cliques',    label:'Cliques',     color:'#3B82F6' },
  { key:'conversoes', label:'Conversões',  color:'#10B981' },
];

const CAMPAIGNS: Record<string, any[]> = {
  dunamis: [
    { name:'DUN | [TOPO] Interesse - Geral',            status:'ATIVO',   spend:'R$ 3.240', leads:218, cpl:'R$ 14,86', ctr:'3,2%' },
    { name:'DUN | [MEIO] Retargeting - Engajados',      status:'ATIVO',   spend:'R$ 2.180', leads:187, cpl:'R$ 11,66', ctr:'4,8%' },
    { name:'DUN | [FUNDO] Lookalike - Compradores',     status:'ATIVO',   spend:'R$ 4.120', leads:312, cpl:'R$ 13,21', ctr:'3,9%' },
    { name:'DUN | [TOPO] Interesse - Cristãos',         status:'PAUSADO', spend:'R$ 2.910', leads:126, cpl:'R$ 23,10', ctr:'2,1%' },
  ],
  livro: [
    { name:'LIV | [CONV] Compra Direta - LAL',          status:'ATIVO',   spend:'R$ 2.840', vendas:98,  cpa:'R$ 28,98', roas:'12,3x' },
    { name:'LIV | [CONV] Retargeting - Visitantes',     status:'ATIVO',   spend:'R$ 1.960', vendas:87,  cpa:'R$ 22,53', roas:'14,8x' },
    { name:'LIV | [CONV] Interesse - Livros',           status:'ATIVO',   spend:'R$ 3.520', vendas:49,  cpa:'R$ 71,84', roas:'5,2x'  },
  ],
  aniversario: [
    { name:'ANI | [CONV] Aniversário - Compradores',    status:'ATIVO',   spend:'R$ 3.100', vendas:112, cpa:'R$ 27,68', roas:'11,2x' },
    { name:'ANI | [CONV] Retargeting - Carrinho',       status:'ATIVO',   spend:'R$ 2.240', vendas:89,  cpa:'R$ 25,17', roas:'13,4x' },
    { name:'ANI | [TOPO] Novos Públicos',               status:'PAUSADO', spend:'R$ 1.800', vendas:33,  cpa:'R$ 54,55', roas:'4,8x'  },
  ],
};

const BEST_ADS = [
  { name:'AD01', cpr:'R$ 1,37', imp:12453, cliques:321, conv:34, ctr:'7,28%' },
  { name:'AD02', cpr:'R$ 2,73', imp:9823,  cliques:245, conv:28, ctr:'5,67%' },
  { name:'AD03', cpr:'R$ 3,07', imp:8234,  cliques:198, conv:22, ctr:'4,92%' },
  { name:'AD04', cpr:'R$ 7,34', imp:7102,  cliques:156, conv:18, ctr:'4,12%' },
];

const DEVICE_DATA = [
  { name:'Mobile',  value:94.6, color:'#2563EB' },
  { name:'Desktop', value:5.4,  color:'#10B981' },
];

const FUNNEL_BY_TYPE: Record<string, any[]> = {
  leads: [
    { label:'Impressões',        value:'218.400', cost:'R$ 0,06', w:'100%', color:'#3B82F6' },
    { label:'Cliques',           value:'8.387',   cost:'R$ 1,48', w:'55%',  color:'#2563EB', pct:'3,8% Conversão' },
    { label:'Leads',             value:'843',     cost:'R$ 14,77',w:'30%',  color:'#1D4ED8', pct:'10,0% Conversão' },
  ],
  vendas: [
    { label:'Impressões',        value:'184.200', cost:'R$ 0,05', w:'100%', color:'#3B82F6' },
    { label:'Cliques',           value:'7.420',   cost:'R$ 1,12', w:'55%',  color:'#2563EB', pct:'4,0% Conversão' },
    { label:'Vendas',            value:'234',     cost:'R$ 35,55',w:'30%',  color:'#1D4ED8', pct:'3,2% Conversão' },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DemoDashboard() {
  const [activeProject,  setActiveProject]  = useState('dunamis');
  const [activePlatform, setActivePlatform] = useState('Meta Ads');
  const [activeMetrics,  setActiveMetrics]  = useState(['custo','cliques','conversoes']);

  const project   = PROJECTS.find(p => p.id === activeProject)!;
  const kpis      = KPI_BY_TYPE[project.type];
  const campaigns = CAMPAIGNS[activeProject];
  const funnel    = FUNNEL_BY_TYPE[project.type];

  const toggleMetric = (key: string) =>
    setActiveMetrics(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">

          {/* Row 1 */}
          <div className="flex items-center justify-between gap-4 py-4">

            {/* Logo + cliente */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-0.5">
                <span className="text-xl font-black tracking-tight text-black">Se7</span>
                <span className="w-2 h-2 rounded-full bg-red-600 mb-3 ml-0.5" />
                <span className="text-xl font-black tracking-tight text-black">Gência</span>
              </div>
              <div className="w-px h-5 bg-gray-300" />
              <span className="text-base font-semibold text-gray-800">4Ventos</span>
            </div>

            {/* Project selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-1 max-w-xl">
              {PROJECTS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveProject(p.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeProject === p.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition">
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">
                <Download className="w-3.5 h-3.5" />
                Baixar PDF
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition border border-gray-200">
                <Settings2 className="w-3.5 h-3.5" />
                Configurar
              </button>
            </div>
          </div>

          {/* Row 2 — Platforms */}
          <div className="flex -mb-px">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${
                  activePlatform === p
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">

        {/* ── KPI CARDS ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 leading-tight">{kpi.label}</span>
                {kpi.trend && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    kpi.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {kpi.trend}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ── PERFORMANCE CHART ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-gray-900">Performance</h2>
            <span className="text-xs text-gray-400">01/06/2025 → 18/06/2025</span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={PERFORMANCE_DATA} margin={{ top:5, right:10, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize:11, fill:'#9CA3AF' }} />
              <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid #E5E7EB' }} />
              {METRIC_LINES.filter(m => activeMetrics.includes(m.key)).map(m => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={{ r:3 }}
                  activeDot={{ r:5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {METRIC_LINES.map(m => (
              <button
                key={m.key}
                onClick={() => toggleMetric(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeMetrics.includes(m.key)
                    ? 'border-transparent text-white'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
                style={activeMetrics.includes(m.key) ? { backgroundColor: m.color } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── FUNIL + DEMOGRÁFICO ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Funil */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 mb-6">Funil de Conversão</h2>
            <div className="flex flex-col items-center gap-0 space-y-1">
              {funnel.map((step, i) => (
                <div key={i} className="w-full">
                  {step.pct && (
                    <p className="text-center text-xs text-gray-400 my-1.5">{step.pct}</p>
                  )}
                  <div
                    className="rounded-xl p-4 text-white mx-auto text-center"
                    style={{ width: step.w, backgroundColor: step.color }}
                  >
                    <p className="text-xs font-semibold opacity-80">{step.label}</p>
                    <p className="text-2xl font-bold">{step.value}</p>
                    <p className="text-xs opacity-70">{step.cost} / unid.</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 bg-gray-50 rounded-lg text-center">
              <span className="text-xs text-gray-500">Valor Investido: </span>
              <span className="text-sm font-bold text-gray-900">
                {project.type === 'leads' ? 'R$ 12.450' : 'R$ 8.320'}
              </span>
            </div>
          </div>

          {/* Demográfico */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-gray-900">Dados Demográficos</h2>
              <div className="flex gap-1">
                {['Dispositivo','Horário'].map(t => (
                  <button
                    key={t}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={DEVICE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {DEVICE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-8 mt-2 mb-4">
              {DEVICE_DATA.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center gap-1.5 mb-1 justify-center">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-500">{d.name}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{d.value}%</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { rank:'#1', name:'Mobile',  spend:'R$ 11.778', imp:'206.892 impressões' },
                { rank:'#2', name:'Desktop', spend:'R$ 672',    imp:'11.508 impressões'  },
              ].map((d, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{d.rank} {d.name}</p>
                  <p className="text-sm font-bold text-gray-900">{d.spend}</p>
                  <p className="text-xs text-gray-400">{d.imp}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CAMPANHAS ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Campanhas — {project.name}</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {campaigns.length} campanhas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Campanha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Investimento</th>
                  {project.type === 'leads' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Leads</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">CPL</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">CTR</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendas</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">CPA</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">ROAS</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'ATIVO'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{c.spend}</td>
                    {project.type === 'leads' ? (
                      <>
                        <td className="px-6 py-4 text-gray-700">{c.leads}</td>
                        <td className="px-6 py-4 text-gray-700">{c.cpl}</td>
                        <td className="px-6 py-4 text-gray-700">{c.ctr}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-gray-700">{c.vendas}</td>
                        <td className="px-6 py-4 text-gray-700">{c.cpa}</td>
                        <td className="px-6 py-4 font-bold text-green-600">{c.roas}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MELHORES ANÚNCIOS ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Melhores Anúncios</h2>
            <div className="flex gap-2 flex-wrap">
              {['Menor CPR','Maior CTR','Mais Conversões','Maior ROAS'].map(f => (
                <button
                  key={f}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition first:bg-red-600 first:text-white"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {BEST_ADS.map((ad, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition group">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-44 flex items-center justify-center relative">
                  <span className="text-gray-400 text-sm font-semibold">{ad.name}</span>
                  <span className="absolute top-2 left-2 bg-white text-xs font-bold px-2 py-1 rounded-lg shadow text-gray-700">
                    #{i + 1}
                  </span>
                  <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {ad.cpr}
                  </span>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Impressões</span>
                    <span className="font-semibold text-gray-700">{ad.imp.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Cliques</span>
                    <span className="font-semibold text-gray-700">{ad.cliques}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">CTR</span>
                    <span className="font-semibold text-blue-600">{ad.ctr}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Conversões</span>
                    <span className="font-semibold text-green-600">{ad.conv}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Se7.Gência Dashboard · Dados atualizados em 18/06/2025 16:06 · Versão demo
        </p>

      </main>
    </div>
  );
}
