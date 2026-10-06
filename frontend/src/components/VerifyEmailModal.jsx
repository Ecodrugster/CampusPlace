import React, { useEffect, useState } from 'react';
import { X, MailCheck, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function VerifyEmailModal({ user, onClose, onVerified, autoSend = true }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(autoSend ? '' : 'Код уже отправлен на ваш email');
  const [devCode, setDevCode] = useState('');

  const sendCode = async () => {
    setSending(true);
    setError('');
    setInfo('');
    try {
      const res = await api.sendVerificationCode();
      setInfo(res.detail || 'Код отправлен на email');
      if (res.dev_code) setDevCode(res.dev_code);
    } catch (err) {
      setError(err.message || 'Не удалось отправить код');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (autoSend) sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.confirmVerificationCode(code.trim());
      if (onVerified) onVerified(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Неверный код');
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

        <div className="verify-email-content">
          <div className="verify-email-header">
            <div className="verify-icon-wrap">
              <MailCheck size={22} />
            </div>
            <h3>Подтвердите email</h3>
            <p>
              Мы отправили 6-значный код на <strong>{user?.email}</strong>.
              Введите его ниже, чтобы получить статус Verified Student.
            </p>
          </div>

          {error && (
            <div className="error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {info && <div className="success-alert">{info}</div>}
          {devCode && (
            <div className="dev-code-hint">
              Dev-режим: код <strong>{devCode}</strong> (SMTP не настроен)
            </div>
          )}

          <form className="verify-email-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Код из письма</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
              />
            </div>

            <div className="leave-review-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={sendCode}
                disabled={sending || loading}
              >
                {sending ? 'Отправка...' : 'Отправить код ещё раз'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
