import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  PlusCircle, 
  Heart, 
  User as UserIcon, 
  Sun, 
  Moon, 
  LogOut,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ 
  user, 
  theme, 
  onToggleTheme, 
  onOpenAuth, 
  onOpenCreate, 
  onOpenFavorites,
  onOpenProfile,
  onLogout,
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const categories = [
    'Все',
    'Учебники',
    'Электроника',
    'Для комнаты',
    'Одежда',
    'Спорт и хобби'
  ];

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Logo */}
        <div className="brand-logo" onClick={() => { onSelectCategory('Все'); onSearchChange(''); }}>
          <div className="logo-icon-box">
            <Building2 className="logo-icon" size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Campus<span className="accent-text">Place</span></span>
            <span className="brand-badge">СтудМаркет</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Искать учебники, наушники, чайник, лампу..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => onSearchChange('')}>
              ×
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Theme toggle */}
          <button 
            className="theme-btn" 
            onClick={onToggleTheme} 
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Sell button */}
          <button 
            className="btn btn-primary create-listing-btn"
            onClick={user ? onOpenCreate : () => onOpenAuth('login')}
          >
            <PlusCircle size={18} />
            <span>Продать</span>
          </button>

          {/* User / Favorites / Auth */}
          {user ? (
            <div className="user-nav-group">
              <button 
                className="icon-action-btn" 
                onClick={onOpenFavorites}
                title="Избранное"
              >
                <Heart size={20} />
              </button>

              <div className="user-profile-menu-container">
                <button 
                  className="user-profile-trigger"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <img 
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
                    alt={user.full_name} 
                    className="user-avatar-sm"
                  />
                  <div className="user-info-brief">
                    <span className="user-name-brief">{user.full_name.split(' ')[0]}</span>
                    {user.is_verified && (
                      <ShieldCheck size={14} className="verified-icon-badge" title="Подтверждённый студент" />
                    )}
                  </div>
                </button>

                {profileDropdownOpen && (
                  <>
                    <div className="menu-backdrop" onClick={() => setProfileDropdownOpen(false)} />
                    <div className="profile-dropdown-card">
                      <div className="profile-dropdown-header">
                        <strong>{user.full_name}</strong>
                        <span className="user-email-tag">{user.email}</span>
                        {user.is_verified && (
                          <span className="status-verified-chip">
                            <ShieldCheck size={12} /> Verified Student
                          </span>
                        )}
                      </div>
                      <div className="dropdown-divider" />
                      <button 
                        className="dropdown-item"
                        onClick={() => { setProfileDropdownOpen(false); onOpenProfile(); }}
                      >
                        <UserIcon size={16} />
                        <span>Мой профиль и товары</span>
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={() => { setProfileDropdownOpen(false); onOpenFavorites(); }}
                      >
                        <Heart size={16} />
                        <span>Избранное</span>
                      </button>
                      <div className="dropdown-divider" />
                      <button 
                        className="dropdown-item dropdown-logout"
                        onClick={() => { setProfileDropdownOpen(false); onLogout(); }}
                      >
                        <LogOut size={16} />
                        <span>Выйти</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-btns-group">
              <button 
                className="btn btn-outline"
                onClick={() => onOpenAuth('login')}
              >
                Войти
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => onOpenAuth('register')}
              >
                Регистрация
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="category-bar-wrapper">
        <div className="category-scroll-container">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat === 'Все' && <Sparkles size={14} className="pill-icon" />}
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
