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
  Edit
} from 'lucide-react';

export default function ProductDetailModal({ 
  product, 
  currentUser, 
  isFavorite, 
  onClose, 
  onToggleFavorite,
  onDeleteProduct,
  onEditProduct
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showContacts, setShowContacts] = useState(false);

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
  };

  const isOwner = currentUser && currentUser.id === product.seller_id;
  const isSold = product.status === 'sold';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
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
                <span><strong>Просмотров:</strong> {product.views_count || 1}</span>
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
                    <h4>{product.seller.full_name}</h4>
                    {product.seller.is_verified && (
                      <span className="verified-badge-pill">
                        <ShieldCheck size={14} /> Verified Student
                      </span>
                    )}
                  </div>
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
                {!showContacts ? (
                  <button 
                    className="btn btn-primary btn-full-width"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
