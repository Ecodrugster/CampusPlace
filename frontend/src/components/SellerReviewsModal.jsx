import React, { useState, useEffect } from 'react';
import { Star, X, MessageSquareQuote, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../api';

function pluralizeReviews(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'отзыва';
  return 'отзывов';
}

export default function SellerReviewsModal({ seller, onClose }) {
  const [reviewsData, setReviewsData] = useState({
    average_rating: 0,
    total_reviews: 0,
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!seller?.id) return;
    setLoading(true);
    setError('');
    api.getSellerReviews(seller.id)
      .then((data) => {
        setReviewsData({
          average_rating: data.average_rating || 0,
          total_reviews: data.total_reviews || 0,
          reviews: data.reviews || []
        });
      })
      .catch((err) => {
        console.error('Ошибка загрузки отзывов:', err);
        setError(err.message || 'Не удалось загрузить отзывы');
      })
      .finally(() => setLoading(false));
  }, [seller?.id]);

  const renderStars = (rating) => {
    return (
      <div className="stars-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#f59e0b' : 'none'}
            color={star <= rating ? '#f59e0b' : 'var(--text-light)'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-md">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="seller-reviews-modal-content">
          <div className="seller-reviews-header">
            <img
              src={seller.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${seller.email}`}
              alt={seller.full_name}
              className="seller-reviews-avatar"
            />
            <div className="seller-reviews-header-info">
              <h3>Отзывы о продавце</h3>
              <p className="seller-reviews-name">{seller.full_name}</p>
              <div className="seller-rating-summary">
                <div className="rating-score-badge">
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <strong>{reviewsData.average_rating ? Number(reviewsData.average_rating).toFixed(1) : '0.0'}</strong>
                </div>
                <span className="total-reviews-count">
                  ({reviewsData.total_reviews} {pluralizeReviews(reviewsData.total_reviews)})
                </span>
              </div>
            </div>
          </div>

          <div className="seller-reviews-body">
            {loading ? (
              <div className="empty-tab-state seller-reviews-empty">
                <div className="chat-loading-spinner" />
                <p>Загрузка отзывов...</p>
              </div>
            ) : error ? (
              <div className="empty-tab-state seller-reviews-empty">
                <div className="empty-icon-wrap">
                  <AlertCircle size={28} />
                </div>
                <h4>Не удалось загрузить отзывы</h4>
                <p>{error}</p>
              </div>
            ) : reviewsData.reviews.length === 0 ? (
              <div className="empty-tab-state seller-reviews-empty">
                <div className="empty-icon-wrap empty-icon-star">
                  <MessageSquareQuote size={28} />
                </div>
                <h4>Пока нет отзывов</h4>
                <p>Этот продавец ещё не получал оценок от покупателей.</p>
              </div>
            ) : (
              <div className="reviews-list-container">
                {reviewsData.reviews.map((rev) => (
                  <div key={rev.id} className="review-item-card">
                    <div className="review-item-header">
                      <div className="reviewer-info-wrap">
                        <img
                          src={rev.reviewer_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${rev.reviewer_name || 'student'}`}
                          alt={rev.reviewer_name || 'Студент'}
                          className="reviewer-avatar"
                        />
                        <div className="reviewer-text-block">
                          <strong className="reviewer-name">{rev.reviewer_name || 'Студент'}</strong>
                          {rev.product_title && (
                            <span className="review-product-tag">
                              Товар: {rev.product_title}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="review-meta-right">
                        {renderStars(rev.rating)}
                        <span className="review-date">
                          <Calendar size={12} />
                          {rev.created_at
                            ? new Date(rev.created_at).toLocaleDateString('ru-RU')
                            : '—'}
                        </span>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="review-item-comment">{rev.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
