import React from 'react';
import { Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

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
  onResetFilters
}) {
  const hasActiveFilters = minPrice || maxPrice || verifiedOnly || sortBy !== 'newest';

  return (
    <div className="filters-bar-container">
      <div className="filters-left">
        <div className="found-count">
          Найдено: <strong>{totalFound}</strong> объявлений
        </div>

        {/* Verified filter */}
        <button 
          className={`filter-chip ${verifiedOnly ? 'active' : ''}`}
          onClick={onToggleVerifiedOnly}
        >
          <Sparkles size={14} />
          <span>Только проверенные студенты 🟢</span>
        </button>
      </div>

      <div className="filters-right">
        {/* Price Inputs */}
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

        {/* Sort Select */}
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
