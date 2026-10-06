import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  MapPin, 
  Eye, 
  Calendar, 
  ShieldCheck, 
  Phone, 
  Send, 
  MessageSquare,
  Building,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Star,
  Flag,
  Link2,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function ProductDetailModal({ 
  product, 
  currentUser, 
  isFavorite, 
  onClose, 
  onToggleFavorite,
  onDeleteProduct,
  onEditProduct,
  onStartChat,
  onOpenSellerReviews,
  onLeaveReview,
  onReportProduct,
  onRequireAuth
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContacts, setShowContacts] = useState(false);
  const [copyHint, setCopyHint] = useState('');

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
  };

  const handleStartChat = async () => {
    if (!currentUser) {
      alert('Пожалуйста, войдите в аккаунт, чтобы написать продавцу');
      return;
    }
    try {
      const conv = await api.startConversation(product.id);
      onStartChat(conv);
    } catch (err) {
      alert(err.message || 'Не удалось начать чат');
    }
  };

  const sellerId = product.seller_id || product.seller?.id;
  const isOwner = currentUser && currentUser.id === sellerId;
  const isSold = product.status === 'sold' || product.status === 'hidden';

  const productPageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${product.id}`
    : `/product/${product.id}`;

  const copyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(productPageUrl);
      setCopyHint('Ссылка скопирована');
      setTimeout(() => setCopyHint(''), 2000);
    } catch {
      setCopyHint(productPageUrl);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-lg">
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="product-detail-layout">
          {/* Left: Gallery */}
          <div className="detail-gallery-section">
            <div className="main-gallery-view">
              <img 
                src={images[activeImageIndex]} 
                alt={product.title} 
                className="gallery-active-img"
              />
              {images.length > 1 && (
                <>
                  <button 
                    className="gallery-nav-btn prev"
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    className="gallery-nav-btn next"
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="thumbnails-row">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={imgUrl} alt={`Миниатюра ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="detail-info-section">
            <div className="detail-header-badges">
              <span className="badge category-badge">{product.category}</span>
              <span className="badge condition-badge">{product.condition}</span>
              {isSold && <span className="badge sold-badge">Продано</span>}
            </div>

            <h1 className="detail-title">{product.title}</h1>

            <div className="detail-share-row">
              <button type="button" className="btn btn-outline btn-sm" onClick={copyProductLink}>
                <Link2 size={14} /> Поделиться
              </button>
              <a className="btn btn-outline btn-sm" href={`/product/${product.id}`}>
                <ExternalLink size={14} /> Открыть страницу
              </a>
              {copyHint && <span className="copy-hint">{copyHint}</span>}
            </div>

            <div className="detail-price-box">
              <span className="detail-price">{formatPrice(product.price)}</span>
              <button 
                className={`detail-fav-btn ${isFavorite ? 'is-fav' : ''}`}
                onClick={() => onToggleFavorite(product.id)}
              >
                <Heart size={20} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'currentColor'} />
                <span>{isFavorite ? 'В избранном' : 'В избранное'}</span>
              </button>
            </div>

            <div className="detail-meta-list">
              <div className="detail-meta-item">
                <MapPin size={16} className="meta-icon" />
                <span><strong>Локация:</strong> {product.location || 'Кампус'}</span>
              </div>
              <div className="detail-meta-item">
                <Calendar size={16} className="meta-icon" />
                <span><strong>Опубликовано:</strong> {new Date(product.created_at).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="detail-meta-item">
                <Eye size={16} className="meta-icon" />
                <span><strong>Просмотров:</strong> {product.views_count ?? 0}</span>
              </div>
            </div>

            <div className="detail-divider" />

            <div className="detail-description-block">
              <h3>Описание товара</h3>
              <p>{product.description}</p>
            </div>

            <div className="detail-divider" />

            {/* Seller Card */}
            {product.seller && (
              <div className="detail-seller-card">
                <img 
                  src={product.seller.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${product.seller.email}`} 
                  alt={product.seller.full_name} 
                  className="seller-avatar"
                />
                <div className="seller-details">
                  <div className="seller-name-row">
                    <h4>
                      <a className="seller-profile-link" href={`/u/${sellerId}`}>
                        {product.seller.full_name}
                      </a>
                    </h4>
                    {product.seller.is_verified && (
                      <span className="verified-badge-pill">
                        <ShieldCheck size={14} /> Verified Student
                      </span>
                    )}
                  </div>
                  {product.seller.rating !== undefined && product.seller.rating !== null ? (
                    <button
                      type="button"
                      className="seller-rating-pill-btn"
                      onClick={() => onOpenSellerReviews && onOpenSellerReviews(product.seller)}
                      title="Посмотреть отзывы"
                    >
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <span>{Number(product.seller.rating).toFixed(1)}</span>
                      <span className="reviews-count-tag">({product.seller.reviews_count || 0})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="seller-rating-pill-btn"
                      onClick={() => onOpenSellerReviews && onOpenSellerReviews(product.seller)}
                      title="Посмотреть отзывы"
                    >
                      <Star size={13} color="var(--text-light)" />
                      <span>Нет отзывов</span>
                    </button>
                  )}
                  {product.seller.university && (
                    <div className="seller-subinfo">
                      <GraduationCap size={14} />
                      <span>{product.seller.university}</span>
                    </div>
                  )}
                  {product.seller.dormitory && (
                    <div className="seller-subinfo">
                      <Building size={14} />
                      <span>{product.seller.dormitory}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Owner Actions OR Buyer Contacts */}
            {isOwner ? (
              <div className="owner-actions-row">
                <button 
                  className="btn btn-outline owner-action-btn"
                  onClick={() => onEditProduct(product)}
                >
                  <Edit size={16} /> Редактировать
                </button>
                <button 
                  className="btn btn-danger owner-action-btn"
                  onClick={() => onDeleteProduct(product.id)}
                >
                  <Trash2 size={16} /> Удалить объявление
                </button>
              </div>
            ) : (
              <div className="buyer-contact-section">
                <button 
                  className="btn btn-primary btn-full-width"
                  onClick={handleStartChat}
                >
                  <MessageSquare size={18} /> Написать продавцу
                </button>

                <button
                  className="btn btn-review btn-full-width"
                  onClick={() => {
                    if (!currentUser) {
                      alert('Пожалуйста, авторизуйтесь, чтобы оставить отзыв');
                      return;
                    }
                    if (onLeaveReview) onLeaveReview(product);
                  }}
                >
                  <Star size={17} /> Оставить отзыв о продавце
                </button>

                {!showContacts ? (
                  <button 
                    className="btn btn-outline btn-full-width"
                    onClick={() => setShowContacts(true)}
                  >
                    <Phone size={18} /> Показать контакты продавца
                  </button>
                ) : (
                  <div className="seller-contacts-box">
                    <h4>Контакты для связи:</h4>
                    {product.seller?.phone ? (
                      <a href={`tel:${product.seller.phone}`} className="contact-link phone">
                        <Phone size={16} /> {product.seller.phone}
                      </a>
                    ) : (
                      <div className="text-muted-sm">Телефон не указан</div>
                    )}

                    {product.seller?.telegram ? (
                      <a 
                        href={`https://t.me/${product.seller.telegram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="contact-link telegram"
                      >
                        <Send size={16} /> Написать в Telegram ({product.seller.telegram})
                      </a>
                    ) : null}

                    <div className="safety-notice">
                      💡 <strong>Совет безопасности:</strong> Встречайтесь в людных местах кампуса (холл, библиотека или студенческая столовая).
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-report btn-full-width"
                  onClick={() => {
                    if (!currentUser) {
                      if (onRequireAuth) onRequireAuth('login');
                      else alert('Войдите, чтобы отправить жалобу');
                      return;
                    }
                    if (onReportProduct) onReportProduct(product);
                  }}
                >
                  <Flag size={16} /> Пожаловаться на объявление
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}