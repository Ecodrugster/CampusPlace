import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  GraduationCap, 
  Building, 
  Phone, 
  Send, 
  ShieldCheck, 
  Package, 
  Heart, 
  Edit3, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import ProductCard from './ProductCard';
import { api } from '../api';

export default function UserProfileModal({ 
  user, 
  userProducts, 
  favorites, 
  onClose, 
  onSelectProduct,
  onToggleFavorite,
  onUserUpdated
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'favorites', 'edit'
  
  // Profile edit fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [dormitory, setDormitory] = useState(user?.dormitory || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

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
        telegram
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-profile" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Profile Card Header */}
        <div className="profile-banner">
          <div className="profile-header-content">
            <img 
              src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
              alt={user.full_name} 
              className="profile-avatar-large"
            />
            <div className="profile-header-info">
              <div className="profile-name-row">
                <h2>{user.full_name}</h2>
                {user.is_verified && (
                  <span className="status-verified-chip">
                    <ShieldCheck size={14} /> Verified Student
                  </span>
                )}
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
          >
            <Package size={16} />
            <span>Мои товары ({userProducts.length})</span>
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={16} />
            <span>Избранное ({favorites.length})</span>
          </button>
          <button 
            className={`profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <Edit3 size={16} />
            <span>Настройки профиля</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="profile-tab-body">
          {activeTab === 'products' && (
            <div className="profile-products-tab">
              {userProducts.length === 0 ? (
                <div className="empty-tab-state">
                  <Package size={48} className="empty-icon" />
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
                  <Heart size={48} className="empty-icon" />
                  <h3>В избранном пока пусто</h3>
                  <p>Нажимайте на сердечко у объявлений в каталоге, чтобы не потерять понравившиеся товары.</p>
                </div>
              ) : (
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
