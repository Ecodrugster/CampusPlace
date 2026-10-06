import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, AlertCircle, Check, Ban, EyeOff } from 'lucide-react';
import { api } from '../api';

export default function ModerationModal({ onClose }) {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadReports = async (status = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getModerationReports(status);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить жалобы');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(statusFilter);
  }, [statusFilter]);

  const handleAction = async (reportId, action) => {
    setActionLoadingId(reportId);
    setError('');
    try {
      await api.resolveModerationReport(reportId, action);
      await loadReports(statusFilter);
    } catch (err) {
      setError(err.message || 'Не удалось выполнить действие');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-md moderation-modal">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="moderation-header">
          <div className="moderation-title-row">
            <ShieldAlert size={20} />
            <h3>Модерация жалоб</h3>
          </div>
          <div className="moderation-filters">
            {[
              { value: 'pending', label: 'Ожидают' },
              { value: 'resolved', label: 'Решены' },
              { value: 'dismissed', label: 'Отклонены' },
              { value: 'all', label: 'Все' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                className={`moderation-filter-btn ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="moderation-body">
          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="empty-tab-state">
              <div className="chat-loading-spinner" />
              <p>Загрузка жалоб...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-tab-state">
              <h4>Жалоб нет</h4>
              <p>В этой очереди пока пусто.</p>
            </div>
          ) : (
            <div className="moderation-list">
              {items.map((report) => (
                <div key={report.id} className="moderation-card">
                  <div className="moderation-card-top">
                    <div>
                      <strong className="moderation-product-title">
                        {report.product?.title || 'Объявление'}
                      </strong>
                      <div className="moderation-meta">
                        <span className="moderation-reason-chip">{report.reason_display || report.reason}</span>
                        <span>Статус: {report.status}</span>
                        <span>
                          {report.created_at
                            ? new Date(report.created_at).toLocaleString('ru-RU')
                            : ''}
                        </span>
                      </div>
                    </div>
                    <span className="moderation-id">#{report.id}</span>
                  </div>

                  {report.comment && (
                    <p className="moderation-comment">{report.comment}</p>
                  )}

                  <div className="moderation-people">
                    <span>От: {report.reporter?.full_name || 'Пользователь'}</span>
                    <span>
                      Продавец: {report.seller?.full_name || '—'}
                      {report.seller?.is_banned ? ' (заблокирован)' : ''}
                    </span>
                    <span>Товар: {report.product?.status || '—'}</span>
                  </div>

                  {report.status === 'pending' && (
                    <div className="moderation-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={actionLoadingId === report.id}
                        onClick={() => handleAction(report.id, 'dismiss')}
                      >
                        Отклонить
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={actionLoadingId === report.id}
                        onClick={() => handleAction(report.id, 'resolve')}
                      >
                        <Check size={14} /> Решено
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={actionLoadingId === report.id}
                        onClick={() => handleAction(report.id, 'hide_product')}
                      >
                        <EyeOff size={14} /> Скрыть товар
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={actionLoadingId === report.id}
                        onClick={() => handleAction(report.id, 'ban_seller')}
                      >
                        <Ban size={14} /> Бан продавца
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
