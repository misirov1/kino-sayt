import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Users, UserPlus, Check, X, Search, 
  Trash2, Send, Shield, Film, Circle 
} from 'lucide-react';

export default function FriendsPage() {
  const { user, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFriendsData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadFriendsData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/social/friends');
      setFriends(data.friends || []);
      setIncomingRequests(data.incomingRequests || []);
      setOutgoingRequests(data.outgoingRequests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const data = await apiFetch(`/social/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(data || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const res = await apiFetch('/social/friends/request', {
        method: 'POST',
        body: { receiverId }
      });
      showToast(res.message, 'success');
      setSearchResults(prev => prev.filter(u => u.id !== receiverId));
      loadFriendsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const respondRequest = async (requestId, action) => {
    try {
      const res = await apiFetch('/social/friends/respond', {
        method: 'POST',
        body: { requestId, action }
      });
      showToast(res.message, 'success');
      loadFriendsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm('Do‘stlar safidan chiqarilsinmi?')) return;
    try {
      await apiFetch(`/social/friends/${friendId}`, { method: 'DELETE' });
      setFriends(prev => prev.filter(f => f.id !== friendId));
      showToast('Do‘st o‘chirildi.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 max-w-md space-y-4">
          <Users className="w-12 h-12 text-blue-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Do‘stlar Tizimi</h2>
          <p className="text-xs text-zinc-400">
            Do‘stlaringiz bilan birgalikda kino ko‘rish va taklifnoma yuborish uchun tizimga kiring.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm"
          >
            Kirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            <span>Do‘stlarim</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Do‘stlaringiz bilan virtual xonada 4 kishilik divanda birga kino tomosha qiling
          </p>
        </div>

        {/* Search & Add New Friends */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <span>Yangi do‘st qidirish</span>
          </h2>

          <form onSubmit={handleSearchUsers} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ism, foydalanuvchi nomi yoki email kiriting..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md"
            >
              Qidirish
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-zinc-400 font-semibold">Qidiruv natijalari:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {searchResults.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-zinc-400">@{u.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(u.id)}
                      className="flex items-center gap-1 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Qo‘shish</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <section className="bg-amber-950/20 border border-amber-800/40 rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <span>Kutilayotgan do‘stlik so‘rovlari ({incomingRequests.length})</span>
            </h2>

            <div className="space-y-2">
              {incomingRequests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.avatar}
                      alt={req.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{req.name}</p>
                      <p className="text-[10px] text-zinc-400">@{req.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => respondRequest(req.id, 'accept')}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Qabul qilish</span>
                    </button>
                    <button
                      onClick={() => respondRequest(req.id, 'decline')}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
                      title="Rad etish"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center justify-between">
            <span>Mening do‘stlarim ({friends.length})</span>
          </h2>

          {friends.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
              Sizda hali do‘stlar yo‘q. Yuqoridagi qidiruv orqali do‘stlaringizni toping va taklif yuboring!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {friends.map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {f.isOnline === 1 ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-zinc-900" title="Onlayn" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-600 rounded-full ring-2 ring-zinc-900" title="Oflayn" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{f.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {f.isOnline === 1 ? '🟢 Onlayn' : '⚪ Oflayn'} • @{f.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFriend(f.id)}
                    title="Do‘stlikni bekor qilish"
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
