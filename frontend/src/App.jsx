import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import FiltersBar from './components/FiltersBar';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import AuthModal from './components/AuthModal';
import CreateProductModal from './components/CreateProductModal';
import UserProfileModal from './components/UserProfileModal';
import { api } from './api';
import './App.css';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState('light');

  // Auth & User
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('cp_theme') || 'light';
      setTheme(savedTheme);
      setCurrentUser(api.getCurrentUser());
    }
  }, []);

  // Navigation & Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Products Data
  const [products, setProducts] = useState([]);
  const [userProducts, setUserProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        category: activeCategory,
        search: searchQuery,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        verified_only: verifiedOnly
      });
      setProducts(res.items || []);
    } catch (err) {
      console.error('Ошибка загрузки объявлений:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch favorites & user products if logged in
  const fetchUserData = async () => {
    if (!currentUser) {
      setFavorites([]);
      setUserProducts([]);
      return;
    }
    try {
      const [favs, userProds] = await Promise.all([
        api.getFavorites(),
        api.getProducts({ seller_id: currentUser.id, status_filter: 'all' })
      ]);
      setFavorites(favs || []);
      setUserProducts(userProds.items || []);
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeCategory, searchQuery, minPrice, maxPrice, verifiedOnly]);

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  // Auth Handlers
  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    fetchProducts();
    fetchUserData();
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setFavorites([]);
    setUserProducts([]);
  };

  // Toggle Favorite
  const handleToggleFavorite = async (productId) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    try {
      const res = await api.toggleFavorite(productId);
      if (res.is_favorite) {
        const prod = products.find((p) => p.id === productId);
        if (prod) setFavorites((prev) => [...prev, prod]);
      } else {
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
      }
      // Update local product list favorite flag
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_favorite: res.is_favorite } : p))
      );
    } catch (err) {
      alert(err.message || 'Ошибка обновления избранного');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это объявление?')) return;
    try {
      await api.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setUserProducts((prev) => prev.filter((p) => p.id !== productId));
      setSelectedProduct(null);
    } catch (err) {
      alert(err.message || 'Ошибка удаления товара');
    }
  };

  // Edit Product
  const handleEditProduct = (prod) => {
    setSelectedProduct(null);
    setProductToEdit(prod);
    setCreateModalOpen(true);
  };

  // Sorted Products
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else {
      // newest
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }, [products, sortBy]);

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setVerifiedOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="app-container">
      {/* Header / Navbar */}
      <Navbar
        user={currentUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={handleOpenAuth}
        onOpenCreate={() => { setProductToEdit(null); setCreateModalOpen(true); }}
        onOpenFavorites={() => setProfileModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <main className="main-content">
        {/* Hero banner (shown when no search and "Все" category) */}
        {!searchQuery && activeCategory === 'Все' && (
          <HeroBanner 
            onSelectCategory={setActiveCategory}
            onOpenCreate={() => (currentUser ? setCreateModalOpen(true) : handleOpenAuth('login'))}
            user={currentUser}
          />
        )}

        {/* Filters and sorting bar */}
        <FiltersBar 
          totalFound={sortedProducts.length}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          verifiedOnly={verifiedOnly}
          onToggleVerifiedOnly={() => setVerifiedOnly(!verifiedOnly)}
          onResetFilters={handleResetFilters}
        />

        {/* Catalog Grid */}
        {loading ? (
          <div className="empty-catalog-state">
            <p>Загрузка каталога студенческих товаров...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="empty-catalog-state">
            <h3>Товары не найдены</h3>
            <p>Попробуйте изменить поисковый запрос или сбросить фильтры цены и категорий.</p>
            <button className="btn btn-outline" onClick={handleResetFilters}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favorites.some((f) => f.id === product.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {authModalOpen && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          currentUser={currentUser}
          isFavorite={favorites.some((f) => f.id === selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onToggleFavorite={handleToggleFavorite}
          onDeleteProduct={handleDeleteProduct}
          onEditProduct={handleEditProduct}
        />
      )}

      {createModalOpen && (
        <CreateProductModal
          productToEdit={productToEdit}
          onClose={() => { setCreateModalOpen(false); setProductToEdit(null); }}
          onSuccess={(savedProduct) => {
            fetchProducts();
            fetchUserData();
          }}
        />
      )}

      {profileModalOpen && (
        <UserProfileModal
          user={currentUser}
          userProducts={userProducts}
          favorites={favorites}
          onClose={() => setProfileModalOpen(false)}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
          onToggleFavorite={handleToggleFavorite}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
