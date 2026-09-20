import React from 'react';
import { BookOpen, Laptop, Home, ShoppingBag, ShieldCheck, ArrowRight } from 'lucide-react';

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
          Учебники, конспекты, техника и всё для комфортной жизни в общежитии. 
          Быстрая и безопасная передача из рук в руки без комиссии.
        </p>

        <div className="hero-quick-tags">
          <button className="quick-tag-btn" onClick={() => onSelectCategory('Учебники')}>
            <BookOpen size={15} /> Учебники и лекции
          </button>
          <button className="quick-tag-btn" onClick={() => onSelectCategory('Электроника')}>
            <Laptop size={15} /> Электроника
          </button>
          <button className="quick-tag-btn" onClick={() => onSelectCategory('Для комнаты')}>
            <Home size={15} /> Вещи для общежития
          </button>
        </div>
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
