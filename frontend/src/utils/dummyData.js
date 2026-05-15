import { getPremiumImage } from './productImages';

export const DUMMY_PRODUCTS = [
  // Polo T-shirts
  { id: 101, name: 'Premium Knitted Polo', category_name: 'polo-t-shirts', subcategory: 'Knitted Polos', price: 4500, brand_name: 'Prince Esquire', slug: 'premium-knitted-polo' },
  { id: 102, name: 'Classic Silk Polo', category_name: 'polo-t-shirts', subcategory: 'Polos', price: 3800, brand_name: 'Prince Esquire', slug: 'classic-silk-polo' },
  
  // Shoes
  { id: 201, name: 'Handcrafted Oxford', category_name: 'shoes', subcategory: 'Formal shoes', price: 12500, brand_name: 'Santoni', slug: 'handcrafted-oxford' },
  { id: 202, name: 'Italian Leather Loafer', category_name: 'shoes', subcategory: 'Loafers', price: 9800, brand_name: 'Santoni', slug: 'italian-leather-loafer' },
  { id: 203, name: 'Suede Chelsea Boot', category_name: 'shoes', subcategory: 'Boots', price: 11000, brand_name: 'Prince Esquire', slug: 'suede-chelsea-boot' },
  { id: 204, name: 'Casual Leather Sneaker', category_name: 'shoes', subcategory: 'Casual', price: 7500, brand_name: 'Prince Esquire', slug: 'casual-leather-sneaker' },
  { id: 205, name: 'Leather Greek Sandals', category_name: 'shoes', subcategory: 'Sandals', price: 4500, brand_name: 'Prince Esquire', slug: 'leather-greek-sandals' },

  // Shirts
  { id: 301, name: 'Presidential Poplin Shirt', category_name: 'shirts', subcategory: 'Presidential', price: 5500, brand_name: 'Prince Esquire', slug: 'presidential-poplin-shirt' },
  { id: 302, name: 'Executive White Formal', category_name: 'shirts', subcategory: 'Formal shirts', price: 4800, brand_name: 'Prince Esquire', slug: 'executive-white-formal' },
  { id: 303, name: 'Casual Button-Down', category_name: 'shirts', subcategory: 'Casual', price: 3500, brand_name: 'Prince Esquire', slug: 'casual-button-down' },

  // Suits
  { id: 401, name: 'Navy Two-Piece Power Suit', category_name: 'suits', subcategory: 'Two piece', price: 35000, brand_name: 'Zegna', slug: 'navy-two-piece-power-suit' },
  { id: 402, name: 'Charcoal Three-Piece Ensemble', category_name: 'suits', subcategory: 'Three piece', price: 45000, brand_name: 'Prince Esquire', slug: 'charcoal-three-piece-ensemble' },

  // Blazers (under More)
  { id: 501, name: 'Italian Wool Blazer', category_name: 'more', subcategory: 'Blazers', price: 18500, brand_name: 'Prince Esquire', slug: 'italian-wool-blazer' },

  // Track Suits (under More)
  { id: 601, name: 'Velvet Tech Tracksuit', category_name: 'more', subcategory: 'Track Suits', price: 12000, brand_name: 'Prince Esquire', slug: 'velvet-tech-tracksuit' },

  // Jackets (under More)
  { id: 701, name: 'Harrington Bomber Jacket', category_name: 'more', subcategory: 'Jackets', price: 9500, brand_name: 'Prince Esquire', slug: 'harrington-bomber-jacket' },
  { id: 702, name: 'Quilted Half Jacket', category_name: 'more', subcategory: 'Half jackets', price: 6500, brand_name: 'Prince Esquire', slug: 'quilted-half-jacket' },

  // Trousers
  { id: 801, name: 'Classic Khaki Chinos', category_name: 'trousers', subcategory: 'Khaki', price: 4200, brand_name: 'Dockers', slug: 'classic-khaki-chinos' },
  { id: 802, name: 'Formal Wool Trousers', category_name: 'trousers', subcategory: 'Formal', price: 5500, brand_name: 'Prince Esquire', slug: 'formal-wool-trousers' },
  { id: 803, name: 'Selvage Indigo Jeans', category_name: 'trousers', subcategory: 'Jeans', price: 6800, brand_name: 'Prince Esquire', slug: 'selvage-indigo-jeans' },
  { id: 804, name: 'Gurkha Signature Pants', category_name: 'trousers', subcategory: 'Gurkha', price: 7500, brand_name: 'Prince Esquire', slug: 'gurkha-signature-pants' },

  // Linen
  { id: 901, name: 'Breezy Linen Set', category_name: 'linen', subcategory: 'Linen Set', price: 12500, brand_name: 'Prince Esquire', slug: 'breezy-linen-set' },
  { id: 902, name: 'White Linen Shirt', category_name: 'linen', subcategory: 'Linen shirts', price: 4500, brand_name: 'Prince Esquire', slug: 'white-linen-shirt' },
  { id: 903, name: 'Relaxed Linen Trousers', category_name: 'linen', subcategory: 'Linen Trousers', price: 5800, brand_name: 'Prince Esquire', slug: 'relaxed-linen-trousers' },
  { id: 904, name: 'Linen Summer Shorts', category_name: 'linen', subcategory: 'Linen shorts', price: 3500, brand_name: 'Prince Esquire', slug: 'linen-summer-shorts' },

  // Sweaters (under More)
  { id: 1201, name: 'Cashmere V-Neck Sweater', category_name: 'more', subcategory: 'Sweaters', price: 8500, brand_name: 'Prince Esquire', slug: 'cashmere-v-neck-sweater' },
  { id: 1202, name: 'Cable Knit Crewneck', category_name: 'more', subcategory: 'Sweaters', price: 7200, brand_name: 'Prince Esquire', slug: 'cable-knit-crewneck' },

  // T-shirts (under More)
  { id: 1001, name: 'Tech-Fabric Sweatshirt', category_name: 'more', subcategory: 'Sweat-shirts', price: 4500, brand_name: 'Prince Esquire', slug: 'tech-fabric-sweatshirt' },
  { id: 1002, name: 'Egyptian Cotton Round-neck', category_name: 'more', subcategory: 'Round-neck T-shirts', price: 2500, brand_name: 'Prince Esquire', slug: 'egyptian-cotton-round-neck' },
  { id: 1003, name: 'Premium V-neck Basic', category_name: 'more', subcategory: 'V-neck T-shirts', price: 2500, brand_name: 'Prince Esquire', slug: 'premium-v-neck-basic' },

  // Accessories (under More)
  { id: 1101, name: 'Silk Pocket Square & Tie', category_name: 'more', subcategory: 'Belts & Ties', price: 3500, brand_name: 'Prince Esquire', slug: 'silk-pocket-square-tie' },
  { id: 1102, name: 'Full Grain Leather Belt', category_name: 'more', subcategory: 'Belts & Ties', price: 4200, brand_name: 'Prince Esquire', slug: 'full-grain-leather-belt' },
  { id: 1103, name: 'Wool Fedora Hat', category_name: 'more', subcategory: 'Caps & Hats', price: 5500, brand_name: 'Prince Esquire', slug: 'wool-fedora-hat' },
];

export const getDummyProducts = (category = 'All', sub = 'All') => {
  let filtered = [...DUMMY_PRODUCTS];
  
  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category_name.toLowerCase() === category.toLowerCase());
  }
  
  if (sub && sub !== 'All') {
    filtered = filtered.filter(p => p.subcategory.toLowerCase() === sub.toLowerCase());
  }

  // Ensure they have images and formatted labels
  return filtered.map(p => ({
    ...p,
    thumbnail: getPremiumImage(p),
    description: `Exquisite ${p.name} from our latest collection. Crafted with precision and the finest materials.`,
    is_active: true,
    is_featured: p.id % 5 === 0,
    // Add display category name for UI
    category_display: p.category_name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }));
};
