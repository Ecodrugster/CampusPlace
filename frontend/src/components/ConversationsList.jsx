import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Clock } from 'lucide-react';
import { api } from '../api';

export default function ConversationsList({ currentUser, onClose, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConversations()
      .then((data) => {
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Ошибка загрузки диалогов:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-chat">
        <div className="conversations-panel">
          <div className="conversations-header">
            <div className="conversations-header-title">
              <MessageSquare size={20} className="conversations-header-icon" />
              <h3>Сообщения</h3>
              {conversations.length > 0 && (
                <span className="conversations-count-badge">{conversations.length}</span>
              )}
            </div>
            <button className="modal-close-btn" onClick={onClose} title="Закрыть">
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="chat-empty-state">
              <div className="chat-loading-spinner" />
              <p>Загрузка диалогов...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-icon-wrap">
                <MessageSquare size={36} />
              </div>
              <h4>У вас пока нет диалогов</h4>
              <p>Нажмите «Написать продавцу» в любом объявлении, чтобы начать общение</p>
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conv) => {
                const otherUser = conv.buyer?.id === currentUser?.id ? conv.seller : conv.buyer;
                if (!otherUser) return null;
                const unread = conv.unread_count || 0;

                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${unread > 0 ? 'conversation-item-unread' : ''}`}
                    onClick={() => onSelectConversation(conv)}
                  >
                    <div className="conversation-avatar-wrap">
                      <img
                        src={otherUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser.email}`}
                        alt={otherUser.full_name || 'Пользователь'}
                        className="conversation-avatar"
                      />
                      {unread > 0 && <span className="conversation-unread-dot" />}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-info-top">
                        <strong className="conversation-user-name">{otherUser.full_name || 'Студент'}</strong>
                        <div className="conversation-meta-right">
                          {conv.last_message?.created_at && (
                            <span className="conversation-time">
                              <Clock size={11} />
                              {new Date(conv.last_message.created_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                          {unread > 0 && (
                            <span className="conversation-unread-badge">{unread > 99 ? '99+' : unread}</span>
                          )}
                        </div>
                      </div>
                      {conv.product_title && (
                        <span className="conversation-product-pill">
                          {conv.product_title}
                          {conv.deal_status && conv.deal_status !== 'active' ? ` · ${conv.deal_status}` : ''}
                        </span>
                      )}
                      <span className={`conversation-preview ${unread > 0 ? 'conversation-preview-unread' : ''}`}>
                        {conv.last_message ? conv.last_message.text : 'Нет сообщений'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
