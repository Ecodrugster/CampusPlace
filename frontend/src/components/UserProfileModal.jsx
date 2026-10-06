import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  GraduationCap,
  Building,
  ShieldCheck,
  Package,
  Heart,
  Edit3,
  Check,
  AlertCircle,
  Star,
  MessageSquareQuote,
  Calendar,
  Camera,
  Loader2,
} from 'lucide-react';
import ProductCard from './ProductCard';
import { api } from '../api';

function pluralizeReviews(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'отзыва';
  return 'отзывов';
}

export default function UserProfileModal({
  user,
  userProducts = [],
  favorites = [],
  onClose,
  onSelectProduct,
  onToggleFavorite,
  onUserUpdated,
  initialTab = 'products'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reviewsData, setReviewsData] = useState({ average_rating: 0, total_reviews: 0, reviews: [] });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  
  // Profile edit fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [dormitory, setDormitory] = useState(user?.dormitory || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setActiveTab(initialTab || 'products');
  }, [initialTab]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setUniversity(user.university || '');
    setFaculty(user.faculty || '');
    setDormitory(user.dormitory || '');
    setPhone(user.phone || '');
    setTelegram(user.telegram || '');
    setAvatarUrl(user.avatar_url || '');
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingReviews(true);
    setReviewsError('');
    api.getSellerReviews(user.id)
      .then((data) => {
        setReviewsData({
          average_rating: data.average_rating || 0,
          total_reviews: data.total_reviews || 0,
          reviews: data.reviews || []
        });
      })
      .catch((err) => {
        console.error('Ошибка загрузки отзывов профиля:', err);
        setReviewsError(err.message || 'Не удалось загрузить отзывы');
      })
      .finally(() => setLoadingReviews(false));
  }, [user?.id]);

  if (!user) return null;

  const displayAvatar =
    avatarUrl ||
    user.avatar_url ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`;

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Выберите файл изображения (JPG, PNG, WEBP)');
      setActiveTab('edit');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Аватар слишком большой. Максимум 5 МБ');
      setActiveTab('edit');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    setSaveSuccess(false);
    setActiveTab('edit');
    try {
      const uploaded = await api.uploadImage(file);
      const nextUrl = uploaded.url;
      setAvatarUrl(nextUrl);
      const updated = await api.updateProfile({ avatar_url: nextUrl });
      onUserUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResetAvatar = async () => {
    const fallback = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`;
    setUploadingAvatar(true);
    setError('');
    try {
      setAvatarUrl(fallback);
      const updated = await api.updateProfile({ avatar_url: fallback });
      onUserUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Не удалось сбросить аватар');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const updated = await api.updateProfile({
        full_name: fullName,
        university,
        faculty,
        dormitory,
        phone,
        telegram,
        avatar_url: avatarUrl || user.avatar_url || '',
      });
      onUserUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Ошибка обновления профиля');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-profile">
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="profile-avatar-file-input"
          onChange={handleAvatarFile}
        />

        {/* Profile Card Header */}
        <div className="profile-banner">
          <div className="profile-header-content">
            <button
              type="button"
              className="profile-avatar-edit-wrap"
              onClick={() => avatarInputRef.current?.click()}
              title="Сменить аватар"
              disabled={uploadingAvatar}
            >
              <img
                src={displayAvatar}
                alt={user.full_name}
                className="profile-avatar-large"
              />
              <span className="profile-avatar-edit-overlay">
                {uploadingAvatar ? <Loader2 size={18} className="spin" /> : <Camera size={18} />}
              </span>
            </button>
            <div className="profile-header-info">
              <div className="profile-name-row">
                <h2>{user.full_name}</h2>
                {user.is_verified && (
                  <span className="status-verified-chip">
                    <ShieldCheck size={14} /> Verified Student
                  </span>
                )}
              </div>
              <div className="profile-rating-badge-wrap">
                <div className="rating-score-badge">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <strong>{reviewsData.average_rating ? Number(reviewsData.average_rating).toFixed(1) : '0.0'}</strong>
                </div>
                <span className="profile-reviews-label">
                  ({reviewsData.total_reviews} {pluralizeReviews(reviewsData.total_reviews)})
                </span>
              </div>
              <p className="profile-university-tag">
                <GraduationCap size={15} /> {user.university || 'Студент кампуса'}
              </p>
              {user.dormitory && (
                <p className="profile-dorm-tag">
                  <Building size={14} /> {user.dormitory}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs-nav">
          <button
            className={`profile-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
            title="Мои товары"
          >
            <Package size={16} />
            <span>Товары ({userProducts.length})</span>
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
            title="Избранное"
          >
            <Heart size={16} />
            <span>Избранное ({favorites.length})</span>
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
            title="Отзывы"
          >
            <Star size={16} />
            <span>Отзывы ({reviewsData.total_reviews})</span>
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            title="Настройки профиля"
          >
            <Edit3 size={16} />
            <span>Профиль</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="profile-tab-body">
          {activeTab === 'products' && (
            <div className="profile-products-tab">
              {userProducts.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-icon-wrap">
                    <Package size={28} />
                  </div>
                  <h3>У вас пока нет активных объявлений</h3>
                  <p>Разместите свои учебники, конспекты или девайсы прямо сейчас!</p>
                </div>
              ) : (
                <div className="products-grid-profile">
                  {userProducts.map((prod) => (
                    <ProductCard 
                      key={prod.id} 
                      product={prod} 
                      onSelect={() => { onClose(); onSelectProduct(prod); }}
                      onToggleFavorite={onToggleFavorite}
                      isFavorite={favorites.some(f => f.id === prod.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="profile-favorites-tab">
              {favorites.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-icon-wrap empty-icon-heart">
                    <Heart size={28} />
                  </div>
                  <h3>В избранном пока пусто</h3>
                  <p>Нажимайте на сердечко у объявлений в каталоге, чтобы не потерять понравившиеся товары.</p>
                </div>
              ) : (
                <>
                  <div className="profile-tab-toolbar">
                    <span className="profile-tab-count">
                      Сохранено: <strong>{favorites.length}</strong>
                    </span>
                  </div>
                  <div className="products-grid-profile">
                    {favorites.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={() => { onClose(); onSelectProduct(prod); }}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={true}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="profile-reviews-tab">
              {loadingReviews ? (
                <div className="empty-tab-state">
                  <div className="chat-loading-spinner" />
                  <p>Загрузка отзывов...</p>
                </div>
              ) : reviewsError ? (
                <div className="empty-tab-state">
                  <div className="empty-icon-wrap">
                    <AlertCircle size={28} />
                  </div>
                  <h3>Не удалось загрузить отзывы</h3>
                  <p>{reviewsError}</p>
                </div>
              ) : reviewsData.reviews.length === 0 ? (
                <div className="empty-tab-state">
                  <div className="empty-icon-wrap empty-icon-star">
                    <MessageSquareQuote size={28} />
                  </div>
                  <h3>У вас пока нет отзывов</h3>
                  <p>Продавайте свои товары, чтобы покупатели могли оценивать сделки и оставлять отзывы.</p>
                </div>
              ) : (
                <>
                  <div className="profile-reviews-summary">
                    <div className="profile-reviews-summary-score">
                      <Star size={18} fill="#f59e0b" color="#f59e0b" />
                      <strong>{Number(reviewsData.average_rating || 0).toFixed(1)}</strong>
                      <span>средний рейтинг</span>
                    </div>
                    <span className="profile-tab-count">
                      {reviewsData.total_reviews} {pluralizeReviews(reviewsData.total_reviews)}
                    </span>
                  </div>
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
                            <div className="stars-row">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={15}
                                  fill={s <= rev.rating ? '#f59e0b' : 'none'}
                                  color={s <= rev.rating ? '#f59e0b' : 'var(--text-light)'}
                                />
                              ))}
                            </div>
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
                </>
              )}
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              {saveSuccess && (
                <div className="success-alert">
                  <Check size={16} />
                  <span>Профиль успешно обновлен!</span>
                </div>
              )}
              {error && (
                <div className="error-alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="profile-avatar-editor">
                <div className="profile-avatar-editor-preview">
                  <img src={displayAvatar} alt="Аватар" />
                </div>
                <div className="profile-avatar-editor-actions">
                  <h4>Фото профиля</h4>
                  <p>JPG, PNG или WEBP до 5 МБ. Новое фото сохраняется сразу после загрузки.</p>
                  <div className="profile-avatar-editor-btns">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Camera size={14} />
                      {uploadingAvatar ? 'Загрузка...' : 'Загрузить фото'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleResetAvatar}
                      disabled={uploadingAvatar}
                    >
                      Сбросить на стандартный
                    </button>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Имя и Фамилия</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
              </div>

              <div className="input-group">
                <label>Университет</label>
                <input 
                  type="text" 
                  value={university} 
                  onChange={(e) => setUniversity(e.target.value)} 
                />
              </div>

              <div className="input-row-2">
                <div className="input-group">
                  <label>Факультет</label>
                  <input 
                    type="text" 
                    value={faculty} 
                    onChange={(e) => setFaculty(e.target.value)} 
                  />
                </div>
                <div className="input-group">
                  <label>Корпус / Общежитие</label>
                  <input 
                    type="text" 
                    value={dormitory} 
                    onChange={(e) => setDormitory(e.target.value)} 
                  />
                </div>
              </div>

              <div className="input-row-2">
                <div className="input-group">
                  <label>Телефон (WhatsApp)</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
                <div className="input-group">
                  <label>Telegram username</label>
                  <input 
                    type="text" 
                    value={telegram} 
                    onChange={(e) => setTelegram(e.target.value)} 
                  />
                </div>
              </div>

              <div className="profile-edit-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить профиль'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
