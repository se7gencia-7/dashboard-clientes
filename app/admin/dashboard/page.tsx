'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, TrendingUp, Users, FolderOpen, BarChart3 } from 'lucide-react';
import Link from 'next/link';

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
  const [stats, setStats] = useState({
    totalClients: 0,
    totalProjects: 0,
    totalSpend: 0,
    totalReach: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
        }
        return;
      }

      const data = await response.json();
      setClients(data.clients);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Se7.Gência - Painel de Controle</h1>
            <p className="text-gray-600 text-sm">Gerenciamento de Clientes e Campanhas</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Stats */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Clientes Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Projetos Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Gasto Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {(stats.totalSpend / 1000).toFixed(1)}k
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Alcance Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.totalReach / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Clientes</h2>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">Nenhum cliente cadastrado ainda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Projetos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Gasto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Alcance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody divide-y>
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 text-gray-600">{client.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {client.projectCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">R$ {client.totalSpend.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {(client.totalReach / 1000).toFixed(0)}k
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-blue-600 hover:underline font-semibold text-sm"
                        >
                          Ver Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
