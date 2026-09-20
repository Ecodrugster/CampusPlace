import React from 'react';
import { Heart, MapPin, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onSelect, 
  onToggleFavorite, 
  isFavorite = false 
}) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
  };

  const mainImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';

  const isSold = product.status === 'sold';

  return (
    <div className={`product-card ${isSold ? 'product-card-sold' : ''}`} onClick={() => onSelect(product)}>
      {/* Image Wrap */}
      <div className="card-image-wrap">
        <img 
          src={mainImage} 
          alt={product.title} 
          className="card-img"
          loading="lazy"
        />

        {/* Favorite Button */}
        <button 
          className={`card-fav-btn ${isFavorite ? 'is-fav' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          title={isFavorite ? 'Удалить из избранного' : 'В избранное'}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} color={isFavorite ? '#ef4444' : 'white'} />
        </button>

        {/* Status badges */}
        <div className="card-badges-container">
          <span className="badge category-badge">{product.category}</span>
          {isSold && <span className="badge sold-badge">Продано</span>}
        </div>
      </div>

      {/* Card Info */}
      <div className="card-content">
        <div className="card-price-row">
          <span className="card-price">{formatPrice(product.price)}</span>
          <span className="card-condition-tag">{product.condition || 'Отличное'}</span>
        </div>

        <h3 className="card-title" title={product.title}>
          {product.title}
        </h3>

        <div className="card-meta">
          <div className="card-location">
            <MapPin size={13} className="meta-icon" />
            <span className="location-text">{product.location || 'Кампус'}</span>
          </div>

          <div className="card-views">
            <Eye size={13} className="meta-icon" />
            <span>{product.views_count || 0}</span>
          </div>
        </div>

        {/* Seller brief */}
        {product.seller && (
          <div className="card-seller-row">
            <img 
              src={product.seller.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${product.seller.email}`} 
              alt={product.seller.full_name} 
              className="seller-micro-avatar"
            />
            <span className="seller-micro-name">{product.seller.full_name}</span>
            {product.seller.is_verified && (
              <span className="verified-micro-badge" title="Студент верифицирован">
                <ShieldCheck size={13} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
