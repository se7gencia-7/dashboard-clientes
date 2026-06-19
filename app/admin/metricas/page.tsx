'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Info, Database, TrendingUp, Users } from 'lucide-react';
import NextLink from 'next/link';

const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';
const BLUE   = '#3B82F6';

// ── Types ─────────────────────────────────────────────────────────────────────

type Source = 'meta' | 'google' | 'tiktok' | 'ga4' | 'crm' | 'custom';

interface Metric {
  id: string;
  name: string;
  description: string;
  source: Source;
  category: 'performance' | 'audience' | 'financial' | 'crm';
  enabled: boolean;
  isCrm?: boolean;
  isCustom?: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const CLIENTS = [
  { id:'c1', name:'4Ventos'         },
  { id:'c2', name:'Studio Bloom'    },
  { id:'c3', name:'Max Atacarejo'   },
];

const PROJECTS: Record<string, {id:string; name:string; type:string}[]> = {
  c1: [
    { id:'p1', name:'Dunamis Club',          type:'vendas' },
    { id:'p2', name:'Lançamento do Livro',   type:'leads'  },
    { id:'p3', name:'Aniversário E-commerce',type:'vendas' },
  ],
  c2: [
    { id:'p4', name:'Inverno 2025',  type:'vendas' },
    { id:'p5', name:'Black Friday',  type:'vendas' },
  ],
  c3: [
    { id:'p6', name:'Campanha FGTS', type:'leads' },
  ],
};

const SOURCE_LABELS: Record<Source, string> = {
  meta:   'Meta',
  google: 'Google',
  tiktok: 'TikTok',
  ga4:    'GA4',
  crm:    'CRM',
  custom: 'Customizada',
};

const SOURCE_COLORS: Record<Source, string> = {
  meta:   '#1877F2',
  google: '#34A853',
  tiktok: '#EE1D52',
  ga4:    '#F97316',
  crm:    '#8B5CF6',
  custom: '#6B7280',
};

const DEFAULT_METRICS: Metric[] = [
  // Performance
  { id:'m1',  name:'Investimento Total',   description:'Valor total gasto em anúncios',          source:'meta',   category:'performance', enabled:true  },
  { id:'m2',  name:'Impressões',           description:'Número total de impressões',              source:'meta',   category:'performance', enabled:false },
  { id:'m3',  name:'Cliques no Link',      description:'Cliques diretos no link do anúncio',     source:'meta',   category:'performance', enabled:true  },
  { id:'m4',  name:'CTR (Link)',           description:'Taxa de cliques no link',                 source:'meta',   category:'performance', enabled:true  },
  { id:'m5',  name:'CPC Médio',            description:'Custo por clique médio',                  source:'meta',   category:'performance', enabled:true  },
  { id:'m6',  name:'CPM',                  description:'Custo por mil impressões',                source:'meta',   category:'performance', enabled:false },
  { id:'m7',  name:'Alcance',              description:'Pessoas únicas alcançadas',               source:'meta',   category:'audience',    enabled:true  },
  { id:'m8',  name:'Frequência',           description:'Média de vezes que cada pessoa viu',      source:'meta',   category:'audience',    enabled:false },
  // Conversão
  { id:'m9',  name:'Compras',              description:'Número de compras realizadas',             source:'meta',   category:'financial',   enabled:true  },
  { id:'m10', name:'Faturamento (Meta)',   description:'Valor de faturamento reportado pelo Meta', source:'meta',   category:'financial',   enabled:true  },
  { id:'m11', name:'ROAS',                 description:'Retorno sobre investimento em anúncios',   source:'meta',   category:'financial',   enabled:true  },
  { id:'m12', name:'CAC',                  description:'Custo de aquisição de cliente',            source:'meta',   category:'financial',   enabled:true  },
  { id:'m13', name:'Checkouts Iniciados',  description:'Número de checkouts iniciados',            source:'meta',   category:'financial',   enabled:true  },
  { id:'m14', name:'Adições ao Carrinho',  description:'Número de adições ao carrinho',            source:'meta',   category:'financial',   enabled:false },
  // Google
  { id:'m15', name:'Cliques (Google)',     description:'Cliques nas campanhas do Google Ads',      source:'google', category:'performance', enabled:false },
  { id:'m16', name:'Conversões (Google)', description:'Conversões rastreadas pelo Google',         source:'google', category:'financial',   enabled:false },
  { id:'m17', name:'CPA (Google)',         description:'Custo por aquisição no Google',            source:'google', category:'financial',   enabled:false },
  // GA4
  { id:'m18', name:'Sessões (GA4)',        description:'Sessões no site via Google Analytics',     source:'ga4',    category:'audience',    enabled:false },
  { id:'m19', name:'Usuários Ativos',      description:'Usuários ativos no período',               source:'ga4',    category:'audience',    enabled:false },
  { id:'m20', name:'Taxa de Rejeição',     description:'Taxa de rejeição das sessões',             source:'ga4',    category:'performance', enabled:false },
  // CRM (placeholder)
  { id:'m21', name:'Leads Qualificados',   description:'Leads classificados como quentes no CRM',  source:'crm',    category:'crm',         enabled:false, isCrm:true },
  { id:'m22', name:'Oportunidades Abertas',description:'Oportunidades abertas no funil do CRM',    source:'crm',    category:'crm',         enabled:false, isCrm:true },
  { id:'m23', name:'Deals Fechados',       description:'Negócios fechados no período',              source:'crm',    category:'crm',         enabled:false, isCrm:true },
  { id:'m24', name:'Receita CRM',          description:'Receita real registrada no CRM',           source:'crm',    category:'crm',         enabled:false, isCrm:true },
];

const CATEGORY_ICONS = {
  performance: TrendingUp,
  audience:    Users,
  financial:   Database,
  crm:         Database,
};

const CATEGORY_LABELS = {
  performance: 'Performance',
  audience:    'Audiência',
  financial:   'Financeiro / Conversão',
  crm:         'CRM',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminMetricas() {
  const [clientId,  setClientId]  = useState('c1');
  const [projectId, setProjectId] = useState('p1');
  const [metrics,   setMetrics]   = useState<Metric[]>(DEFAULT_METRICS);
  const [newName,   setNewName]   = useState('');
  const [newDesc,   setNewDesc]   = useState('');
  const [showNew,   setShowNew]   = useState(false);
  const [activeTab, setActiveTab] = useState<'performance'|'audience'|'financial'|'crm'>('performance');

  const projects = PROJECTS[clientId] ?? [];

  function toggleMetric(id: string) {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  }

  function addCustom() {
    if (!newName.trim()) return;
    setMetrics(prev => [...prev, {
      id:       `custom-${Date.now()}`,
      name:     newName.trim(),
      description: newDesc.trim() || 'Métrica customizada',
      source:   'custom',
      category: 'performance',
      enabled:  true,
      isCustom: true,
    }]);
    setNewName('');
    setNewDesc('');
    setShowNew(false);
  }

  function removeCustom(id: string) {
    setMetrics(prev => prev.filter(m => m.id !== id));
  }

  const enabledCount = metrics.filter(m => m.enabled).length;
  const catMetrics   = metrics.filter(m => m.category === activeTab);

  const TABS = (['performance','audience','financial','crm'] as const).map(t => ({
    id: t,
    label: CATEGORY_LABELS[t],
    count: metrics.filter(m => m.category === t && m.enabled).length,
    total: metrics.filter(m => m.category === t).length,
  }));

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <NextLink href="/admin/dashboard"
            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: MUTED }}>
            <ArrowLeft className="w-4 h-4" /> Painel
          </NextLink>
          <span style={{ color: BORDER }}>/</span>
          <h1 className="text-white text-sm font-semibold">Configuração de Métricas</h1>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── LEFT: selectors ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Client */}
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Cliente</p>
            {CLIENTS.map(c => (
              <button key={c.id}
                onClick={() => { setClientId(c.id); setProjectId(PROJECTS[c.id][0].id); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: clientId === c.id ? 'rgba(232,0,28,0.15)' : 'transparent',
                  color: clientId === c.id ? RED : '#fff',
                  border: clientId === c.id ? `1px solid rgba(232,0,28,0.4)` : '1px solid transparent',
                }}>
                {c.name}
              </button>
            ))}
          </div>

          {/* Project */}
          <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Projeto</p>
            {projects.map(p => (
              <button key={p.id}
                onClick={() => setProjectId(p.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: projectId === p.id ? 'rgba(232,0,28,0.15)' : 'transparent',
                  color: projectId === p.id ? RED : '#fff',
                  border: projectId === p.id ? `1px solid rgba(232,0,28,0.4)` : '1px solid transparent',
                }}>
                {p.name}
                <span className="block text-xs mt-0.5 font-normal" style={{ color: MUTED }}>
                  {p.type === 'leads' ? 'Geração de leads' : 'Vendas diretas'}
                </span>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-lg p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: MUTED }}>Resumo</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>Métricas ativas</span>
                <span className="font-bold" style={{ color: GREEN }}>{enabledCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: MUTED }}>Total disponível</span>
                <span className="text-white font-bold">{metrics.length}</span>
              </div>
              <div className="h-px my-2" style={{ backgroundColor: BORDER }} />
              {TABS.map(t => (
                <div key={t.id} className="flex justify-between text-xs">
                  <span style={{ color: MUTED }}>{t.label}</span>
                  <span className="text-white">{t.count}/{t.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: metrics config ────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* CRM notice */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ backgroundColor: 'rgba(139,92,246,0.1)', border: `1px solid rgba(139,92,246,0.3)` }}>
            <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#8B5CF6' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: '#A78BFA' }}>
                Integração CRM em breve
              </p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                As métricas de CRM ficarão disponíveis após vincular o HubSpot ou Pipedrive.
                Você já pode ativá-las para quando a integração estiver pronta.
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            {TABS.map(t => (
              <button key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex-1 py-3 px-4 text-sm font-medium transition-all"
                style={{
                  backgroundColor: activeTab === t.id ? CARD : 'transparent',
                  color: activeTab === t.id ? '#fff' : MUTED,
                  borderRight: `1px solid ${BORDER}`,
                }}>
                {t.label}
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: activeTab === t.id ? (t.id === 'crm' ? 'rgba(139,92,246,0.3)' : 'rgba(232,0,28,0.2)') : BORDER,
                    color: activeTab === t.id ? '#fff' : MUTED,
                  }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Metrics list */}
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h2 className="text-white text-sm font-semibold">{CATEGORY_LABELS[activeTab]}</h2>
              {activeTab !== 'crm' && (
                <button onClick={() => setShowNew(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  style={{ backgroundColor: showNew ? RED : BORDER, color: '#fff' }}>
                  <Plus className="w-3.5 h-3.5" />
                  {showNew ? 'Cancelar' : 'Métrica customizada'}
                </button>
              )}
            </div>

            {/* Add custom form */}
            {showNew && activeTab !== 'crm' && (
              <div className="px-5 py-4 space-y-3" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#141414' }}>
                <p className="text-xs font-semibold" style={{ color: MUTED }}>Nova métrica customizada</p>
                <div className="grid grid-cols-2 gap-3">
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Nome da métrica"
                    className="px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                  />
                  <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    placeholder="Descrição (opcional)"
                    className="px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
                  />
                </div>
                <p className="text-xs" style={{ color: MUTED }}>
                  Métricas customizadas podem ser alimentadas manualmente ou via integração CRM.
                </p>
                <button onClick={addCustom}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: RED }}>
                  Adicionar
                </button>
              </div>
            )}

            {/* Metrics table */}
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {catMetrics.map(m => (
                <div key={m.id}
                  className="px-5 py-4 flex items-center gap-4 transition hover:bg-white/5"
                  style={{ opacity: m.isCrm ? 0.75 : 1 }}>

                  {/* Toggle */}
                  <button onClick={() => toggleMetric(m.id)}
                    className="shrink-0 transition-colors">
                    {m.enabled
                      ? <ToggleRight className="w-8 h-8" style={{ color: m.isCrm ? '#8B5CF6' : RED }} />
                      : <ToggleLeft  className="w-8 h-8" style={{ color: MUTED }} />
                    }
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{m.name}</span>
                      {m.isCrm && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                          style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                          CRM
                        </span>
                      )}
                      {m.isCustom && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                          style={{ backgroundColor: 'rgba(107,114,128,0.2)', color: MUTED }}>
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: MUTED }}>{m.description}</p>
                  </div>

                  {/* Source badge */}
                  <span className="text-xs px-2 py-1 rounded font-semibold shrink-0"
                    style={{
                      backgroundColor: `${SOURCE_COLORS[m.source]}20`,
                      color: SOURCE_COLORS[m.source],
                    }}>
                    {SOURCE_LABELS[m.source]}
                  </span>

                  {/* Delete (custom only) */}
                  {m.isCustom && (
                    <button onClick={() => removeCustom(m.id)}
                      className="p-1.5 rounded transition hover:bg-red-900/30 shrink-0">
                      <Trash2 className="w-4 h-4" style={{ color: MUTED }} />
                    </button>
                  )}
                </div>
              ))}

              {catMetrics.length === 0 && (
                <p className="px-5 py-8 text-sm text-center" style={{ color: MUTED }}>
                  Nenhuma métrica nesta categoria
                </p>
              )}
            </div>

            <div className="px-5 py-3 flex justify-end" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button className="px-6 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: RED }}>
                Salvar configuração
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
