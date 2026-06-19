'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { Download, Settings2, ChevronDown, Calendar, Filter } from 'lucide-react';

// ── Palette ──────────────────────────────────────────────────────────────────
const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';
const ORANGE = '#F97316';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const PROJECTS = [
  { id:'a', name:'Projeto A', type:'vendas' },
  { id:'b', name:'Projeto B', type:'leads'  },
  { id:'c', name:'Projeto C', type:'vendas' },
];

const KPIS: Record<string, { label:string; value:string; trend:string|null; bar:number; color:string }[]> = {
  vendas: [
    { label:'Investimento',  value:'R$ 43.825',  trend:null,    bar:0.72, color:MUTED   },
    { label:'Compras',       value:'363',         trend:'+12%',  bar:0.63, color:ORANGE  },
    { label:'Faturamento',   value:'R$ 25.642',  trend:'+8%',   bar:0.45, color:ORANGE  },
    { label:'ROAS',          value:'0,59',        trend:'-0,1',  bar:0.30, color:ORANGE  },
    { label:'Checkouts',     value:'568',         trend:'+5%',   bar:0.55, color:ORANGE  },
    { label:'CAC',           value:'R$ 120,73',  trend:null,    bar:0.40, color:MUTED   },
    { label:'CTR',           value:'4,2%',        trend:'+0,3%', bar:0.60, color:GREEN   },
    { label:'CPC Médio',     value:'R$ 1,48',    trend:'-8%',   bar:0.70, color:GREEN   },
  ],
  leads: [
    { label:'Leads Totais',   value:'19.608',     trend:'+98%',  bar:0.98, color:ORANGE  },
    { label:'Resp. Pesquisa', value:'7.471',       trend:'+62%',  bar:0.62, color:ORANGE  },
    { label:'Memb. WhatsApp', value:'9.131',       trend:'+50%',  bar:0.50, color:ORANGE  },
    { label:'Leads Pagos',    value:'17.415',      trend:'+99%',  bar:0.99, color:GREEN   },
    { label:'Leads Orgânicos',value:'2.118',       trend:'+84%',  bar:0.84, color:GREEN   },
    { label:'Leads Quentes',  value:'10.669',      trend:'+106%', bar:1.00, color:GREEN   },
    { label:'CPL',            value:'R$ 14,77',   trend:'-8%',   bar:0.80, color:GREEN   },
    { label:'Não Mapeados',   value:'25',          trend:'+5%',   bar:0.05, color:MUTED   },
  ],
};

const PERF_DATA = [
  {date:'01/06',compras:22, fat:1222, inv:2458, leads:162 },
  {date:'03/06',compras:17, fat:3047, inv:1969, leads:167 },
  {date:'05/06',compras:14, fat:650,  inv:1915, leads:316 },
  {date:'07/06',compras:19, fat:1165, inv:2433, leads:559 },
  {date:'09/06',compras:44, fat:2215, inv:4851, leads:737 },
  {date:'11/06',compras:47, fat:2353, inv:4196, leads:1061},
  {date:'13/06',compras:33, fat:1922, inv:4920, leads:1396},
  {date:'15/06',compras:25, fat:1305, inv:4468, leads:2171},
  {date:'17/06',compras:30, fat:1507, inv:3599, leads:2056},
  {date:'19/06',compras:21, fat:1147, inv:2940, leads:1069},
  {date:'21/06',compras:12, fat:2868, inv:1618, leads:981 },
  {date:'23/06',compras:8,  fat:362,  inv:615,  leads:1040},
  {date:'25/06',compras:9,  fat:2919, inv:496,  leads:1092},
  {date:'27/06',compras:10, fat:499,  inv:663,  leads:1238},
  {date:'29/06',compras:8,  fat:296,  inv:697,  leads:862 },
];

const DAILY = [
  {date:'31/05',inv:2458.10,fat:1222.46,compras:22,roas:0.50,ticket:'R$ 55,57'},
  {date:'30/05',inv:1969.11,fat:3047.00,compras:17,roas:1.55,ticket:'R$ 179,24'},
  {date:'29/05',inv:1915.65,fat:650.47, compras:14,roas:0.34,ticket:'R$ 46,46'},
  {date:'28/05',inv:2433.96,fat:1165.92,compras:19,roas:0.48,ticket:'R$ 61,36'},
  {date:'27/05',inv:3939.76,fat:1423.66,compras:26,roas:0.36,ticket:'R$ 54,76'},
  {date:'26/05',inv:4851.48,fat:2215.10,compras:44,roas:0.46,ticket:'R$ 50,34'},
  {date:'25/05',inv:4196.48,fat:2353.47,compras:47,roas:0.56,ticket:'R$ 50,07'},
  {date:'24/05',inv:4920.93,fat:1922.47,compras:33,roas:0.39,ticket:'R$ 58,26'},
  {date:'23/05',inv:4468.85,fat:1305.16,compras:25,roas:0.29,ticket:'R$ 52,21'},
  {date:'22/05',inv:3599.20,fat:1507.60,compras:30,roas:0.42,ticket:'R$ 50,25'},
];
const MAX_INV = Math.max(...DAILY.map(r => r.inv));

const CREATIVES = [
  {name:'AD78 - [VÍDEO] olha o que...',   ctr:'0,92%', compras:5,  inv:'R$ 868,59', roas:0.54, fat:'468,18'},
  {name:'AD108 - [ESTÁTICO] por apenas',  ctr:'1,00%', compras:5,  inv:'R$ 304,47', roas:1.04, fat:'316,43'},
  {name:'AD107 - [VÍDEO] Se R você...',   ctr:'1,65%', compras:4,  inv:'R$ 167,28', roas:0.91, fat:'151,65'},
  {name:'AD100 - [VÍDEO] são apenas...',  ctr:'1,59%', compras:2,  inv:'R$ 276,97', roas:0.27, fat:'74,00' },
  {name:'AD91 - [VÍDEO] o que você...',   ctr:'2,10%', compras:6,  inv:'R$ 520,14', roas:1.82, fat:'948,00'},
  {name:'AD013 - [VÍDEO] Venda direta',   ctr:'0,88%', compras:3,  inv:'R$ 198,33', roas:0.63, fat:'125,00'},
];

const AUDIENCES = [
  {name:'00 - [AUTO] Env 180D | 18-...',  vendas:5,  inv:'R$ 868,59',  roas:0.54, fat:'468,18'},
  {name:'00 - [AUTO] Env + Vv Todo...',   vendas:4,  inv:'R$ 233,79',  roas:0.65, fat:'151,65'},
  {name:'00 - [AUTO] Pageview+Ch...',     vendas:2,  inv:'R$ 296,95',  roas:0.25, fat:'74,00' },
  {name:'00 - [IG] Advatange+| H 30...',  vendas:11, inv:'R$ 1.046,32',roas:4.29, fat:'528,63'},
  {name:'00 - [AUTO] Lista leads qu...',  vendas:0,  inv:'R$ 12,45',   roas:0.00, fat:'0,00'  },
  {name:'00 - [AUTO] Env 180D | 18-b',   vendas:4,  inv:'R$ 511,46',  roas:0.41, fat:'211,00'},
  {name:'00 - [AUTO] Env + Vv Tod-2',    vendas:3,  inv:'R$ 350,72',  roas:0.32, fat:'111,00'},
  {name:'00 - [IG] Advatange+ H 30-2',   vendas:7,  inv:'R$ 868,19',  roas:5.64, fat:'388,00'},
];

const PIE_SCORING = [
  {name:'Frio',        value:32.7, color:'#3B82F6'},
  {name:'Morno',       value:32.0, color:'#60A5FA'},
  {name:'Interessado', value:18.6, color:'#EC4899'},
  {name:'Muito Quente',value:10.4, color:'#F97316'},
  {name:'Quente',      value:6.3,  color:'#EAB308'},
];

const DEMO_CHARTS = [
  { title:'Sexo',        data:[{name:'Masculino',value:67.4,color:'#3B82F6'},{name:'Feminino',value:32.6,color:'#EC4899'}]},
  { title:'Idade',       data:[{name:'45-54',value:32.2,color:'#3B82F6'},{name:'55-64',value:18.4,color:'#60A5FA'},{name:'25-34',value:21.1,color:'#EC4899'},{name:'35-44',value:18.2,color:'#F97316'},{name:'65+',value:10.1,color:'#EAB308'}]},
  { title:'Renda Mensal',data:[{name:'R$2-5k',value:39.5,color:'#3B82F6'},{name:'R$5-10k',value:27.2,color:'#60A5FA'},{name:'Até R$2k',value:20.0,color:'#EC4899'},{name:'R$10-20k',value:9.8,color:'#F97316'},{name:'+R$20k',value:3.5,color:'#EAB308'}]},
  { title:'Estado Civil', data:[{name:'Casado(a)',value:53.9,color:'#3B82F6'},{name:'Solteiro(a)',value:20.1,color:'#60A5FA'},{name:'Divorciado(a)',value:12.1,color:'#EC4899'},{name:'Viúvo(a)',value:13.9,color:'#F97316'}]},
  { title:'Lead Scoring', data:PIE_SCORING },
  { title:'Já Investe?',  data:[{name:'Não',value:86.6,color:'#3B82F6'},{name:'Sim',value:13.4,color:'#EC4899'}]},
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Bar2({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-white text-xs tabular-nums whitespace-nowrap">
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: RED }} />
      </div>
    </div>
  );
}

function GreenCell({ v }: { v: number }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${v >= 25 ? 'text-green-400' : 'text-white'}`}
      style={v >= 25 ? { backgroundColor: 'rgba(34,197,94,0.15)' } : {}}>
      {v}
    </span>
  );
}

function RoasCell({ v }: { v: number }) {
  return (
    <span className={`text-xs font-semibold ${v >= 1 ? 'text-green-400' : 'text-white'}`}>
      {v.toFixed(2)}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoDashboard() {
  const [proj,    setProj]    = useState('a');
  const [section, setSection] = useState('overview');

  const project  = PROJECTS.find(p => p.id === proj)!;
  const kpis     = KPIS[project.type];
  const isLeads  = project.type === 'leads';

  const chartLines = isLeads
    ? [{key:'leads', label:'Leads', color:'#fff'},{key:'inv', label:'CPL Real', color:ORANGE}]
    : [{key:'compras', label:'Compras', color:'#fff'},{key:'fat', label:'Faturamento', color:'#3B82F6'}];

  const SECTIONS = [
    { id:'overview',    label: isLeads ? 'Leads' : 'Vendas'  },
    { id:'criativos',  label:'Criativos'  },
    { id:'publicos',   label:'Públicos'   },
    { id:'demografico',label:'Demográfico'},
  ];

  const ttStyle = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: '#fff' };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4 justify-between flex-wrap">

          {/* Logo */}
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-2xl font-black tracking-tight">Se7</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 mb-4 mx-0.5" />
            <span className="text-2xl font-black tracking-tight">Gência</span>
          </div>

          {/* Project tabs */}
          <div className="flex rounded-lg overflow-hidden shrink-0" style={{ border: `1px solid ${BORDER}` }}>
            {PROJECTS.map(p => (
              <button key={p.id} onClick={() => { setProj(p.id); setSection('overview'); }}
                className="px-4 py-2 text-sm font-medium transition-all"
                style={{ backgroundColor: proj === p.id ? RED : 'transparent', color: proj === p.id ? '#fff' : MUTED }}>
                {p.name}
              </button>
            ))}
          </div>

          {/* Date + actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: '#fff' }}>
              <Calendar className="w-4 h-4" style={{ color: MUTED }} />
              <span>01 jun – 30 jun 2025</span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: MUTED }} />
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
              style={{ borderColor: section === s.id ? RED : 'transparent', color: section === s.id ? RED : MUTED }}>
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

        {/* ── KPI ROW ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 lg:grid-cols-8 rounded-lg overflow-hidden"
          style={{ border: `1px solid ${BORDER}` }}>
          {kpis.map((kpi, i) => (
            <div key={i} className="p-4" style={{ backgroundColor: CARD, borderRight: i < kpis.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <p className="text-xs mb-1" style={{ color: MUTED }}>{kpi.label}</p>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
              {kpi.trend && <p className="text-xs font-semibold mt-0.5" style={{ color: kpi.color }}>{kpi.trend}</p>}
              <div className="h-1 rounded-full mt-3" style={{ backgroundColor: BORDER }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${kpi.bar * 100}%`, backgroundColor: kpi.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {section === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Line chart */}
            <div className="rounded-lg p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-4 mb-1 flex-wrap">
                {chartLines.map(l => (
                  <div key={l.key} className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                    <span className="w-6 h-px inline-block" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
              <h3 className="text-white text-sm font-semibold mb-4">
                {isLeads ? 'Relação leads por dia' : 'Relação vendas × Faturamento por dia'}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={PERF_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:MUTED }} />
                  <YAxis tick={{ fontSize:10, fill:MUTED }} />
                  <Tooltip contentStyle={ttStyle} />
                  {chartLines.map(l => (
                    <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Daily report table */}
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">
                  {isLeads ? 'Relatório de leads por dia' : 'Relatório de vendas por dia'}
                </h3>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 320 }}>
                <table className="w-full text-xs">
                  <thead className="sticky top-0" style={{ backgroundColor: '#1F1F1F' }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {['Data','Investimento','Faturamento','Compras','ROAS','Ticket Médio'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAILY.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-4 py-3" style={{ color: MUTED }}>{row.date}</td>
                        <td className="px-4 py-3"><Bar2 value={row.inv} max={MAX_INV} /></td>
                        <td className="px-4 py-3 text-white tabular-nums">{row.fat.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                        <td className="px-4 py-3"><GreenCell v={row.compras} /></td>
                        <td className="px-4 py-3"><RoasCell v={row.roas} /></td>
                        <td className="px-4 py-3 text-white">{row.ticket}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor:'#1F1F1F' }}>
                      <td className="px-4 py-3 font-bold text-white">Total geral</td>
                      <td className="px-4 py-3 font-bold text-white">R$ 43.825,23</td>
                      <td className="px-4 py-3 font-bold text-white">25.642,61</td>
                      <td className="px-4 py-3 font-bold text-white">363</td>
                      <td className="px-4 py-3 font-bold text-white">0,59</td>
                      <td className="px-4 py-3 font-bold text-white">R$ 70,64</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CRIATIVOS ─────────────────────────────────────────────────────── */}
        {section === 'criativos' && (
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold">Relatório de criativos</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: MUTED }}>1–6 / 1273</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs"
                  style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
                  <Filter className="w-3 h-3" /> Filtros
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ backgroundColor:'#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Prévia','Nomenclatura','CTR Link','Compra','Investimento','ROAS','Faturamento'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CREATIVES.map((c, i) => (
                    <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-3">
                        <div className="w-16 h-16 rounded flex items-center justify-center text-xs font-bold"
                          style={{ background:'linear-gradient(135deg,#1f1f1f,#2a2a2a)', color: MUTED }}>
                          AD
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white font-medium max-w-[180px]">
                        <span className="line-clamp-2">{c.name}</span>
                      </td>
                      <td className="px-4 py-3 text-white">{c.ctr}</td>
                      <td className="px-4 py-3"><GreenCell v={c.compras} /></td>
                      <td className="px-4 py-3">
                        <span className="text-white font-semibold">{c.inv}</span>
                      </td>
                      <td className="px-4 py-3"><RoasCell v={c.roas} /></td>
                      <td className="px-4 py-3 text-white">{c.fat}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor:'#1F1F1F' }}>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 font-bold text-white">Total geral</td>
                    <td className="px-4 py-3 font-bold text-white">1,03%</td>
                    <td className="px-4 py-3 font-bold text-white">363</td>
                    <td className="px-4 py-3 font-bold text-white">R$ 43.825,23</td>
                    <td className="px-4 py-3 font-bold text-white">0,59</td>
                    <td className="px-4 py-3 font-bold text-white">25.642,61</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PÚBLICOS ──────────────────────────────────────────────────────── */}
        {section === 'publicos' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Table */}
            <div className="lg:col-span-3 rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <h3 className="text-white text-sm font-semibold">Relatório de públicos</h3>
                <span className="text-xs" style={{ color: MUTED }}>1–8 / 217</span>
              </div>
              <table className="w-full text-xs">
                <thead style={{ backgroundColor:'#1F1F1F' }}>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Público','Vendas','Investimento','ROAS','Faturamento'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIENCES.map((a, i) => (
                    <tr key={i} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="px-4 py-3 text-white max-w-[200px]">
                        <span className="truncate block">{a.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{a.vendas}</span>
                          {a.vendas > 0 && (
                            <div className="h-2.5 rounded-sm" style={{ width: `${a.vendas * 5}px`, backgroundColor: RED }} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{a.inv}</td>
                      <td className="px-4 py-3"><RoasCell v={a.roas} /></td>
                      <td className="px-4 py-3 text-white">{a.fat}</td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor:'#1F1F1F' }}>
                    <td className="px-4 py-3 font-bold text-white">Total geral</td>
                    <td className="px-4 py-3 font-bold text-white">363</td>
                    <td className="px-4 py-3 font-bold text-white">R$ 43.825,23</td>
                    <td className="px-4 py-3 font-bold text-white">0,59</td>
                    <td className="px-4 py-3 font-bold text-white">25.642,61</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Lead scoring */}
            <div className="lg:col-span-2 rounded-lg p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <h3 className="text-white text-sm font-semibold mb-4">Lead scoring</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={PIE_SCORING} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ name, value }) => `${value}%`} labelLine={{ stroke: MUTED }}>
                    {PIE_SCORING.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend formatter={v => <span style={{ color: MUTED, fontSize: 11 }}>{v}</span>} />
                  <Tooltip contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DEMOGRÁFICO ───────────────────────────────────────────────────── */}
        {section === 'demografico' && (
          <>
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              {['Campanha','Origem','Posicionamento','Criativo'].map(f => (
                <button key={f} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: MUTED }}>
                  {f} <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {DEMO_CHARTS.map((chart, i) => (
                <div key={i} className="rounded-lg p-5" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                  <h3 className="text-white text-sm font-semibold mb-4">{chart.title}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chart.data} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {chart.data.map((e, j) => <Cell key={j} fill={e.color} />)}
                      </Pie>
                      <Legend formatter={v => <span style={{ color: MUTED, fontSize: 10 }}>{v}</span>} />
                      <Tooltip contentStyle={ttStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-center text-xs pb-6" style={{ color: MUTED }}>
          Se7.Gência · Versão demonstração · Dados reais após configuração das integrações
        </p>
      </main>
    </div>
  );
}
