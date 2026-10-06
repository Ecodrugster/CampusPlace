import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import FiltersBar from './components/FiltersBar';
import ProductCard from './components/ProductCard';
import ProductDetailModal from './components/ProductDetailModal';
import AuthModal from './components/AuthModal';
import CreateProductModal from './components/CreateProductModal';
import UserProfileModal from './components/UserProfileModal';
import { api } from './api';
import ConversationsList from './components/ConversationsList';
import ChatWindow from './components/ChatWindow';
import LeaveReviewModal from './components/LeaveReviewModal';
import SellerReviewsModal from './components/SellerReviewsModal';
import ReportModal from './components/ReportModal';
import ModerationModal from './components/ModerationModal';
import VerifyEmailModal from './components/VerifyEmailModal';
import './App.css';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

function readCatalogParamsFromUrl() {
  if (typeof window === 'undefined') {
    return {
      searchQuery: '',
      activeCategory: 'Все',
      minPrice: '',
      maxPrice: '',
      sortBy: 'newest',
      verifiedOnly: false,
      university: '',
      dormitory: '',
      page: 1,
    };
  }
  const p = new URLSearchParams(window.location.search);
  const sort = p.get('sort') || 'newest';
  const allowedSort = new Set(['newest', 'price_asc', 'price_desc', 'popular']);
  return {
    searchQuery: p.get('q') || '',
    activeCategory: p.get('cat') || 'Все',
    minPrice: p.get('min') || '',
    maxPrice: p.get('max') || '',
    sortBy: allowedSort.has(sort) ? sort : 'newest',
    verifiedOnly: p.get('verified') === '1',
    university: p.get('uni') || '',
    dormitory: p.get('dorm') || '',
    page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
  };
}

function buildCatalogQueryString(state) {
  const p = new URLSearchParams();
  if (typeof window !== 'undefined') {
    const current = new URLSearchParams(window.location.search);
    const openChat = current.get('openChat');
    if (openChat) p.set('openChat', openChat);
  }
  if (state.searchQuery) p.set('q', state.searchQuery);
  if (state.activeCategory && state.activeCategory !== 'Все') p.set('cat', state.activeCategory);
  if (state.minPrice) p.set('min', state.minPrice);
  if (state.maxPrice) p.set('max', state.maxPrice);
  if (state.sortBy && state.sortBy !== 'newest') p.set('sort', state.sortBy);
  if (state.verifiedOnly) p.set('verified', '1');
  if (state.university) p.set('uni', state.university);
  if (state.dormitory) p.set('dorm', state.dormitory);
  if (state.page > 1) p.set('page', String(state.page));
  return p.toString();
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState('light');

  // Auth & User
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cp_theme') || 'light';
    setTheme(savedTheme);
    const cached = api.getCurrentUser();
    setCurrentUser(cached);
    if (api.getAuthToken()) {
      api.getMe()
        .then((fresh) => setCurrentUser(fresh))
        .catch(() => {});
    }
  }, []);

  const initialUrlPageRef = useRef(1);

  // Navigation & Search & Filter States (URL applied after mount to avoid SSR hydration mismatch)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [university, setUniversity] = useState('');
  const [dormitory, setDormitory] = useState('');
  const [universities, setUniversities] = useState([]);
  const [dormitories, setDormitories] = useState([]);
  const [catalogReady, setCatalogReady] = useState(false);

  // Products Data
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const skipUrlSyncRef = useRef(true);
  const isFirstCatalogFetchRef = useRef(true);
  const filtersKeyRef = useRef('');

  // --- ЧАТЫ ---
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('products');

  // Reviews Modals
  const [leaveReviewProduct, setLeaveReviewProduct] = useState(null);
  const [reviewsModalSeller, setReviewsModalSeller] = useState(null);

  // Sprint A: reports / moderation / email verify
  const [reportProduct, setReportProduct] = useState(null);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [verifyEmailOpen, setVerifyEmailOpen] = useState(false);
  const [verifyAutoSend, setVerifyAutoSend] = useState(true);

  // Sprint B: unread messages
  const [unreadCount, setUnreadCount] = useState(0);

  const openProfile = (tab = 'products') => {
    setProfileInitialTab(tab);
    setProfileModalOpen(true);
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const catalogParams = () => ({
    category: activeCategory,
    search: debouncedSearch,
    min_price: minPrice ? parseFloat(minPrice) : undefined,
    max_price: maxPrice ? parseFloat(maxPrice) : undefined,
    verified_only: verifiedOnly,
    university: university || undefined,
    dormitory: dormitory || undefined,
    sort: sortBy,
  });

  const fetchCampusMeta = async () => {
    try {
      const data = await api.getCampusMeta();
      setUniversities(data.universities || []);
      setDormitories(data.dormitories || []);
    } catch (err) {
      console.error('Ошибка загрузки списка кампусов:', err);
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
        api.getProducts({ seller_id: currentUser.id, status_filter: 'all', page_size: 100 })
      ]);
      setFavorites(favs || []);
      setUserProducts(userProds.items || []);
    } catch (err) {
      console.error('Ошибка загрузки данных пользователя:', err);
    }
  };

  useEffect(() => {
    fetchCampusMeta();
  }, []);

  // Apply URL filters once on client mount
  useEffect(() => {
    const parsed = readCatalogParamsFromUrl();
    initialUrlPageRef.current = parsed.page;
    setSearchQuery(parsed.searchQuery);
    setDebouncedSearch(parsed.searchQuery);
    setActiveCategory(parsed.activeCategory);
    setMinPrice(parsed.minPrice);
    setMaxPrice(parsed.maxPrice);
    setSortBy(parsed.sortBy);
    setVerifiedOnly(parsed.verifiedOnly);
    setUniversity(parsed.university);
    setDormitory(parsed.dormitory);
    setCatalogReady(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    if (!catalogReady) return undefined;
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery, catalogReady]);

  // Load catalog when filters change
  useEffect(() => {
    if (!catalogReady) return undefined;
    let cancelled = false;
    const restorePages = isFirstCatalogFetchRef.current ? initialUrlPageRef.current : 1;
    isFirstCatalogFetchRef.current = false;
    const pageSize = restorePages > 1 ? PAGE_SIZE * restorePages : PAGE_SIZE;

    (async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          ...catalogParams(),
          page: 1,
          page_size: pageSize,
        });
        if (cancelled) return;
        setProducts(res.items || []);
        setTotalCount(res.total || 0);
        setHasMore(Boolean(res.has_more));
        setPage(restorePages > 1 ? restorePages : 1);
      } catch (err) {
        if (!cancelled) console.error('Ошибка загрузки объявлений:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [catalogReady, activeCategory, debouncedSearch, minPrice, maxPrice, verifiedOnly, university, dormitory, sortBy]);

  // Sync filters to URL (share + history)
  useEffect(() => {
    if (!catalogReady || typeof window === 'undefined') return;
    const qs = buildCatalogQueryString({
      searchQuery: debouncedSearch,
      activeCategory,
      minPrice,
      maxPrice,
      sortBy,
      verifiedOnly,
      university,
      dormitory,
      page,
    });
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl === currentUrl) {
      filtersKeyRef.current = JSON.stringify({
        debouncedSearch, activeCategory, minPrice, maxPrice, sortBy, verifiedOnly, university, dormitory,
      });
      skipUrlSyncRef.current = false;
      return;
    }

    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      window.history.replaceState({ catalog: true }, '', nextUrl);
      filtersKeyRef.current = JSON.stringify({
        debouncedSearch, activeCategory, minPrice, maxPrice, sortBy, verifiedOnly, university, dormitory,
      });
      return;
    }

    const filtersKey = JSON.stringify({
      debouncedSearch, activeCategory, minPrice, maxPrice, sortBy, verifiedOnly, university, dormitory,
    });
    if (filtersKey !== filtersKeyRef.current) {
      filtersKeyRef.current = filtersKey;
      window.history.pushState({ catalog: true }, '', nextUrl);
    } else {
      window.history.replaceState({ catalog: true }, '', nextUrl);
    }
  }, [catalogReady, debouncedSearch, activeCategory, minPrice, maxPrice, sortBy, verifiedOnly, university, dormitory, page]);

  // Browser back/forward restores catalog filters
  useEffect(() => {
    const onPopState = () => {
      const parsed = readCatalogParamsFromUrl();
      skipUrlSyncRef.current = true;
      isFirstCatalogFetchRef.current = true;
      initialUrlPageRef.current = parsed.page;
      setSearchQuery(parsed.searchQuery);
      setDebouncedSearch(parsed.searchQuery);
      setActiveCategory(parsed.activeCategory);
      setMinPrice(parsed.minPrice);
      setMaxPrice(parsed.maxPrice);
      setSortBy(parsed.sortBy);
      setVerifiedOnly(parsed.verifiedOnly);
      setUniversity(parsed.university);
      setDormitory(parsed.dormitory);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await api.getProducts({
        ...catalogParams(),
        page: nextPage,
        page_size: PAGE_SIZE,
      });
      setProducts((prev) => [...prev, ...(res.items || [])]);
      setTotalCount(res.total || 0);
      setHasMore(Boolean(res.has_more));
      setPage(nextPage);
    } catch (err) {
      console.error('Ошибка подгрузки объявлений:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!currentUser || !api.getAuthToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await api.getUnreadTotal();
      setUnreadCount(data.total || 0);
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    refreshUnreadCount();
    if (!currentUser) return undefined;
    const timer = setInterval(refreshUnreadCount, 25000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Deep-link from product/seller pages: /?openChat=<id>
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;
    const params = new URLSearchParams(window.location.search);
    const openChatId = params.get('openChat');
    if (!openChatId) return;
    api.getConversations()
      .then((list) => {
        const conv = (list || []).find((c) => String(c.id) === String(openChatId));
        if (conv) {
          setActiveConversation(conv);
          setChatModalOpen(true);
        }
      })
      .finally(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('openChat');
        window.history.replaceState({}, '', url.pathname + url.search);
      });
  }, [currentUser]);

  // Auth Handlers
  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    isFirstCatalogFetchRef.current = false;
    initialUrlPageRef.current = 1;
    setPage(1);
    (async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          ...catalogParams(),
          page: 1,
          page_size: PAGE_SIZE,
        });
        setProducts(res.items || []);
        setTotalCount(res.total || 0);
        setHasMore(Boolean(res.has_more));
      } catch (err) {
        console.error('Ошибка загрузки объявлений:', err);
      } finally {
        setLoading(false);
      }
    })();
    fetchUserData();
    // Only force verify modal right after registration (code already emailed).
    if (user && !user.is_verified && authModalMode === 'register') {
      setVerifyAutoSend(false);
      setVerifyEmailOpen(true);
    }
  };

  const openVerifyEmail = (autoSend = true) => {
    setVerifyAutoSend(autoSend);
    setVerifyEmailOpen(true);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setFavorites([]);
    setUserProducts([]);
    setUnreadCount(0);
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

  const handleSelectProduct = async (product) => {
    setSelectedProduct(product);
    try {
      const detailedProduct = await api.getProduct(product.id);
      setSelectedProduct(detailedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === detailedProduct.id ? { ...p, views_count: detailedProduct.views_count } : p))
      );
      setUserProducts((prev) =>
        prev.map((p) => (p.id === detailedProduct.id ? { ...p, views_count: detailedProduct.views_count } : p))
      );
    } catch (err) {
      console.error('Ошибка загрузки деталей товара:', err);
    }
  };

  const handleStartChat = async (product) => {
  try {
    const conv = await api.startConversation(product.id);
    setActiveConversation(conv);
    setChatModalOpen(true);
    setSelectedProduct(null); // закрыть модалку товара
  } catch (err) {
    alert(err.message || 'Не удалось начать чат');
  }
};

  // Edit Product
  const handleEditProduct = (prod) => {
    setSelectedProduct(null);
    setProductToEdit(prod);
    setCreateModalOpen(true);
  };

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setVerifiedOnly(false);
    setUniversity('');
    setDormitory('');
    setSearchQuery('');
    setActiveCategory('Все');
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
        onOpenFavorites={() => openProfile('favorites')}
        onOpenProfile={() => openProfile('products')}
        onOpenChats={() => setChatModalOpen(true)}
        onOpenModeration={() => setModerationOpen(true)}
        onOpenVerifyEmail={() => openVerifyEmail(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        unreadCount={unreadCount}
      />

      {currentUser && !currentUser.is_verified && (
        <div className="verify-banner">
          <span>Подтвердите email, чтобы получить статус Verified Student.</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openVerifyEmail(true)}>
            Подтвердить
          </button>
        </div>
      )}

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
          totalFound={totalCount}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          verifiedOnly={verifiedOnly}
          onToggleVerifiedOnly={() => setVerifiedOnly(!verifiedOnly)}
          university={university}
          onUniversityChange={setUniversity}
          dormitory={dormitory}
          onDormitoryChange={setDormitory}
          universities={universities}
          dormitories={dormitories}
          onResetFilters={handleResetFilters}
        />

        {/* Catalog Grid */}
        {loading ? (
          <div className="empty-catalog-state">
            <p>Загрузка каталога студенческих товаров...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-catalog-state">
            <h3>Товары не найдены</h3>
            <p>Попробуйте изменить поисковый запрос или сбросить фильтры цены и категорий.</p>
            <button className="btn btn-outline" onClick={handleResetFilters}>
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleSelectProduct}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={favorites.some((f) => f.id === product.id)}
                />
              ))}
            </div>
            {hasMore && (
              <div className="load-more-wrap">
                <button
                  type="button"
                  className="btn btn-outline load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Загрузка...' : `Показать ещё (${products.length} из ${totalCount})`}
                </button>
              </div>
            )}
          </>
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
          onStartChat={(conv) => {
            setActiveConversation(conv);
            setChatModalOpen(true);
            setSelectedProduct(null);
          }}
          onOpenSellerReviews={(seller) => setReviewsModalSeller(seller)}
          onLeaveReview={(prod) => setLeaveReviewProduct(prod)}
          onReportProduct={(prod) => setReportProduct(prod)}
          onRequireAuth={handleOpenAuth}
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
          initialTab={profileInitialTab}
          onClose={() => setProfileModalOpen(false)}
          onSelectProduct={handleSelectProduct}
          onToggleFavorite={handleToggleFavorite}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            fetchProducts();
          }}
        />
      )}

      {chatModalOpen && !activeConversation && (
        <ConversationsList
          currentUser={currentUser}
          onClose={() => setChatModalOpen(false)}
          onSelectConversation={(conv) => setActiveConversation(conv)}
        />
      )}

      {chatModalOpen && activeConversation && (
        <ChatWindow
          conversation={activeConversation}
          currentUser={currentUser}
          onClose={() => { setActiveConversation(null); setChatModalOpen(false); refreshUnreadCount(); }}
          onBack={() => { setActiveConversation(null); refreshUnreadCount(); }}
          onLeaveReview={(prod) => setLeaveReviewProduct(prod)}
          onDealStatusChanged={(updated) => {
            setActiveConversation(updated);
            fetchProducts();
          }}
          onMessagesRead={() => refreshUnreadCount()}
        />
      )}

      {leaveReviewProduct && (
        <LeaveReviewModal
          product={leaveReviewProduct}
          onClose={() => setLeaveReviewProduct(null)}
          onSuccess={() => {
            fetchProducts();
            fetchUserData();
          }}
        />
      )}

      {reviewsModalSeller && (
        <SellerReviewsModal
          seller={reviewsModalSeller}
          onClose={() => setReviewsModalSeller(null)}
        />
      )}

      {reportProduct && (
        <ReportModal
          product={reportProduct}
          onClose={() => setReportProduct(null)}
        />
      )}

      {moderationOpen && (
        <ModerationModal onClose={() => setModerationOpen(false)} />
      )}

      {verifyEmailOpen && currentUser && (
        <VerifyEmailModal
          user={currentUser}
          autoSend={verifyAutoSend}
          onClose={() => setVerifyEmailOpen(false)}
          onVerified={(updatedUser) => {
            setCurrentUser(updatedUser);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
