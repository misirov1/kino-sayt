import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { 
  Users, Film, Clock, Eye, Upload, 
  CheckCircle2, XCircle, AlertCircle, Play 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [pendingMovies, setPendingMovies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/stats');
      setStats(data.stats);
      setPendingMovies(data.pendingMovies || []);
      setRecentUsers(data.recentUsers || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (movieId) => {
    try {
      await apiFetch(`/admin/movies/${movieId}/approve`, { method: 'PUT' });
      showToast('Kino tasdiqlandi va umumiy katalogga chiqarildi!', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (movieId) => {
    if (!window.confirm('Haqiqatan ham ushbu kinoni rad etmoqchimisiz?')) return;
    try {
      await apiFetch(`/admin/movies/${movieId}`, { method: 'DELETE' });
      showToast('Kino rad etildi va o‘chirildi.', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Dashboard yuklanmoqda...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Jami Foydalanuvchilar', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Tasdiqlangan Kinolar', value: stats?.totalMovies || 0, icon: Film, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Tasdiqlash Kutilmoqda', value: stats?.pendingApprovals || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Aktiv Kino Xonalari', value: stats?.activeRooms || 0, icon: Play, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Yuklangan Kinolar', value: stats?.userUploads || 0, icon: Upload, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Jami Ko‘rishlar Soni', value: stats?.totalViews || 0, icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="space-y-8">
      
      {/* 6 Key Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className={`p-2 rounded-xl w-fit ${card.bg} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{card.value}</p>
              <p className="text-[11px] text-zinc-400 font-medium leading-tight">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Tasdiqlanishini kutayotgan kinolar ({pendingMovies.length})</span>
          </h2>
          <Link to="/admin/uploads" className="text-xs text-red-400 hover:underline">
            Barchasini ko‘rish →
          </Link>
        </div>

        {pendingMovies.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Hozirda tasdiqlash uchun navbatda yangi kino yo‘q.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Kino</th>
                  <th className="p-3">Yuklagan</th>
                  <th className="p-3">Janr / Yil</th>
                  <th className="p-3">Muddati</th>
                  <th className="p-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {pendingMovies.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 flex items-center gap-2.5">
                      <img src={m.poster} alt={m.title} className="w-9 h-12 object-cover rounded-lg" />
                      <div>
                        <p className="font-bold text-white">{m.title}</p>
                        <p className="text-[10px] text-zinc-500">{m.quality}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-white font-medium">{m.uploaderName || 'Foydalanuvchi'}</p>
                      <p className="text-[10px] text-zinc-500">{m.uploaderEmail}</p>
                    </td>
                    <td className="p-3">
                      <p>{m.genre}</p>
                      <p className="text-[10px] text-zinc-500">{m.year}-yil</p>
                    </td>
                    <td className="p-3">
                      {m.expiresAt ? (
                        <span className="text-amber-400 font-mono text-[11px]">
                          {new Date(m.expiresAt).toLocaleDateString('uz-UZ')}
                        </span>
                      ) : (
                        <span className="text-zinc-500">Doimiy</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApprove(m.id)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tasdiqlash</span>
                        </button>
                        <button
                          onClick={() => handleReject(m.id)}
                          className="flex items-center gap-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rad etish</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Users List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>So‘nggi ro‘yxatdan o‘tgan foydalanuvchilar</span>
          </h2>
          <Link to="/admin/users" className="text-xs text-red-400 hover:underline">
            Barcha foydalanuvchilar →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {recentUsers.map(u => (
            <div key={u.id} className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{u.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">@{u.username}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-red-950 text-red-300 border border-red-800 mt-1">
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
