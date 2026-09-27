/** Default size options by product category (matches product detail page). */
export function sizesForCategoryName(name, parentName = '') {
  const n = `${parentName || ''} ${name || ''}`.toLowerCase();
  if (
    n.includes('shoe') ||
    n.includes('boot') ||
    n.includes('sneaker') ||
    n.includes('loafer') ||
    n.includes('sandal') ||
    (n.includes('shoes') && n.includes('casual'))
  ) {
    return ['38', '39', '40', '41', '42', '43', '44', '45', '46'];
  }
  if (n.includes('khaki') || n.includes('trouser') || n.includes('pant') || n.includes('chino')) {
    return ['28', '30', '32', '34', '36', '38', '40', '42'];
  }
  if (n.includes('shirt')) return ['M', 'L', 'XL', 'XXL', '3XL'];
  if (n.includes('track')) return ['M', 'L', 'XL', 'XXL'];
  if (n.includes('outer')) return ['M', 'L', 'XL', 'XXL'];
  return ['M', 'L', 'XL', 'XXL'];
}
