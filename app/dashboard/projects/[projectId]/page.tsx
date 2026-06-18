'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Users, MessageSquare, Sparkles, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface TabContent {
  overview: {
    totalCampaigns: number;
    totalSpend: number;
    totalReach: number;
    averageROI: number;
  };
  audiences: any[];
  positionings: any[];
  creatives: any[];
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<TabContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) router.push('/auth/login');
        return;
      }

      const result = await response.json();
      setProject(result.project);
      setData(result.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Projeto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 text-sm">{project.description}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
              { id: 'audiences', label: 'Públicos', icon: Users },
              { id: 'positionings', label: 'Posicionamentos', icon: MessageSquare },
              { id: 'creatives', label: 'Criativos', icon: Sparkles },
              { id: 'campaigns', label: 'Campanhas', icon: Target },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-600 text-sm font-medium mb-2">Campanhas Ativas</div>
                <div className="text-3xl font-bold text-gray-900">{data?.overview.totalCampaigns || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-600 text-sm font-medium mb-2">Gasto Total</div>
                <div className="text-3xl font-bold text-gray-900">
                  R$ {(data?.overview.totalSpend || 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-600 text-sm font-medium mb-2">Alcance Total</div>
                <div className="text-3xl font-bold text-gray-900">
                  {(data?.overview.totalReach || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-gray-600 text-sm font-medium mb-2">ROI Médio</div>
                <div className="text-3xl font-bold text-green-600">{(data?.overview.averageROI || 0).toFixed(1)}%</div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Criar Público', icon: Users, href: `#audiences` },
                { label: 'Definir Posicionamento', icon: MessageSquare, href: `#positionings` },
                { label: 'Adicionar Criativo', icon: Sparkles, href: `#creatives` },
                { label: 'Nova Campanha', icon: Target, href: `#campaigns` },
              ].map(({ label, icon: Icon, href }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(href.slice(1))}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 text-center group"
                >
                  <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition" />
                  <p className="font-semibold text-gray-900">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audiences */}
        {activeTab === 'audiences' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Públicos (Audiences)</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                + Novo Público
              </button>
            </div>
            {data?.audiences.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Nenhum público criado ainda</p>
                <button className="text-blue-600 hover:underline font-semibold">Criar primeiro público</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {data?.audiences.map((audience) => (
                  <div key={audience.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{audience.name}</h3>
                        <p className="text-gray-600 text-sm">{audience.description}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {audience.gender || 'Todos'} - {audience.ageMin}-{audience.ageMax} anos
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>📍 {audience.location || 'Não definido'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Positionings */}
        {activeTab === 'positionings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Posicionamentos</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                + Novo Posicionamento
              </button>
            </div>
            {data?.positionings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Nenhum posicionamento definido</p>
                <button className="text-blue-600 hover:underline font-semibold">Criar primeiro posicionamento</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {data?.positionings.map((pos) => (
                  <div key={pos.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{pos.name}</h3>
                      <p className="text-blue-600 font-semibold text-sm">{pos.tagline}</p>
                    </div>
                    <p className="text-gray-700 mb-3">{pos.mainMessage}</p>
                    <div className="text-xs text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded">Tom: {pos.tone}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Creatives */}
        {activeTab === 'creatives' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Criativos</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                + Novo Criativo
              </button>
            </div>
            {data?.creatives.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Nenhum criativo criado</p>
                <button className="text-blue-600 hover:underline font-semibold">Criar primeiro criativo</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.creatives.map((creative) => (
                  <div key={creative.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                    {creative.imageUrl && (
                      <img src={creative.imageUrl} alt={creative.title} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2">{creative.title}</h3>
                      <p className="text-sm text-gray-700 mb-3">{creative.headline}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tipo: {creative.type}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            creative.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {creative.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Campaigns */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Campanhas</h2>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                + Nova Campanha
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Campanhas aparecem aqui após serem criadas</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
