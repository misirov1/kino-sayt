import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeInvite, setActiveInvite] = useState(null);

  const showToast = (message, type = 'info', action = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Fetch unread count periodically or when user logs in
  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiFetch('/social/notifications');
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    refreshNotifications();

    const socket = getSocket();

    const handleRoomInvite = (inviteData) => {
      setActiveInvite(inviteData);
      showToast(
        `${inviteData.fromUser.name} sizni "${inviteData.movieTitle}" xonasiga taklif qildi!`,
        'invite',
        {
          label: 'Xonaga kirish',
          onClick: () => {
            navigate(inviteData.link);
            setActiveInvite(null);
          }
        }
      );
      setUnreadCount(prev => prev + 1);
    };

    socket.on('received_room_invite', handleRoomInvite);

    return () => {
      socket.off('received_room_invite', handleRoomInvite);
    };
  }, [user]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showToast, unreadCount, setUnreadCount, refreshNotifications }}>
      {children}

      {/* Floating Toasts & Room Invites */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-800 text-red-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                : toast.type === 'invite'
                ? 'bg-amber-950/95 border-amber-600 text-amber-100 ring-2 ring-amber-500/50'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action.onClick();
                  removeToast(toast.id);
                }}
                className="mt-3 w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>🍿</span> {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
