import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import {
  SITE_URL,
  SOCIAL_INSTAGRAM,
  SOCIAL_FACEBOOK,
  SOCIAL_TIKTOK,
  CONTACT_EMAIL,
  CONTACT_PHONE,
} from '../seo/seoData';
import { WHATSAPP_NUMBER } from '../lib/storeContact';
import { trackContact } from '../lib/metaPixel';
import { canonicalShopPath } from '../data/taxonomy';
import FloatingSocial from './FloatingSocial';

const p = (slug) => canonicalShopPath(slug);

/**
 * Footer sitemap — 3 columns, full category tree with live /shop links.
 * Labels follow the locked architecture; hrefs map to current taxonomy paths.
 */
const FOOTER_COLUMNS = [
  [
    {
      title: 'Suits & Tailoring',
      href: p('suits'),
      links: [
        { name: 'Two-Piece Suits', href: p('two-piece') },
        { name: 'Three-Piece Suits', href: p('three-piece') },
        { name: 'Blazers', href: p('blazers'), note: 'also in Outerwear' },
        { name: 'Waistcoats / Vests', href: p('waistcoats'), note: 'also in Outerwear' },
      ],
    },
    {
      title: 'Shirts',
      href: p('shirts'),
      links: [
        { name: 'Formal Shirts', href: p('formal-shirts') },
        { name: 'Casual Shirts', href: p('shirts-casual') },
        { name: 'Presidential Shirts', href: p('formal-shirts') },
        { name: 'Polo Shirts', href: p('polo-t-shirts') },
        { name: 'T-Shirts', href: p('t-shirts') },
        { name: 'Long-Sleeve Shirts', href: p('shirts-casual') },
        {
          name: 'The Designer Edit',
          href: p('shirts'),
          nested: true,
          detail: 'Luca Faloni · Loro Piana',
        },
      ],
    },
    {
      title: 'Trousers',
      href: p('trousers'),
      links: [
        { name: 'Chino', href: p('chino') },
        { name: 'Khaki', href: p('khaki') },
        { name: 'Formal', href: p('trousers') },
        { name: 'Denim / Jeans', href: p('jeans') },
        { name: 'Cargo', href: p('cargo') },
      ],
    },
  ],
  [
    {
      title: 'Outerwear',
      href: p('jackets'),
      links: [
        { name: 'Full Jackets', href: p('full-jackets') },
        { name: 'Half Jackets', href: p('half-jackets') },
        { name: 'Sweaters', href: p('half-jackets') },
        { name: 'Blazers & Vests', href: p('jackets'), note: 'via cross-tag' },
      ],
    },
    {
      title: 'Tracksuits',
      href: p('track-tops'),
      links: [
        { name: 'Full Tracksuits', href: p('track-tops') },
        { name: 'Joggers', href: p('track-tops') },
        { name: 'Track Tops', href: p('track-tops') },
      ],
    },
    {
      title: 'Shoes',
      href: p('shoes'),
      links: [
        { name: 'Formal Shoes', href: p('formal-shoes') },
        {
          name: 'Official Line',
          href: p('formal-shoes'),
          nested: true,
          detail: 'Red Sole · Clarks',
        },
        { name: 'Bespoke Formal', href: p('bespoke-formal') },
        { name: 'Casual Shoes', href: p('casual') },
        {
          name: 'Suede Edit',
          href: p('casual'),
          nested: true,
        },
        { name: 'Loafers', href: p('loafers') },
        { name: 'Sandals', href: p('casual') },
      ],
    },
  ],
  [
    {
      title: 'Accessories',
      href: p('accessories'),
      links: [
        { name: 'Belts', href: p('belts') },
        { name: 'Ties', href: p('ties') },
        { name: 'Caps & Hats', href: p('caps') },
      ],
    },
    {
      title: 'The Linen Edit',
      href: p('linen-edit'),
      links: [
        { name: 'Linen Shirts', href: p('linen-shirts') },
        { name: 'Linen Trousers', href: p('linen-trousers') },
        { name: 'Linen Sets', href: p('linen-set') },
      ],
    },
    {
      title: 'Gift Sets & Boxes',
      href: p('gift-sets'),
      links: [{ name: 'Curated boxed sets', href: p('gift-sets') }],
    },
    {
      title: 'Permanent Anchors',
      href: '/new-arrivals',
      links: [
        { name: 'New Arrivals', href: '/new-arrivals', note: 'all categories' },
        { name: 'Sale', href: '/sale', note: 'all categories' },
      ],
    },
  ],
];

const FooterGroup = ({ group }) => (
  <div className="space-y-3">
    <Link
      to={group.href}
      className="block font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-gold-400 transition-colors hover:text-gold-200"
    >
      {group.title}
    </Link>
    <ul className="space-y-2">
      {group.links.map((link) => (
        <li key={`${group.title}-${link.name}`}>
          <Link
            to={link.href}
            className={`block text-[13px] font-light leading-snug text-navy-300 transition-colors hover:text-gold-400 ${
              link.nested ? 'pl-3 text-[12px] text-navy-400' : ''
            }`}
          >
            {link.nested ? (
              <span className="text-gold-500/50">↳ </span>
            ) : null}
            {link.name}
            {link.detail ? (
              <span className="mt-0.5 block pl-3 text-[11px] text-navy-500">{link.detail}</span>
            ) : null}
            {link.note ? (
              <span className="ml-1.5 text-[10px] text-navy-500">({link.note})</span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const phoneDisplay = CONTACT_PHONE.replace('+254', '0').replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2$3');

  return (
    <footer className="relative overflow-hidden border-t border-gold-500/10 bg-navy-950 pb-12 pt-20 md:pt-24">
      <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-5 sm:px-6">
        <div className="mb-6 flex flex-col gap-2 border-b border-gold-500/10 pb-8 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-gradient-gold font-serif text-2xl font-semibold tracking-[0.16em] md:text-3xl">
              PRINCE ESQUIRE
            </p>
            <p className="mt-2 font-sans text-[10px] font-medium uppercase tracking-[0.4em] text-gold-500/70">
              The Man&apos;s Shop
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-navy-400">
            <Link to="/contact-us" className="hover:text-gold-400">Contact</Link>
            <Link to="/blog" className="hover:text-gold-400">Style Journal</Link>
            <Link to="/shipping-returns" className="hover:text-gold-400">Delivery & Returns</Link>
            <Link to="/privacy-policy" className="hover:text-gold-400">Privacy</Link>
            <Link to="/size-guide" className="hover:text-gold-400">Size Guide</Link>
          </div>
        </div>

        {/* 3-column category sitemap */}
        <div className="mb-16 grid grid-cols-1 gap-12 sm:grid-cols-2 md:mb-20 lg:grid-cols-3 lg:gap-14">
          {FOOTER_COLUMNS.map((column, colIdx) => (
            <div key={`footer-col-${colIdx}`} className="space-y-10">
              {column.map((group) => (
                <FooterGroup key={group.title} group={group} />
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-8 border-y border-gold-500/10 py-10 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-navy-400">
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 text-xs hover:text-gold-400">
              <Mail size={14} className="text-gold-600" />
              {CONTACT_EMAIL}
            </a>
            <a href={`tel:${CONTACT_PHONE}`} className="flex items-center gap-2 text-xs hover:text-gold-400">
              <Phone size={14} className="text-gold-600" />
              {phoneDisplay}
            </a>
            <span className="flex items-center gap-2 text-xs">
              <MapPin size={14} className="text-gold-600" />
              Nairobi, Kenya
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={SOCIAL_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-navy-400 transition-colors hover:text-gold-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href={SOCIAL_FACEBOOK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-navy-400 transition-colors hover:text-gold-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href={SOCIAL_TIKTOK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-navy-400 transition-colors hover:text-gold-400"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.16 15.3 6.34 6.34 0 0 0 9.5 21.64a6.34 6.34 0 0 0 6.34-6.34V8.85a8.19 8.19 0 0 0 4.76 1.52V6.9a4.85 4.85 0 0 1-1.01-.21z" />
              </svg>
            </a>
            <a href={SITE_URL} className="text-[10px] uppercase tracking-[0.2em] text-navy-500 hover:text-gold-400">
              prince-esquire.co.ke
            </a>
          </div>
        </div>

        <div className="pt-10 text-center">
          <p className="text-[10px] tracking-[0.28em] text-navy-500">
            © 2026/27 Prince Esquire — The Man&apos;s Shop
          </p>
          <Link to="/admin" className="mt-3 inline-block text-[9px] tracking-[0.2em] text-navy-600 hover:text-gold-500/60">
            Staff
          </Link>
        </div>
      </div>

      <FloatingSocial />

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        onClick={() => trackContact()}
        className="group fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center overflow-hidden rounded-full bg-[#25D366] shadow-lg transition-all duration-300 hover:w-40"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center">
          <svg viewBox="0 0 448 512" aria-hidden="true" className="h-[22px] w-[22px] fill-white">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32 101.2 32 0 133.2 0 256c0 45.1 11.7 89.2 33.8 127.1L0 480l97.7-33.3C134.5 468.1 178 480 223.9 480c122.7 0 223.9-101.2 223.9-224 0-59.3-23.1-115.1-66.9-158.9zM223.9 438.6c-39.7 0-78.6-10.7-112.3-31l-7.8-4.6-57.7 19.7 19.3-56.1-5-8c-21.9-34.8-33.5-75-33.5-116.6 0-119.2 97-216.2 216.2-216.2 57.7 0 111.9 22.5 152.9 63.5 41 41 63.5 95.2 63.5 152.9 0 119.2-97 216.3-215.6 216.3zm125.2-162.6c-6.8-3.4-40.4-20-46.7-22.4-6.2-2.4-10.8-3.4-15.4 3.4-4.6 6.8-17.8 22.4-21.8 27-4 4.6-8 5.1-14.8 1.7-6.8-3.4-28.5-10.5-54.3-33.5-20.1-17.9-33.7-40-37.7-46.8-4-6.8-.4-10.4 3-13.8 3.1-3.1 6.8-8.1 10.2-12.1 3.4-4 4.5-6.8 6.8-11.3 2.3-4.6 1.1-8.6-.6-12.1-1.7-3.4-15.4-37.1-21.1-50.8-5.5-13.2-11.1-11.4-15.4-11.7-4-.2-8.6-.2-13.2-.2s-12.1 1.7-18.4 8.6c-6.2 6.8-23.9 23.4-23.9 57.1 0 33.7 24.5 66.2 27.9 70.8 3.4 4.6 48.3 73.9 117 103.5 16.4 7.1 29.2 11.3 39.2 14.5 16.5 5.2 31.5 4.5 43.4 2.7 13.2-2 40.4-16.5 46-32.4 5.7-15.9 5.7-29.6 4-32.4-1.7-2.8-6.2-4.5-13-7.9z" />
          </svg>
        </span>
        <span className="ml-1 whitespace-nowrap font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          WhatsApp
        </span>
      </a>
    </footer>
  );
};

export default Footer;
