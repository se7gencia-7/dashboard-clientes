'use client';

import { useState } from 'react';
import { ChevronDown, Check, Search, Link2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import NextLink from 'next/link';

const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';

// ── Mock data ─────────────────────────────────────────────────────────────────

const CLIENTS = [
  { id:'c1', name:'4Ventos'         },
  { id:'c2', name:'Studio Bloom'    },
  { id:'c3', name:'Max Atacarejo'   },
];

const PROJECTS: Record<string, {id:string; name:string; type:string}[]> = {
  c1: [
    { id:'p1', name:'Dunamis Club',         type:'vendas' },
    { id:'p2', name:'Lançamento do Livro',  type:'leads'  },
    { id:'p3', name:'Aniversário E-commerce', type:'vendas' },
  ],
  c2: [
    { id:'p4', name:'Inverno 2025',   type:'vendas' },
    { id:'p5', name:'Black Friday',   type:'vendas' },
  ],
  c3: [
    { id:'p6', name:'Campanha FGTS',  type:'leads' },
  ],
};

type Platform = 'meta' | 'google' | 'tiktok';

interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  status: 'ACTIVE' | 'PAUSED';
  spend: string;
  results: number;
  linked?: boolean;
}

const ALL_CAMPAIGNS: Campaign[] = [
  { id:'m1', platform:'meta',   status:'ACTIVE', name:'[VEND] Dunamis Club - Vendas - Conversão',          spend:'R$ 8.420',  results:87  },
  { id:'m2', platform:'meta',   status:'ACTIVE', name:'[VEND] Dunamis Club - Retargeting',                 spend:'R$ 2.150',  results:24  },
  { id:'m3', platform:'meta',   status:'PAUSED', name:'[LEAD] Lançamento Livro - Captação WhatsApp',        spend:'R$ 4.890',  results:312 },
  { id:'m4', platform:'meta',   status:'ACTIVE', name:'[LEAD] Lançamento Livro - Tráfego Frio',            spend:'R$ 3.200',  results:198 },
  { id:'m5', platform:'meta',   status:'PAUSED', name:'[ANIV] Aniversário E-com - Oferta Especial',         spend:'R$ 6.100',  results:51  },
  { id:'g1', platform:'google', status:'ACTIVE', name:'Dunamis Club | Search Brand',                        spend:'R$ 1.200',  results:142 },
  { id:'g2', platform:'google', status:'ACTIVE', name:'Dunamis Club | Performance Max',                     spend:'R$ 3.800',  results:63  },
  { id:'g3', platform:'google', status:'PAUSED', name:'Lançamento Livro | Search Geral',                    spend:'R$ 2.100',  results:88  },
  { id:'t1', platform:'tiktok', status:'ACTIVE', name:'Dunamis Club | Top View 18-35',                     spend:'R$ 1.800',  results:29  },
  { id:'t2', platform:'tiktok', status:'PAUSED', name:'Aniversário E-com | Spark Ads',                      spend:'R$ 900',    results:11  },
];

const PROJECT_LINKS: Record<string, string[]> = {
  p1: ['m1','m2','g1','g2','t1'],
  p2: ['m3','m4','g3'],
  p3: ['m5','t2'],
  p4: [], p5: [], p6: [],
};

const PLATFORM_COLORS: Record<Platform, string> = {
  meta:   '#1877F2',
  google: '#34A853',
  tiktok: '#EE1D52',
};

const PLATFORM_LABELS: Record<Platform, string> = {
  meta:   'Meta',
  google: 'Google',
  tiktok: 'TikTok',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminProjetos() {
  const [clientId,  setClientId]  = useState('c1');
  const [projectId, setProjectId] = useState('p1');
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'all'|Platform>('all');
  const [links,     setLinks]     = useState(PROJECT_LINKS);

  const projects     = PROJECTS[clientId] ?? [];
  const linked       = links[projectId] ?? [];
  const linkedSet    = new Set(linked);

  const available = ALL_CAMPAIGNS.filter(c => {
    const matchSearch   = c.name.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = filter === 'all' || c.platform === filter;
    return matchSearch && matchPlatform;
  });

  function toggle(campaignId: string) {
    setLinks(prev => {
      const cur = new Set(prev[projectId] ?? []);
      cur.has(campaignId) ? cur.delete(campaignId) : cur.add(campaignId);
      return { ...prev, [projectId]: Array.from(cur) };
    });
  }

  const linkedCampaigns = ALL_CAMPAIGNS.filter(c => linkedSet.has(c.id));

  const ttStyle = { backgroundColor: CARD, border: `1px solid ${BORDER}` };

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
          <h1 className="text-white text-sm font-semibold">Gerenciar Projetos e Campanhas</h1>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: selectors + linked campaigns ──────────────────────────── */}
        <div className="space-y-4">

          {/* Client select */}
          <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: MUTED }}>Cliente</p>
            <div className="space-y-1">
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
          </div>

          {/* Project select */}
          <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: MUTED }}>Projeto</p>
            <div className="space-y-1">
              {projects.map(p => (
                <button key={p.id}
                  onClick={() => setProjectId(p.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: projectId === p.id ? 'rgba(232,0,28,0.15)' : 'transparent',
                    color: projectId === p.id ? RED : '#fff',
                    border: projectId === p.id ? `1px solid rgba(232,0,28,0.4)` : '1px solid transparent',
                  }}>
                  <span>{p.name}</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: BORDER, color: MUTED }}>
                    {links[p.id]?.length ?? 0} campanhas
                  </span>
                </button>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition"
              style={{ border: `1px dashed ${BORDER}`, color: MUTED }}>
              <Plus className="w-4 h-4" /> Novo projeto
            </button>
          </div>

          {/* Linked campaigns */}
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold text-white">Campanhas vinculadas</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: 'rgba(232,0,28,0.2)', color: RED }}>
                {linkedCampaigns.length}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {linkedCampaigns.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center" style={{ color: MUTED }}>
                  Nenhuma campanha vinculada
                </p>
              ) : linkedCampaigns.map(c => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ backgroundColor: `${PLATFORM_COLORS[c.platform]}20`, color: PLATFORM_COLORS[c.platform] }}>
                        {PLATFORM_LABELS[c.platform]}
                      </span>
                    </div>
                    <p className="text-xs text-white truncate">{c.name}</p>
                  </div>
                  <button onClick={() => toggle(c.id)}
                    className="p-1.5 rounded transition hover:bg-red-900/30">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: MUTED }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: all campaigns to link ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>

            {/* Table header */}
            <div className="px-5 py-4 space-y-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-white font-semibold">
                    Selecionar campanhas → {projects.find(p => p.id === projectId)?.name}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                    Marque as campanhas que pertencem a este projeto
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: RED }}>
                  <Check className="w-4 h-4" /> Salvar
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
                  <Search className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar campanha..."
                    className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-gray-600"
                  />
                </div>
                {(['all','meta','google','tiktok'] as const).map(f => (
                  <button key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition"
                    style={{
                      backgroundColor: filter === f ? (f === 'all' ? RED : PLATFORM_COLORS[f as Platform] ?? RED) : BORDER,
                      color: filter === f ? '#fff' : MUTED,
                    }}>
                    {f === 'all' ? 'Todas' : PLATFORM_LABELS[f as Platform]}
                  </button>
                ))}
              </div>
            </div>

            {/* Campaigns table */}
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#1F1F1F' }}>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>Campanha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>Plataforma</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>Investimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>Resultados</th>
                </tr>
              </thead>
              <tbody>
                {available.map(c => {
                  const isLinked = linkedSet.has(c.id);
                  return (
                    <tr key={c.id}
                      onClick={() => toggle(c.id)}
                      className="cursor-pointer transition"
                      style={{
                        borderBottom: `1px solid ${BORDER}`,
                        backgroundColor: isLinked ? 'rgba(232,0,28,0.08)' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isLinked) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isLinked ? 'rgba(232,0,28,0.08)' : 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <div className="w-5 h-5 rounded flex items-center justify-center"
                          style={{
                            backgroundColor: isLinked ? RED : 'transparent',
                            border: isLinked ? `none` : `1px solid ${BORDER}`,
                          }}>
                          {isLinked && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white max-w-[280px]">
                        <span className="line-clamp-1 text-xs">{c.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded font-semibold"
                          style={{ backgroundColor: `${PLATFORM_COLORS[c.platform]}20`, color: PLATFORM_COLORS[c.platform] }}>
                          {PLATFORM_LABELS[c.platform]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold"
                          style={{ color: c.status === 'ACTIVE' ? GREEN : MUTED }}>
                          {c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-xs">{c.spend}</td>
                      <td className="px-4 py-3 text-white text-xs">{c.results}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-xs" style={{ color: MUTED }}>
                {available.length} campanhas disponíveis · {linkedCampaigns.length} vinculadas
              </p>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: RED }}>
                <Check className="w-4 h-4" /> Salvar vinculações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
