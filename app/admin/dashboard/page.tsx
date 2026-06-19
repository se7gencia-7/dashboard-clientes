'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, TrendingUp, Users, FolderOpen, BarChart3, Link2, Settings2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const BG     = '#0D0D0D';
const CARD   = '#181818';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const GREEN  = '#22C55E';

interface ClientData {
  id: string;
  name: string;
  email: string;
  projectCount: number;
  totalSpend: number;
  totalReach: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ totalClients:0, totalProjects:0, totalSpend:0, totalReach:0 });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/admin/login'); return; }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch('/api/admin/clients', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { if (res.status === 401) router.push('/admin/login'); return; }
      const data  = await res.json();
      setClients(data.clients);
      setStats(data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { localStorage.removeItem('adminToken'); router.push('/admin/login'); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: BG }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: BORDER, borderTopColor: RED }} />
        <p className="text-sm" style={{ color: MUTED }}>Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>

      {/* Header */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tight">Se7</span>
            <span className="w-2 h-2 rounded-full bg-red-600 mb-3 mx-0.5" />
            <span className="text-xl font-black tracking-tight">Gência</span>
            <span className="ml-3 text-sm font-medium px-2.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(232,0,28,0.15)', color: RED }}>
              Painel Gestor
            </span>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ border: `1px solid ${BORDER}`, color: MUTED }}>
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/projetos"
            className="flex items-center gap-4 p-5 rounded-lg transition group"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(232,0,28,0.15)' }}>
              <Link2 className="w-5 h-5" style={{ color: RED }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Projetos e Campanhas</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Vincule campanhas de Meta, Google e TikTok a cada projeto
              </p>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" style={{ color: MUTED }} />
          </Link>

          <Link href="/admin/metricas"
            className="flex items-center gap-4 p-5 rounded-lg transition group"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
              <Settings2 className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Configurar Métricas</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Escolha quais métricas aparecem em cada projeto e cliente
              </p>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" style={{ color: MUTED }} />
          </Link>

          <Link href="/demo"
            className="flex items-center gap-4 p-5 rounded-lg transition group"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: GREEN }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Ver Dashboard Demo</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Preview do dashboard do cliente com dados de demonstração
              </p>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" style={{ color: MUTED }} />
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Clientes ativos', value: stats.totalClients, icon: Users,      color:'#3B82F6' },
            { label:'Projetos total',  value: stats.totalProjects, icon: FolderOpen, color: GREEN    },
            { label:'Gasto gerenciado', value: `R$ ${(stats.totalSpend/1000).toFixed(1)}k`, icon: BarChart3, color:'#F97316' },
            { label:'Alcance total',   value: `${(stats.totalReach/1000000).toFixed(1)}M`, icon: TrendingUp, color:'#8B5CF6' },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-lg" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: MUTED }}>{s.label}</p>
                <s.icon className="w-5 h-5 opacity-50" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Clients table */}
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <h2 className="text-white font-semibold">Clientes</h2>
          </div>

          {clients.length === 0 ? (
            <div className="px-6 py-16 text-center space-y-2">
              <Users className="w-10 h-10 mx-auto opacity-20" style={{ color: MUTED }} />
              <p className="text-sm" style={{ color: MUTED }}>Nenhum cliente cadastrado ainda</p>
              <p className="text-xs" style={{ color: MUTED }}>
                Use a API /api/auth/signup para criar o primeiro cliente
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#1F1F1F' }}>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Empresa','Email','Projetos','Gasto','Alcance','Ações'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="px-5 py-4 font-medium text-white">{c.name}</td>
                    <td className="px-5 py-4" style={{ color: MUTED }}>{c.email}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                        {c.projectCount} proj.
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white">R$ {c.totalSpend.toFixed(2)}</td>
                    <td className="px-5 py-4" style={{ color: MUTED }}>{(c.totalReach/1000).toFixed(0)}k</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/clients/${c.id}`}
                        className="text-xs font-semibold hover:underline transition"
                        style={{ color: RED }}>
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
