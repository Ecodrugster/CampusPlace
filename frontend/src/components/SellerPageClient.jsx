'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Star, Package, Building2 } from 'lucide-react';
import { api } from '../api';
import ProductCard from './ProductCard';
import SellerReviewsModal from './SellerReviewsModal';
import AuthModal from './AuthModal';
import '../App.css';

export default function SellerPageClient() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params?.id;

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('cp_theme') || 'light');
    setCurrentUser(api.getCurrentUser());
  }, []);

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    Promise.all([
      api.getSeller(sellerId),
      api.getProducts({ seller_id: sellerId, page_size: 100 }),
    ])
      .then(([sellerData, productsData]) => {
        setSeller(sellerData);
        setProducts(productsData.items || []);
        if (sellerData?.full_name) {
          document.title = `${sellerData.full_name} — CampusPlace`;
        }
      })
      .catch((err) => setError(err.message || 'Продавец не найден'))
      .finally(() => setLoading(false));
  }, [sellerId]);

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    api.getFavorites().then((favs) => setFavorites(favs || [])).catch(() => {});
  }, [currentUser]);

  const handleToggleFavorite = async (productId) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    const res = await api.toggleFavorite(productId);
    if (res.is_favorite) {
      const prod = products.find((p) => p.id === productId);
      if (prod) setFavorites((prev) => [...prev, prod]);
    } else {
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  if (loading) return <div className="page-loading">Загрузка профиля...</div>;
  if (error || !seller) {
    return (
      <div className="page-loading">
        <h3>{error || 'Продавец не найден'}</h3>
        <a className="btn btn-primary" href="/">В каталог</a>
      </div>
    );
  }

  return (
    <div className="seller-page">
      <div className="seller-page-top seller-page-top-row">
        <Link href="/" className="product-page-brand">
          <span className="product-page-brand-icon">
            <Building2 size={18} />
          </span>
          <span>
            Campus<span className="accent-text">Place</span>
          </span>
        </Link>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => router.push('/')}>
          <ArrowLeft size={14} /> В каталог
        </button>
      </div>

      <div className="seller-page-header">
        <img
          className="seller-page-avatar"
          src={seller.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${seller.email}`}
          alt={seller.full_name}
        />
        <div>
          <div className="seller-name-row">
            <h1>{seller.full_name}</h1>
            {seller.is_verified && (
              <span className="verified-badge-pill">
                <ShieldCheck size={14} /> Verified Student
              </span>
            )}
          </div>
          <p className="seller-page-meta">{seller.university}</p>
          <div className="seller-page-stats">
            <button type="button" className="seller-rating-pill-btn" onClick={() => setReviewsOpen(true)}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span>{seller.rating != null ? Number(seller.rating).toFixed(1) : '—'}</span>
              <span className="reviews-count-tag">({seller.reviews_count || 0})</span>
            </button>
            <span className="seller-page-count">
              <Package size={14} /> {seller.products_count ?? products.length} объявлений
            </span>
          </div>
        </div>
      </div>

      <h2 className="seller-page-section-title">Объявления продавца</h2>
      {products.length === 0 ? (
        <div className="empty-tab-state">
          <h4>Нет активных объявлений</h4>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={(prod) => router.push(`/product/${prod.id}`)}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favorites.some((f) => f.id === product.id)}
            />
          ))}
        </div>
      )}

      {reviewsOpen && (
        <SellerReviewsModal seller={seller} onClose={() => setReviewsOpen(false)} />
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
