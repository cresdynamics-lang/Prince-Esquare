/** Default size options by product category (matches product detail page). */
export function sizesForCategoryName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('shoe') || n.includes('boot')) return ['39', '40', '41', '42', '43', '44', '45'];
  if (n.includes('khaki') || n.includes('trouser') || n.includes('pant') || n.includes('chino')) {
    return ['30', '32', '34', '36', '38'];
  }
  if (n.includes('shirt')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (n.includes('track')) return ['M', 'L', 'XL', 'XXL'];
  if (n.includes('outer')) return ['M', 'L', 'XL', 'XXL'];
  return ['M', 'L', 'XL', 'XXL'];
}
