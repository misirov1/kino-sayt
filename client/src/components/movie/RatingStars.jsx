import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { apiFetch } from '../../utils/api';

export default function RatingStars({ movieId, initialRating = 5, initialCount = 0, userInitialRating = null, onRatingUpdated }) {
  const { user, setIsAuthModalOpen } = useAuth();
  const { showToast } = useNotification();
  const [rating, setRating] = useState(initialRating);
  const [count, setCount] = useState(initialCount);
  const [userRating, setUserRating] = useState(userInitialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (score) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`/social/ratings/${movieId}`, {
        method: 'POST',
        body: { score }
      });
      setUserRating(res.userRating);
      setRating(res.newRating);
      setCount(res.ratingCount);
      showToast(res.message, 'success');
      if (onRatingUpdated) onRatingUpdated(res.newRating, res.ratingCount);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRate(star)}
              className="p-1 text-zinc-600 hover:scale-125 transition-transform"
              title={`${star} yulduz berish`}
            >
              <Star
                className={`w-5 h-5 ${
                  (hoverRating || userRating || 0) >= star
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-600'
                }`}
              />
            </button>
          ))}
        </div>

        <span className="text-base font-black text-white">
          {rating ? Number(rating).toFixed(1) : '5.0'}
        </span>
        <span className="text-xs text-zinc-400">({count} baho)</span>
      </div>

      {userRating && (
        <span className="text-xs text-emerald-400 font-semibold sm:border-l sm:border-zinc-800 sm:pl-3">
          Sizning bahoingiz: {userRating} ★
        </span>
      )}
    </div>
  );
}
