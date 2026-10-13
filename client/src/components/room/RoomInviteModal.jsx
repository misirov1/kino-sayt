import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, UserPlus, X, Share2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { useNotification } from '../../context/NotificationContext';
import { getSocket } from '../../utils/socket';

export default function RoomInviteModal({ isOpen, onClose, roomId, movieTitle }) {
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState([]);
  const [invitedMap, setInvitedMap] = useState({});
  const { showToast } = useNotification();

  const shareUrl = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    if (isOpen) {
      apiFetch('/social/friends')
        .then(data => setFriends(data.friends || []))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Xona havolasi nusxalandi!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInviteFriend = (friend) => {
    const socket = getSocket();
    socket.emit('invite_friend_to_room', {
      friendId: friend.id,
      roomId,
      movieTitle
    });

    setInvitedMap(prev => ({ ...prev, [friend.id]: true }));
    showToast(`"${friend.name}"ga taklifnoma yuborildi! 🍿`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-zinc-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Do‘stlarni taklif qilish</h3>
            <p className="text-xs text-zinc-400">
              Maksimal 4 kishi birgalikda sinxron tomosha qilishi mumkin
            </p>
          </div>
        </div>

        {/* Copy Invite Link */}
        <div className="mb-6">
          <label className="text-xs text-zinc-400 block mb-1.5 font-medium">
            Xona taklif havolasi:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Nusxalandi' : 'Nusxa olish'}</span>
            </button>
          </div>
        </div>

        {/* Friends Online List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Do‘stlaringizni to‘g‘ridan-to‘g‘ri chaqiring
          </h4>

          {friends.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
              Do‘stlaringiz ro‘yxati hozircha bo‘sh. Yuqoridagi havolani ulashing!
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {friends.map(f => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={f.avatar}
                        alt={f.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      {f.isOnline === 1 && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-zinc-950" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{f.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {f.isOnline === 1 ? '🟢 Onlayn' : '⚪ Oflayn'}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={invitedMap[f.id]}
                    onClick={() => handleInviteFriend(f)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      invitedMap[f.id]
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300'
                    }`}
                  >
                    {invitedMap[f.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Yuborildi</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Taklif</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
