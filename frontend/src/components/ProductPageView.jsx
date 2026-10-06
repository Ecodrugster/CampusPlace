'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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
  Building2,
} from 'lucide-react';

export default function ProductPageView({
  product,
  currentUser,
  isFavorite,
  onToggleFavorite,
  onDeleteProduct,
  onEditProduct,
  onStartChat,
  onOpenSellerReviews,
  onLeaveReview,
  onReportProduct,
  onRequireAuth,
  onBack,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContacts, setShowContacts] = useState(false);
  const [copyHint, setCopyHint] = useState('');

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'];

  const formatPrice = (price) => `${new Intl.NumberFormat('ru-RU').format(price)} ₸`;

  const sellerId = product.seller_id || product.seller?.id;
  const isOwner = currentUser && currentUser.id === sellerId;
  const isSold = product.status === 'sold' || product.status === 'hidden';
  const isReserved = product.status === 'reserved';

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

  const handleStartChat = () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth('login');
      else alert('Войдите, чтобы написать продавцу');
      return;
    }
    onStartChat(product);
  };

  return (
    <div className="product-page">
      <header className="product-page-nav">
        <Link href="/" className="product-page-brand">
          <span className="product-page-brand-icon">
            <Building2 size={18} />
          </span>
          <span>
            Campus<span className="accent-text">Place</span>
          </span>
        </Link>
        <button type="button" className="btn btn-outline btn-sm" onClick={onBack}>
          <ArrowLeft size={14} /> В каталог
        </button>
      </header>

      <nav className="product-page-breadcrumb" aria-label="Хлебные крошки">
        <Link href="/catalog">Каталог</Link>
        <span>/</span>
        {product.category ? (
          <>
            <Link href={`/catalog?cat=${encodeURIComponent(product.category)}`}>{product.category}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="product-page-crumb-current">{product.title}</span>
      </nav>

      <div className="product-page-layout">
        <section className="product-page-gallery">
          <div className="product-page-main-image">
            <img
              src={images[activeImageIndex]}
              alt={product.title}
              className="product-page-active-img"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav-btn prev"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="gallery-nav-btn next"
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  aria-label="Следующее фото"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            {isSold && <span className="product-page-status-chip sold">Продано</span>}
            {isReserved && <span className="product-page-status-chip reserved">Забронировано</span>}
          </div>

          {images.length > 1 && (
            <div className="product-page-thumbs">
              {images.map((imgUrl, idx) => (
                <button
                  key={imgUrl + idx}
                  type="button"
                  className={`product-page-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img src={imgUrl} alt={`Фото ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="product-page-info">
          <div className="detail-header-badges">
            <span className="badge category-badge">{product.category}</span>
            <span className="badge condition-badge">{product.condition}</span>
            {isSold && <span className="badge sold-badge">Продано</span>}
            {isReserved && <span className="badge condition-badge">Забронировано</span>}
          </div>

          <h1 className="product-page-title">{product.title}</h1>

          <div className="product-page-price-row">
            <span className="product-page-price">{formatPrice(product.price)}</span>
            <button
              type="button"
              className={`detail-fav-btn ${isFavorite ? 'is-fav' : ''}`}
              onClick={() => onToggleFavorite(product.id)}
            >
              <Heart
                size={18}
                fill={isFavorite ? '#ef4444' : 'none'}
                color={isFavorite ? '#ef4444' : 'currentColor'}
              />
              <span>{isFavorite ? 'В избранном' : 'В избранное'}</span>
            </button>
          </div>

          <div className="detail-share-row">
            <button type="button" className="btn btn-outline btn-sm" onClick={copyProductLink}>
              <Link2 size={14} /> Поделиться
            </button>
            {copyHint && <span className="copy-hint">{copyHint}</span>}
          </div>

          <div className="product-page-meta-grid">
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
            <h2>Описание</h2>
            <p>{product.description}</p>
          </div>

          <div className="detail-divider" />

          {product.seller && (
            <div className="product-page-seller">
              <img
                src={product.seller.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${product.seller.email}`}
                alt={product.seller.full_name}
                className="seller-avatar product-page-seller-avatar"
              />
              <div className="seller-details">
                <div className="seller-name-row">
                  <h3>
                    <Link className="seller-profile-link" href={`/u/${sellerId}`}>
                      {product.seller.full_name}
                    </Link>
                  </h3>
                  {product.seller.is_verified && (
                    <span className="verified-badge-pill">
                      <ShieldCheck size={14} /> Verified Student
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="seller-rating-pill-btn"
                  onClick={() => onOpenSellerReviews && onOpenSellerReviews(product.seller)}
                >
                  <Star
                    size={13}
                    fill={product.seller.rating != null ? '#f59e0b' : 'none'}
                    color={product.seller.rating != null ? '#f59e0b' : 'var(--text-light)'}
                  />
                  <span>
                    {product.seller.rating != null
                      ? Number(product.seller.rating).toFixed(1)
                      : 'Нет отзывов'}
                  </span>
                  <span className="reviews-count-tag">({product.seller.reviews_count || 0})</span>
                </button>

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

                <Link href={`/u/${sellerId}`} className="btn btn-outline btn-sm product-page-seller-link">
                  Профиль продавца
                </Link>
              </div>
            </div>
          )}

          {isOwner ? (
            <div className="owner-actions-row">
              <button type="button" className="btn btn-outline owner-action-btn" onClick={() => onEditProduct(product)}>
                <Edit size={16} /> Редактировать
              </button>
              <button
                type="button"
                className="btn btn-danger owner-action-btn"
                onClick={() => {
                  if (window.confirm('Удалить это объявление?')) onDeleteProduct(product.id);
                }}
              >
                <Trash2 size={16} /> Удалить объявление
              </button>
            </div>
          ) : (
            <div className="product-page-actions">
              <button type="button" className="btn btn-primary btn-full-width" onClick={handleStartChat}>
                <MessageSquare size={18} /> Написать продавцу
              </button>

              <button
                type="button"
                className="btn btn-review btn-full-width"
                onClick={() => {
                  if (!currentUser) {
                    if (onRequireAuth) onRequireAuth('login');
                    else alert('Авторизуйтесь, чтобы оставить отзыв');
                    return;
                  }
                  if (onLeaveReview) onLeaveReview(product);
                }}
              >
                <Star size={17} /> Оставить отзыв о продавце
              </button>

              {!showContacts ? (
                <button
                  type="button"
                  className="btn btn-outline btn-full-width"
                  onClick={() => setShowContacts(true)}
                >
                  <Phone size={18} /> Показать контакты продавца
                </button>
              ) : (
                <div className="seller-contacts-box">
                  <h4>Контакты для связи</h4>
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
                      <Send size={16} /> Telegram ({product.seller.telegram})
                    </a>
                  ) : null}
                  <div className="safety-notice">
                    💡 <strong>Совет:</strong> встречайтесь в людных местах кампуса.
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
        </section>
      </div>

      {!isOwner && (
        <div className="product-page-mobile-bar">
          <div className="product-page-mobile-price">{formatPrice(product.price)}</div>
          <button type="button" className="btn btn-primary" onClick={handleStartChat}>
            <MessageSquare size={16} /> Написать
          </button>
        </div>
      )}
    </div>
  );
}
