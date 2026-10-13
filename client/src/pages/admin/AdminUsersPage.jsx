import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { Users, Ban, CheckCircle, Search, Film } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotification();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/admin/users');
      setUsers(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (user) => {
    const actionText = user.isBanned ? 'blokdan chiqarilsinmi' : 'bloklansinmi';
    if (!window.confirm(`Haqiqatan ham "${user.name}" ${actionText}?`)) return;

    try {
      const res = await apiFetch(`/admin/users/${user.id}/ban`, { method: 'PUT' });
      showToast(res.message, 'success');
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, isBanned: res.isBanned } : u))
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Foydalanuvchilar Ro‘yxati ({filteredUsers.length})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Platformadagi barcha foydalanuvchilar va ularning faollik holati
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, @username yoki email..."
            className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Yuklanmoqda...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            Foydalanuvchilar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Foydalanuvchi</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Yuklagan kinolari</th>
                  <th className="p-3.5">Qo‘shilgan sana</th>
                  <th className="p-3.5">Holati</th>
                  <th className="p-3.5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-700" />
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-zinc-500 text-[10px]">@{u.username}</p>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">{u.email}</td>
                    <td className="p-3.5 font-mono text-zinc-300">
                      {u.uploadsCount || 0} ta kino
                    </td>
                    <td className="p-3.5 text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="p-3.5">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950 px-2.5 py-0.5 rounded border border-red-800">
                          <Ban className="w-3 h-3" /> Bloklangan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                          <CheckCircle className="w-3 h-3" /> Faol
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleBan(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.isBanned
                            ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-800'
                        }`}
                      >
                        {u.isBanned ? 'Blokdan chiqarish' : 'Bloklash'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
