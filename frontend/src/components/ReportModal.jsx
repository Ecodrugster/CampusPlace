import React, { useState } from 'react';
import { X, Flag, AlertCircle } from 'lucide-react';
import { api } from '../api';

const REASONS = [
  { value: 'spam', label: 'Спам' },
  { value: 'scam', label: 'Мошенничество' },
  { value: 'inappropriate', label: 'Неприемлемый контент' },
  { value: 'other', label: 'Другое' },
];

export default function ReportModal({ product, onClose, onSuccess }) {
  const [reason, setReason] = useState('spam');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.createReport({
        productId: product.id,
        reason,
        comment: comment.trim(),
      });
      setDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Не удалось отправить жалобу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-sm">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="report-modal-content">
          <div className="report-modal-header">
            <div className="report-icon-wrap">
              <Flag size={20} />
            </div>
            <h3>Пожаловаться на объявление</h3>
            <p className="report-subtitle">
              {product?.title || 'Объявление'}
            </p>
          </div>

          {done ? (
            <div className="empty-tab-state">
              <h4>Жалоба отправлена</h4>
              <p>Модераторы проверят объявление. Спасибо, что помогаете держать кампус в безопасности.</p>
              <button className="btn btn-primary" onClick={onClose}>
                Закрыть
              </button>
            </div>
          ) : (
            <form className="report-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label>Причина</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} required>
                  {REASONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Комментарий (по желанию)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Кратко опишите проблему..."
                />
                <span className="char-counter">{comment.length}/500</span>
              </div>

              <div className="leave-review-actions">
                <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-danger" disabled={loading}>
                  {loading ? 'Отправка...' : 'Отправить жалобу'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
