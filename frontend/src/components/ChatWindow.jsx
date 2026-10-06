import React, { useState, useEffect, useRef } from 'react';
import { Send, X, ArrowLeft, ShieldCheck, Tag, Star, Bookmark, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../api';

const DEAL_LABELS = {
  active: 'В обсуждении',
  reserved: 'Забронировано',
  sold: 'Продано',
  cancelled: 'Отменено',
};

export default function ChatWindow({
  conversation: initialConversation,
  currentUser,
  onClose,
  onBack,
  onLeaveReview,
  onDealStatusChanged,
  onMessagesRead,
}) {
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [connected, setConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  const otherUser = conversation?.buyer?.id === currentUser?.id ? conversation?.seller : conversation?.buyer;
  const isSeller = currentUser?.id === conversation?.seller?.id;
  const isBuyer = currentUser?.id === conversation?.buyer?.id;
  const dealStatus = conversation?.deal_status || 'active';

  useEffect(() => {
    if (!conversation?.id) return;
    let isMounted = true;

    api.getMessages(conversation.id)
      .then((history) => {
        if (isMounted) setMessages(Array.isArray(history) ? history : []);
        if (onMessagesRead) onMessagesRead(conversation.id);
      })
      .catch((err) => console.error('Ошибка загрузки истории чата:', err));

    const token = api.getAuthToken();
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.port === '3000' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/chat/${conversation.id}/?token=${token || ''}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isMounted) setConnected(true);
    };
    ws.onclose = (e) => {
      if (isMounted) setConnected(false);
      if (e.code === 4001) {
        console.warn('WebSocket закрыт: не авторизован (проверьте токен)');
      } else if (e.code === 4003) {
        console.warn('WebSocket закрыт: вы не являетесь участником диалога');
      }
    };
    ws.onerror = () => {};

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message_id)) return prev;
          return [...prev, {
            id: data.message_id || Date.now(),
            sender: data.sender_id,
            text: data.text,
            created_at: data.created_at || new Date().toISOString(),
          }];
        });
      } catch (e) {
        console.error('Ошибка парсинга сообщения:', e);
      }
    };

    return () => {
      isMounted = false;
      ws.onerror = null;
      ws.close();
    };
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: inputText.trim() }));
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateDealStatus = async (status) => {
    setStatusLoading(true);
    setStatusError('');
    try {
      const updated = await api.updateDealStatus(conversation.id, status);
      setConversation(updated);
      if (onDealStatusChanged) onDealStatusChanged(updated);
    } catch (err) {
      setStatusError(err.message || 'Не удалось обновить статус');
    } finally {
      setStatusLoading(false);
    }
  };

  if (!conversation || !otherUser) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-chat">
        <div className="chat-window-panel">
          <div className="chat-window-header">
            <div className="chat-header-user">
              {onBack && (
                <button className="chat-back-btn" onClick={onBack} title="Назад к списку диалогов">
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="chat-avatar-status-wrap">
                <img
                  src={otherUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.email}`}
                  alt={otherUser.full_name || 'Собеседник'}
                  className="chat-header-avatar"
                />
                <span className={`chat-avatar-indicator ${connected ? 'online' : 'offline'}`} />
              </div>
              <div className="chat-header-details">
                <div className="chat-header-name-row">
                  <strong>{otherUser.full_name || 'Студент'}</strong>
                  {otherUser.is_verified && (
                    <span className="verified-badge-tiny" title="Подтверждённый студент">
                      <ShieldCheck size={13} />
                    </span>
                  )}
                </div>
                <span className={`chat-connection-status ${connected ? 'connected' : 'connecting'}`}>
                  {connected ? 'В сети' : 'Подключение...'}
                </span>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Закрыть">
              <X size={18} />
            </button>
          </div>

          {conversation.product_title && (
            <div className="chat-product-context">
              <div className="chat-product-context-left">
                <Tag size={13} className="chat-product-icon" />
                <span>Товар:</span>
                <strong>{conversation.product_title}</strong>
              </div>
              <span className={`deal-status-chip deal-status-${dealStatus}`}>
                {DEAL_LABELS[dealStatus] || dealStatus}
              </span>
            </div>
          )}

          <div className="chat-deal-panel">
            {statusError && <div className="chat-deal-error">{statusError}</div>}
            {isSeller && (
              <div className="chat-deal-actions">
                {dealStatus !== 'reserved' && dealStatus !== 'sold' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={statusLoading}
                    onClick={() => updateDealStatus('reserved')}
                  >
                    <Bookmark size={14} /> Забронировать
                  </button>
                )}
                {dealStatus !== 'sold' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={statusLoading}
                    onClick={() => updateDealStatus('sold')}
                  >
                    <CheckCircle2 size={14} /> Отметить проданным
                  </button>
                )}
                {(dealStatus === 'reserved' || dealStatus === 'sold' || dealStatus === 'cancelled') && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={statusLoading}
                    onClick={() => updateDealStatus('active')}
                  >
                    <RotateCcw size={14} /> Вернуть в продажу
                  </button>
                )}
              </div>
            )}
            {isBuyer && (
              <div className="chat-deal-buyer-row">
                <span className="chat-deal-hint">
                  {dealStatus === 'sold'
                    ? 'Сделка завершена — можете оставить отзыв продавцу'
                    : dealStatus === 'reserved'
                      ? 'Товар забронирован за вами'
                      : 'Дождитесь, пока продавец подтвердит сделку'}
                </span>
                {dealStatus === 'sold' && onLeaveReview && (
                  <button
                    type="button"
                    className="chat-leave-review-quick-btn"
                    onClick={() => onLeaveReview({
                      id: conversation.product,
                      title: conversation.product_title,
                      seller: conversation.seller,
                    })}
                  >
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>Оставить отзыв</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="chat-messages-list">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <p>Начните диалог первым сообщением 👋</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`chat-message ${isOwn ? 'chat-message-own' : 'chat-message-other'}`}
                  >
                    <div className="chat-message-bubble">
                      <span className="chat-message-text">{msg.text}</span>
                      <span className="chat-message-time">
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={connected ? 'Написать сообщение... (Enter для отправки)' : 'Подключение к чату...'}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!connected || !inputText.trim()}
              title="Отправить"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
