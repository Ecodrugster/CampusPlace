/** Shared catalog sections / product categories for CampusPlace */

export const CATALOG_SECTIONS = [
  {
    name: 'Для учёбы',
    slug: 'study',
    description: 'Учебники, тетради, канцелярия и всё для пар',
    emoji: '📚',
    accent: '#4f46e5',
  },
  {
    name: 'Женщинам',
    slug: 'women',
    description: 'Одежда и вещи для девушек кампуса',
    emoji: '👗',
    accent: '#db2777',
  },
  {
    name: 'Мужчинам',
    slug: 'men',
    description: 'Одежда и вещи для парней',
    emoji: '👕',
    accent: '#0284c7',
  },
  {
    name: 'Обувь',
    slug: 'shoes',
    description: 'Кроссовки, туфли, тапочки для общаги',
    emoji: '👟',
    accent: '#ea580c',
  },
  {
    name: 'Красота',
    slug: 'beauty',
    description: 'Уход, косметика и бьюти-гаджеты',
    emoji: '✨',
    accent: '#c026d3',
  },
  {
    name: 'Аксессуары',
    slug: 'accessories',
    description: 'Сумки, украшения, гаджеты и мелочи',
    emoji: '👜',
    accent: '#0d9488',
  },
  {
    name: 'Мебель',
    slug: 'furniture',
    description: 'Для комнаты и общежития: столы, полки, стулья',
    emoji: '🪑',
    accent: '#a16207',
  },
];

/** Categories available when creating/editing a product */
export const PRODUCT_CATEGORIES = [
  ...CATALOG_SECTIONS.map((s) => s.name),
  'Электроника',
  'Спорт и хобби',
  // legacy labels still present on older listings
  'Учебники',
  'Для комнаты',
  'Одежда',
];

/** Home navbar pills: All + main sections + a couple of extras */
export const NAV_CATEGORIES = ['Все', ...CATALOG_SECTIONS.map((s) => s.name), 'Электроника'];

export function findSectionByName(name) {
  return CATALOG_SECTIONS.find((s) => s.name === name) || null;
}

export function findSectionBySlug(slug) {
  return CATALOG_SECTIONS.find((s) => s.slug === slug) || null;
}
