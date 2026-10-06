import React from 'react';
import Link from 'next/link';
import { BookOpen, ShoppingBag, Sparkles, LayoutGrid, ShieldCheck } from 'lucide-react';

export default function HeroBanner({ onSelectCategory, onOpenCreate, user }) {
  return (
    <div className="hero-banner-wrap">
      <div className="hero-banner-content">
        <div className="hero-badge">
          <span className="pulse-dot" />
          <span>Студенческий маркетплейс кампуса #1</span>
        </div>
        <h1 className="hero-title">
          Покупай и продавай вещи прямо в <span className="gradient-text">своем университете</span>
        </h1>
        <p className="hero-subtitle">
          Для учёбы, одежда, обувь, красота, мебель и аксессуары — всё между студентами
          без комиссии и с быстрой встречей на кампусе.
        </p>

        <div className="hero-quick-tags">
          <button className="quick-tag-btn" onClick={() => onSelectCategory('Для учёбы')}>
            <BookOpen size={15} /> Для учёбы
          </button>
          <button className="quick-tag-btn" onClick={() => onSelectCategory('Женщинам')}>
            <Sparkles size={15} /> Женщинам
          </button>
          <button className="quick-tag-btn" onClick={() => onSelectCategory('Мужчинам')}>
            <ShoppingBag size={15} /> Мужчинам
          </button>
          <Link href="/catalog" className="quick-tag-btn quick-tag-link">
            <LayoutGrid size={15} /> Открыть каталог
          </Link>
        </div>

        {onOpenCreate && (
          <button type="button" className="btn btn-primary hero-cta-btn" onClick={onOpenCreate}>
            {user ? 'Разместить объявление' : 'Войти и продать'}
          </button>
        )}
      </div>

      <div className="hero-banner-graphic">
        <div className="graphic-floating-card top-right">
          <ShieldCheck size={20} className="icon-emerald" />
          <div>
            <strong>100% Студенты</strong>
            <span>Проверенные кампусы</span>
          </div>
        </div>

        <div className="graphic-floating-card bottom-left">
          <div className="delivery-icon-box">🏃‍♂️</div>
          <div>
            <strong>Быстрая встреча</strong>
            <span>В холле или столовой</span>
          </div>
        </div>
      </div>
    </div>
  );
}
