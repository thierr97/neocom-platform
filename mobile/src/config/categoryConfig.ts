/**
 * Configuration des catégories pour correspondre au design du site web
 * Emojis, couleurs et gradients par catégorie
 */

export interface CategoryStyle {
  icon: string;
  colors: string[]; // Gradient colors [start, end]
}

export const categoryStyles: Record<string, CategoryStyle> = {
  'telephonie': { icon: '📱', colors: ['#a855f7', '#7e22ce'] }, // purple-500 to purple-700
  'accessoires-telephonies': { icon: '📱', colors: ['#64748b', '#334155'] }, // slate-500 to slate-700
  'electronique': { icon: '🎧', colors: ['#3b82f6', '#1d4ed8'] }, // blue-500 to blue-700
  'voyage': { icon: '✈️', colors: ['#22d3ee', '#2563eb'] }, // cyan-400 to blue-600
  'auto-et-moto': { icon: '🚗', colors: ['#4b5563', '#1f2937'] }, // gray-600 to gray-800
  'maison': { icon: '🏠', colors: ['#fb923c', '#ea580c'] }, // orange-400 to orange-600
  'ameublement': { icon: '🪑', colors: ['#ef4444', '#be185d'] }, // red-500 to pink-700
  'art-de-la-table': { icon: '🍽️', colors: ['#475569', '#1e293b'] }, // slate-600 to slate-800
  'bougies-et-senteurs': { icon: '🕯️', colors: ['#fbbf24', '#d97706'] }, // amber-400 to amber-600
  'decoration': { icon: '🎨', colors: ['#f472b6', '#ec4899'] }, // pink-400 to pink-600
  'mode': { icon: '👗', colors: ['#a855f7', '#db2777'] }, // purple-500 to pink-600
  'accessoires': { icon: '👜', colors: ['#ec4899', '#be185d'] }, // pink-500 to pink-700
  'bijoux': { icon: '💍', colors: ['#facc15', '#ca8a04'] }, // yellow-400 to yellow-600
  'beaute': { icon: '💄', colors: ['#f472b6', '#fb7185'] }, // pink-400 to rose-500
  'beaute-et-parfum': { icon: '💄', colors: ['#f472b6', '#fb7185'] },
  'beaute-et-parfums': { icon: '💄', colors: ['#f472b6', '#fb7185'] },
  'sante': { icon: '🏥', colors: ['#4ade80', '#16a34a'] }, // green-400 to green-600
  'sport': { icon: '⚽', colors: ['#06b6d4', '#0e7490'] }, // cyan-500 to cyan-700
  'loisirs': { icon: '🎮', colors: ['#6366f1', '#4338ca'] }, // indigo-500 to indigo-700
  'alimentaire': { icon: '🍎', colors: ['#4f46e5', '#7c3aed'] }, // indigo-600 to purple-700
  'epicerie': { icon: '🛒', colors: ['#22c55e', '#15803d'] }, // green-500 to green-700
  'animalerie': { icon: '🐾', colors: ['#64748b', '#334155'] }, // slate-500 to slate-700
  'bebe': { icon: '👶', colors: ['#7dd3fc', '#3b82f6'] }, // blue-300 to blue-500
  'bricolage': { icon: '🔧', colors: ['#f97316', '#c2410c'] }, // orange-500 to orange-700
  'jardin': { icon: '🌱', colors: ['#4ade80', '#16a34a'] }, // green-400 to green-600
  'bureautique': { icon: '💻', colors: ['#2563eb', '#1e40af'] }, // blue-600 to blue-800
  'informatique': { icon: '🖥️', colors: ['#374151', '#111827'] }, // gray-700 to gray-900
  'bazar': { icon: '🎁', colors: ['#64748b', '#334155'] }, // slate-500 to slate-700
  'divers': { icon: '📦', colors: ['#6b7280', '#374151'] }, // gray-500 to gray-700
  'a-categoriser': { icon: '📦', colors: ['#9ca3af', '#4b5563'] }, // gray-400 to gray-600
};

/**
 * Récupère le style d'une catégorie par son slug
 */
export function getCategoryStyle(slug: string): CategoryStyle {
  return categoryStyles[slug] || { icon: '📦', colors: ['#9ca3af', '#4b5563'] };
}

/**
 * Récupère l'emoji d'une catégorie
 */
export function getCategoryIcon(slug: string): string {
  return getCategoryStyle(slug).icon;
}

/**
 * Récupère les couleurs de gradient d'une catégorie
 */
export function getCategoryColors(slug: string): string[] {
  return getCategoryStyle(slug).colors;
}
