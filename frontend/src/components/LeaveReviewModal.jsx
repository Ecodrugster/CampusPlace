import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { api } from '../api';

export default function LeaveReviewModal({ product, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Пожалуйста, выберите оценку от 1 до 5 звёзд');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const review = await api.createReview({
        productId: product.id,
        rating,
        comment: comment.trim()
      });
      if (onSuccess) onSuccess(review);
      onClose();
    } catch (err) {
      setError(err.message || 'Ошибка сохранения отзыва');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1: return 'Ужасно';
      case 2: return 'Плохо';
      case 3: return 'Нормально';
      case 4: return 'Хорошо';
      case 5: return 'Отлично!';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-sm">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="leave-review-content">
          <div className="leave-review-header">
            <h3>Оставить отзыв продавцу</h3>
            <p className="leave-review-subtitle">
              По сделке: <strong>{product.title}</strong>
            </p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="leave-review-form">
            <div className="rating-select-block">
              <label>Ваша оценка:</label>
              <div className="star-rating-picker">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      className={`star-pick-btn ${active ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        size={28}
                        fill={active ? '#f59e0b' : 'none'}
                        color={active ? '#f59e0b' : 'var(--text-light)'}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="rating-label-hint">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>

            <div className="form-group">
              <label>Комментарий (по желанию):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Расскажите, как прошла сделка, состояние товара, пунктуальность продавца..."
                rows={4}
                className="leave-review-textarea"
                maxLength={500}
              />
              <span className="char-counter">{comment.length}/500</span>
            </div>

            <div className="leave-review-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Отправка...' : 'Опубликовать отзыв'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
