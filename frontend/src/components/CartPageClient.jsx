'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  BadgePercent,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import AuthModal from './AuthModal';
import '../App.css';

const formatPrice = (price) =>
  `${new Intl.NumberFormat('ru-RU').format(Math.round(Number(price) || 0))} ₸`;

export default function CartPageClient() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить корзину');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('cp_theme') || 'light');
    document.title = 'Корзина — CampusPlace';
    const user = api.getCurrentUser();
    setCurrentUser(user);
    if (!api.getAuthToken()) {
      setLoading(false);
      setAuthOpen(true);
      return;
    }
    loadCart();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.removeFromCart(productId);
      await loadCart();
    } catch (err) {
      alert(err.message || 'Не удалось удалить');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Очистить корзину?')) return;
    try {
      await api.clearCart();
      await loadCart();
    } catch (err) {
      alert(err.message || 'Ошибка очистки');
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.checkoutCart();
      setSuccess(
        `Диалоги с продавцами: ${res.started}. Товары остаются в корзине, пока сделка не завершена. ` +
          (res.loyalty?.discount_percent
            ? `Бонус-скидка ${res.loyalty.discount_percent}% учтена в сообщениях.`
            : 'Пока скидка 0% — она вырастет после завершённых покупок.')
      );
      await loadCart();
      if (res.started > 0) {
        const firstId = res.conversations?.[0]?.id;
        setTimeout(() => {
          router.push(firstId ? `/?openChat=${firstId}` : '/');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'Не удалось оформить');
    } finally {
      setCheckingOut(false);
    }
  };

  const loyalty = cart?.loyalty;
  const items = cart?.items || [];

  return (
    <div className="cart-page">
      <header className="cart-topbar">
        <div className="cart-topbar-inner">
          <Link href="/" className="product-page-brand">
            <span className="product-page-brand-icon">
              <Building2 size={18} />
            </span>
            <span>
              Campus<span className="accent-text">Place</span>
            </span>
          </Link>
          <div className="cart-top-actions">
            <Link href="/catalog" className="btn btn-outline btn-sm">
              В каталог
            </Link>
            <Link href="/" className="btn btn-outline btn-sm">
              <ArrowLeft size={14} /> На главную
            </Link>
          </div>
        </div>
      </header>

      <main className="cart-main">
        <div className="cart-heading">
          <h1>
            <ShoppingCart size={22} /> Корзина
          </h1>
          <p>
            Соберите товары и напишите продавцам. Позиции остаются в корзине, пока вы или продавец
            не завершите покупку в чате.
          </p>
        </div>

        {loyalty && (
          <div className="loyalty-card">
            <div className="loyalty-card-icon">
              <BadgePercent size={22} />
            </div>
            <div className="loyalty-card-body">
              <h2>Бонусная скидка покупателя</h2>
              <p>
                Завершённых покупок: <strong>{loyalty.purchases_count}</strong>
                {' · '}
                Текущая скидка: <strong>{loyalty.discount_percent}%</strong>
                {' · '}
                Максимум: {loyalty.max_discount_percent}%
              </p>
              <div className="loyalty-bar">
                <div
                  className="loyalty-bar-fill"
                  style={{ width: `${(loyalty.discount_percent / loyalty.max_discount_percent) * 100}%` }}
                />
              </div>
              <p className="loyalty-hint">
                +{loyalty.discount_per_purchase}% за каждую покупку со статусом «продано».
                Следующий уровень: {loyalty.next_discount_percent}%.
              </p>
            </div>
          </div>
        )}

        {error && <div className="error-alert cart-alert">{error}</div>}
        {success && (
          <div className="success-alert cart-alert">
            <Sparkles size={16} /> {success}
          </div>
        )}

        {loading ? (
          <div className="page-loading">Загрузка корзины...</div>
        ) : !currentUser && !api.getAuthToken() ? (
          <div className="empty-catalog-state">
            <h3>Войдите, чтобы пользоваться корзиной</h3>
            <button type="button" className="btn btn-primary" onClick={() => setAuthOpen(true)}>
              Войти
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-catalog-state">
            <h3>Корзина пуста</h3>
            <p>Добавьте товары со страницы объявления или из каталога.</p>
            <Link href="/catalog" className="btn btn-primary">
              Открыть каталог
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => {
                const product = item.product;
                const img =
                  product.images?.[0] ||
                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
                return (
                  <article key={item.id} className="cart-item-card">
                    <Link href={`/product/${product.id}`} className="cart-item-image">
                      <img src={img} alt={product.title} />
                    </Link>
                    <div className="cart-item-info">
                      <Link href={`/product/${product.id}`} className="cart-item-title">
                        {product.title}
                      </Link>
                      <div className="cart-item-meta">
                        {product.category} · {product.seller?.full_name}
                      </div>
                      <div className="cart-item-prices">
                        {item.discount_percent > 0 ? (
                          <>
                            <span className="cart-price-old">{formatPrice(item.price)}</span>
                            <span className="cart-price-offer">{formatPrice(item.offer_price)}</span>
                            <span className="cart-price-badge">−{item.discount_percent}%</span>
                          </>
                        ) : (
                          <span className="cart-price-offer">{formatPrice(item.price)}</span>
                        )}
                      </div>
                      {item.chat_started && (
                        <div className="cart-item-chat-status">
                          {item.deal_status === 'reserved'
                            ? 'Забронировано · ждёт завершения покупки'
                            : item.deal_status === 'sold'
                              ? 'Куплено'
                              : 'Диалог с продавцом открыт'}
                          {item.conversation_id && (
                            <Link href={`/?openChat=${item.conversation_id}`} className="cart-open-chat-link">
                              Открыть чат
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm cart-item-remove"
                      onClick={() => handleRemove(product.id)}
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                );
              })}
              <button type="button" className="btn btn-outline btn-sm" onClick={handleClear}>
                Очистить корзину
              </button>
            </div>

            <aside className="cart-summary">
              <h3>Итого</h3>
              <div className="cart-summary-row">
                <span>Товаров</span>
                <strong>{cart.count}</strong>
              </div>
              <div className="cart-summary-row">
                <span>Сумма объявлений</span>
                <strong>{formatPrice(cart.subtotal)}</strong>
              </div>
              <div className="cart-summary-row">
                <span>С вашей скидкой</span>
                <strong className="cart-summary-accent">{formatPrice(cart.offer_total)}</strong>
              </div>
              {cart.savings > 0 && (
                <div className="cart-summary-row">
                  <span>Экономия</span>
                  <strong>{formatPrice(cart.savings)}</strong>
                </div>
              )}
              <p className="cart-summary-note">
                Оплата на CampusPlace не проходит: откроем чаты с предложением цены. Товары
                останутся здесь, пока сделка не будет завершена кнопкой «Завершить покупку»
                или «Отметить проданным».
              </p>
              <button
                type="button"
                className="btn btn-primary btn-full-width"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                <MessageSquare size={16} />
                {checkingOut ? 'Отправка...' : 'Написать продавцам'}
              </button>
            </aside>
          </div>
        )}
      </main>

      {authOpen && (
        <AuthModal
          initialMode="login"
          onClose={() => setAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthOpen(false);
            loadCart();
          }}
        />
      )}
    </div>
  );
}
