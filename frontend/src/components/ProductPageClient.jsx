'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../api';
import ProductPageView from './ProductPageView';
import AuthModal from './AuthModal';
import LeaveReviewModal from './LeaveReviewModal';
import SellerReviewsModal from './SellerReviewsModal';
import ReportModal from './ReportModal';
import '../App.css';

export default function ProductPageClient() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [product, setProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [leaveReviewProduct, setLeaveReviewProduct] = useState(null);
  const [reviewsSeller, setReviewsSeller] = useState(null);
  const [reportProduct, setReportProduct] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('cp_theme') || 'light');
    setCurrentUser(api.getCurrentUser());
  }, []);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError('');
    api.getProduct(productId)
      .then((data) => {
        setProduct(data);
        if (data?.title) document.title = `${data.title} — CampusPlace`;
      })
      .catch((err) => setError(err.message || 'Товар не найден'))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    api.getFavorites().then((favs) => setFavorites(favs || [])).catch(() => {});
  }, [currentUser]);

  const handleToggleFavorite = async (id) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await api.toggleFavorite(id);
      if (res.is_favorite) {
        setFavorites((prev) => (product ? [...prev.filter((p) => p.id !== id), product] : prev));
      } else {
        setFavorites((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Ошибка избранного');
    }
  };

  if (loading) {
    return <div className="page-loading">Загрузка объявления...</div>;
  }

  if (error || !product) {
    return (
      <div className="page-loading">
        <h3>{error || 'Товар не найден'}</h3>
        <a className="btn btn-primary" href="/">В каталог</a>
      </div>
    );
  }

  return (
    <>
      <ProductPageView
        product={product}
        currentUser={currentUser}
        isFavorite={favorites.some((f) => f.id === product.id)}
        onBack={() => router.push('/')}
        onToggleFavorite={handleToggleFavorite}
        onDeleteProduct={async (id) => {
          await api.deleteProduct(id);
          router.push('/');
        }}
        onEditProduct={() => router.push('/')}
        onStartChat={async () => {
          if (!currentUser) {
            setAuthOpen(true);
            return;
          }
          try {
            const conv = await api.startConversation(product.id);
            router.push(`/?openChat=${conv.id}`);
          } catch (err) {
            alert(err.message || 'Не удалось начать чат');
          }
        }}
        onOpenSellerReviews={(seller) => setReviewsSeller(seller)}
        onLeaveReview={(prod) => setLeaveReviewProduct(prod)}
        onReportProduct={(prod) => setReportProduct(prod)}
        onRequireAuth={() => setAuthOpen(true)}
      />

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
      {leaveReviewProduct && (
        <LeaveReviewModal
          product={leaveReviewProduct}
          onClose={() => setLeaveReviewProduct(null)}
        />
      )}
      {reviewsSeller && (
        <SellerReviewsModal
          seller={reviewsSeller}
          onClose={() => setReviewsSeller(null)}
        />
      )}
      {reportProduct && (
        <ReportModal
          product={reportProduct}
          onClose={() => setReportProduct(null)}
        />
      )}
    </>
  );
}
