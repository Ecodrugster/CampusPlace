'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Search,
  LayoutGrid,
  ArrowLeft,
  Sun,
  Moon,
  PlusCircle,
} from 'lucide-react';
import { api } from '../api';
import { CATALOG_SECTIONS, findSectionByName, findSectionBySlug } from '../catalogCategories';
import FiltersBar from './FiltersBar';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import AuthModal from './AuthModal';
import '../App.css';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

function readCatalogUrl() {
  if (typeof window === 'undefined') {
    return { cat: 'Все', q: '', sort: 'newest', min: '', max: '', verified: false, uni: '', dorm: '', page: 1 };
  }
  const p = new URLSearchParams(window.location.search);
  const slug = p.get('section');
  const bySlug = slug ? findSectionBySlug(slug) : null;
  const cat = bySlug?.name || p.get('cat') || 'Все';
  const sort = p.get('sort') || 'newest';
  const allowed = new Set(['newest', 'price_asc', 'price_desc', 'popular']);
  return {
    cat,
    q: p.get('q') || '',
    sort: allowed.has(sort) ? sort : 'newest',
    min: p.get('min') || '',
    max: p.get('max') || '',
    verified: p.get('verified') === '1',
    uni: p.get('uni') || '',
    dorm: p.get('dorm') || '',
    page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
  };
}

function buildCatalogUrl(state) {
  const p = new URLSearchParams();
  const section = findSectionByName(state.cat);
  if (section) p.set('section', section.slug);
  else if (state.cat && state.cat !== 'Все') p.set('cat', state.cat);
  if (state.q) p.set('q', state.q);
  if (state.sort && state.sort !== 'newest') p.set('sort', state.sort);
  if (state.min) p.set('min', state.min);
  if (state.max) p.set('max', state.max);
  if (state.verified) p.set('verified', '1');
  if (state.uni) p.set('uni', state.uni);
  if (state.dorm) p.set('dorm', state.dorm);
  if (state.page > 1) p.set('page', String(state.page));
  const qs = p.toString();
  return qs ? `/catalog?${qs}` : '/catalog';
}

export default function CatalogPageClient() {
  const router = useRouter();
  const [theme, setTheme] = useState('light');
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  const [activeCategory, setActiveCategory] = useState('Все');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [university, setUniversity] = useState('');
  const [dormitory, setDormitory] = useState('');
  const [universities, setUniversities] = useState([]);
  const [dormitories, setDormitories] = useState([]);

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const initialPageRef = useRef(1);
  const firstFetchRef = useRef(true);
  const skipUrlRef = useRef(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cp_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.title = 'Каталог — CampusPlace';
    setCurrentUser(api.getCurrentUser());
    if (api.getAuthToken()) {
      api.getMe().then(setCurrentUser).catch(() => {});
    }

    const parsed = readCatalogUrl();
    initialPageRef.current = parsed.page;
    setActiveCategory(parsed.cat);
    setSearchQuery(parsed.q);
    setDebouncedSearch(parsed.q);
    setSortBy(parsed.sort);
    setMinPrice(parsed.min);
    setMaxPrice(parsed.max);
    setVerifiedOnly(parsed.verified);
    setUniversity(parsed.uni);
    setDormitory(parsed.dorm);
    setReady(true);

    api.getCampusMeta()
      .then((data) => {
        setUniversities(data.universities || []);
        setDormitories(data.dormitories || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cp_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery, ready]);

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    api.getFavorites().then((favs) => setFavorites(favs || [])).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    const restore = firstFetchRef.current ? initialPageRef.current : 1;
    firstFetchRef.current = false;
    const pageSize = restore > 1 ? PAGE_SIZE * restore : PAGE_SIZE;

    (async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          category: activeCategory,
          search: debouncedSearch,
          min_price: minPrice ? parseFloat(minPrice) : undefined,
          max_price: maxPrice ? parseFloat(maxPrice) : undefined,
          verified_only: verifiedOnly,
          university: university || undefined,
          dormitory: dormitory || undefined,
          sort: sortBy,
          page: 1,
          page_size: pageSize,
        });
        if (cancelled) return;
        setProducts(res.items || []);
        setTotalCount(res.total || 0);
        setHasMore(Boolean(res.has_more));
        setPage(restore > 1 ? restore : 1);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [ready, activeCategory, debouncedSearch, minPrice, maxPrice, verifiedOnly, university, dormitory, sortBy]);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') return;
    const next = buildCatalogUrl({
      cat: activeCategory,
      q: debouncedSearch,
      sort: sortBy,
      min: minPrice,
      max: maxPrice,
      verified: verifiedOnly,
      uni: university,
      dorm: dormitory,
      page,
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === next) {
      skipUrlRef.current = false;
      return;
    }
    if (skipUrlRef.current) {
      skipUrlRef.current = false;
      window.history.replaceState({ catalogPage: true }, '', next);
      return;
    }
    window.history.pushState({ catalogPage: true }, '', next);
  }, [ready, activeCategory, debouncedSearch, sortBy, minPrice, maxPrice, verifiedOnly, university, dormitory, page]);

  useEffect(() => {
    const onPop = () => {
      const parsed = readCatalogUrl();
      skipUrlRef.current = true;
      firstFetchRef.current = true;
      initialPageRef.current = parsed.page;
      setActiveCategory(parsed.cat);
      setSearchQuery(parsed.q);
      setDebouncedSearch(parsed.q);
      setSortBy(parsed.sort);
      setMinPrice(parsed.min);
      setMaxPrice(parsed.max);
      setVerifiedOnly(parsed.verified);
      setUniversity(parsed.uni);
      setDormitory(parsed.dorm);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await api.getProducts({
        category: activeCategory,
        search: debouncedSearch,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        verified_only: verifiedOnly,
        university: university || undefined,
        dormitory: dormitory || undefined,
        sort: sortBy,
        page: nextPage,
        page_size: PAGE_SIZE,
      });
      setProducts((prev) => [...prev, ...(res.items || [])]);
      setTotalCount(res.total || 0);
      setHasMore(Boolean(res.has_more));
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await api.toggleFavorite(productId);
      if (res.is_favorite) {
        const prod = products.find((p) => p.id === productId) || selectedProduct;
        if (prod) setFavorites((prev) => [...prev.filter((p) => p.id !== productId), prod]);
      } else {
        setFavorites((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      alert(err.message || 'Ошибка избранного');
    }
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

  const activeSection = findSectionByName(activeCategory);
  const showDashboard = activeCategory === 'Все' && !debouncedSearch;

  return (
    <div className="catalog-page app-container">
      <header className="catalog-topbar">
        <div className="catalog-topbar-inner">
          <Link href="/" className="product-page-brand">
            <span className="product-page-brand-icon">
              <Building2 size={18} />
            </span>
            <span>
              Campus<span className="accent-text">Place</span>
            </span>
          </Link>

          <div className="catalog-search">
            <Search size={16} className="catalog-search-icon" />
            <input
              type="text"
              placeholder="Поиск по каталогу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>

          <div className="catalog-top-actions">
            <button
              type="button"
              className="theme-btn"
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              title="Тема"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/" className="btn btn-outline btn-sm">
              <ArrowLeft size={14} /> На главную
            </Link>
            {currentUser ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => router.push('/')}
              >
                <PlusCircle size={14} /> Продать
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setAuthOpen(true)}>
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="catalog-main">
        <div className="catalog-heading">
          <div>
            <p className="catalog-kicker">
              <LayoutGrid size={14} /> Дашборд каталога
            </p>
            <h1>{activeSection ? activeSection.name : 'Все товары кампуса'}</h1>
            <p className="catalog-sub">
              {activeSection
                ? activeSection.description
                : 'Выберите раздел или сразу листайте объявления студентов'}
            </p>
          </div>
        </div>

        <div className="catalog-section-grid">
          <button
            type="button"
            className={`catalog-section-card ${activeCategory === 'Все' ? 'active' : ''}`}
            onClick={() => setActiveCategory('Все')}
          >
            <span className="catalog-section-emoji">🛒</span>
            <strong>Все</strong>
            <span>Весь каталог</span>
          </button>
          {CATALOG_SECTIONS.map((section) => (
            <button
              key={section.slug}
              type="button"
              className={`catalog-section-card ${activeCategory === section.name ? 'active' : ''}`}
              style={{ '--section-accent': section.accent }}
              onClick={() => setActiveCategory(section.name)}
            >
              <span className="catalog-section-emoji">{section.emoji}</span>
              <strong>{section.name}</strong>
              <span>{section.description}</span>
            </button>
          ))}
        </div>

        <FiltersBar
          totalFound={totalCount}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          verifiedOnly={verifiedOnly}
          onToggleVerifiedOnly={() => setVerifiedOnly((v) => !v)}
          university={university}
          onUniversityChange={setUniversity}
          dormitory={dormitory}
          onDormitoryChange={setDormitory}
          universities={universities}
          dormitories={dormitories}
          onResetFilters={handleResetFilters}
        />

        {showDashboard && (
          <div className="catalog-dashboard-note">
            Ниже — свежие объявления. Нажмите карточку раздела выше, чтобы сузить выдачу.
          </div>
        )}

        {loading ? (
          <div className="empty-catalog-state">
            <p>Загрузка каталога...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-catalog-state">
            <h3>В этом разделе пока пусто</h3>
            <p>Попробуйте другой фильтр или сбросьте параметры поиска.</p>
            <button type="button" className="btn btn-outline" onClick={handleResetFilters}>
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
                  onSelect={setSelectedProduct}
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

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          currentUser={currentUser}
          isFavorite={favorites.some((f) => f.id === selectedProduct.id)}
          onClose={() => setSelectedProduct(null)}
          onToggleFavorite={handleToggleFavorite}
          onDeleteProduct={async (id) => {
            await api.deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            setSelectedProduct(null);
          }}
          onEditProduct={() => router.push('/')}
          onStartChat={async () => {
            if (!currentUser) {
              setAuthOpen(true);
              return;
            }
            const conv = await api.startConversation(selectedProduct.id);
            router.push(`/?openChat=${conv.id}`);
          }}
          onOpenSellerReviews={() => {}}
          onLeaveReview={() => {}}
          onReportProduct={() => {}}
          onRequireAuth={() => setAuthOpen(true)}
        />
      )}

      {authOpen && (
        <AuthModal
          initialMode="login"
          onClose={() => setAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthOpen(false);
          }}
        />
      )}
    </div>
  );
}
