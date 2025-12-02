import { Item } from './api';

/**
 * Get emoji for a furniture item based on its name and category
 */
export function getFurnitureEmoji(item: Item): string {
  const name = item.name.toLowerCase();
  const category = item.category?.toLowerCase() || '';

  // Check for specific furniture types in the name
  if (name.includes('table') || name.includes('desk')) {
    return '📋'; // Using clipboard emoji for tables/desks (represents flat surface)
  }
  if (name.includes('chair') || name.includes('seat')) {
    return '🪑';
  }
  if (name.includes('bed') || name.includes('mattress')) {
    return '🛏️';
  }
  if (name.includes('sofa') || name.includes('couch') || name.includes('loveseat')) {
    return '🛋️';
  }
  if (name.includes('dresser') || name.includes('drawer') || name.includes('cabinet')) {
    return '🗄️';
  }
  if (name.includes('lamp') || name.includes('light')) {
    return '💡';
  }
  if (name.includes('mirror')) {
    return '🪞';
  }
  if (name.includes('bookshelf') || name.includes('shelf')) {
    return '📚';
  }
  if (name.includes('pillow') || name.includes('cushion')) {
    return '🛏️';
  }
  if (name.includes('rug') || name.includes('carpet')) {
    return '🧶';
  }
  if (name.includes('curtain') || name.includes('drape')) {
    return '🪟';
  }
  if (name.includes('nightstand') || name.includes('end table')) {
    return '📋'; // Using clipboard emoji for nightstands/end tables
  }
  if (name.includes('wardrobe') || name.includes('closet')) {
    return '👔';
  }
  if (name.includes('ottoman') || name.includes('footstool')) {
    return '🪑';
  }

  // Check category
  if (category.includes('bedding')) {
    return '🛏️';
  }
  if (category.includes('lighting')) {
    return '💡';
  }
  if (category.includes('furniture')) {
    return '🪑';
  }

  // Default emoji for furniture
  return '🪑';
}

