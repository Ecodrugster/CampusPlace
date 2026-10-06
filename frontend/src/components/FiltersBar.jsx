import React from 'react';
import { Sparkles, ArrowUpDown, GraduationCap, Building } from 'lucide-react';

export default function FiltersBar({
  totalFound,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sortBy,
  onSortByChange,
  verifiedOnly,
  onToggleVerifiedOnly,
  university,
  onUniversityChange,
  dormitory,
  onDormitoryChange,
  universities = [],
  dormitories = [],
  onResetFilters
}) {
  const hasActiveFilters =
    minPrice ||
    maxPrice ||
    verifiedOnly ||
    university ||
    dormitory ||
    sortBy !== 'newest';

  return (
    <div className="filters-bar-container">
      <div className="filters-left">
        <div className="found-count">
          Найдено: <strong>{totalFound}</strong> объявлений
        </div>

        <button
          className={`filter-chip ${verifiedOnly ? 'active' : ''}`}
          onClick={onToggleVerifiedOnly}
        >
          <Sparkles size={14} />
          <span>Только проверенные студенты 🟢</span>
        </button>
      </div>

      <div className="filters-right">
        <div className="campus-filter-group">
          <GraduationCap size={14} className="sort-icon" />
          <select
            value={university}
            onChange={(e) => onUniversityChange(e.target.value)}
            className="sort-select campus-select"
            title="Университет продавца"
          >
            <option value="">Все университеты</option>
            {universities.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="campus-filter-group">
          <Building size={14} className="sort-icon" />
          <select
            value={dormitory}
            onChange={(e) => onDormitoryChange(e.target.value)}
            className="sort-select campus-select"
            title="Общежитие / корпус продавца"
          >
            <option value="">Все общаги</option>
            {dormitories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="price-filter-group">
          <span className="filter-label">Цена (₸):</span>
          <input
            type="number"
            placeholder="от"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            className="filter-input-sm"
          />
          <span className="price-sep">—</span>
          <input
            type="number"
            placeholder="до"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            className="filter-input-sm"
          />
        </div>

        <div className="sort-group">
          <ArrowUpDown size={14} className="sort-icon" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
            <option value="popular">Популярные (просмотры)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button className="reset-filters-btn" onClick={onResetFilters}>
            Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
