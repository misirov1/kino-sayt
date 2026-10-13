import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiFetch } from '../../utils/api';
import { ThumbsUp, Trash2, Send, MessageSquare } from 'lucide-react';

export default function CommentsSection({ movieId }) {
  const { user, isModerator, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      const data = await apiFetch(`/social/comments/${movieId}`);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (movieId) loadComments();
  }, [movieId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch(`/social/comments/${movieId}`, {
        method: 'POST',
        body: { content: content.trim() }
      });
      setComments([res.comment, ...comments]);
      setContent('');
      showToast('Fikringiz muvaffaqiyatli qoldirildi!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await apiFetch(`/social/comments/${commentId}/like`, { method: 'POST' });
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: res.isLiked,
              likesCount: res.isLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
            };
          }
          return c;
        })
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Haqiqatan ham ushbu fikrni o‘chirmoqchimisiz?')) return;
    try {
      await apiFetch(`/social/comments/${commentId}`, { method: 'DELETE' });
      setComments(prev => prev.filter(c => c.id !== commentId));
      showToast('Fikr o‘chirildi.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-red-500" />
          <span>Fikr va sharhlar ({comments.length})</span>
        </h3>
      </div>

      {/* New comment input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          {user ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500/50 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 flex-shrink-0">
              ?
            </div>
          )}
          <textarea
            rows="2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={user ? "Kino haqida fikringizni yozing..." : "Fikr bildirish uchun avval tizimga kiring"}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none transition-colors"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Fikr qoldirish</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {comments.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6">
            Hozircha hech kim fikr bildirmagan. Birinchi bo‘ling!
          </p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={c.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                    alt={c.userName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-white mr-2">{c.userName}</span>
                    {c.userRole && c.userRole !== 'user' && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                        {c.userRole}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <span>{new Date(c.createdAt).toLocaleDateString('uz-UZ')}</span>
                  {(user?.id === c.userId || isModerator) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1 hover:text-red-500 transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed pl-9">
                {c.content}
              </p>

              <div className="pl-9 pt-1">
                <button
                  onClick={() => handleLike(c.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    c.isLiked
                      ? 'bg-red-950 text-red-400 border border-red-800/50'
                      : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${c.isLiked ? 'fill-current' : ''}`} />
                  <span>{c.likesCount || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
