/**
 * Floating social rail — original brand logos, bottom-left vertical stack.
 * WhatsApp stays fixed bottom-right in Footer.
 */
import {
  SOCIAL_INSTAGRAM,
  SOCIAL_FACEBOOK,
  SOCIAL_TIKTOK,
} from '../seo/seoData';

/** Instagram — camera glyph on brand gradient */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <defs>
        <radialGradient id="pe-ig" cx="0.3" cy="1.07" r="1.2">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#pe-ig)" />
      <path
        fill="#fff"
        d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.92A3.12 3.12 0 1 1 12 8.88a3.12 3.12 0 0 1 0 6.24zm5.04-8.16a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        d="M8.2 4.6h7.6A3.6 3.6 0 0 1 19.4 8.2v7.6a3.6 3.6 0 0 1-3.6 3.6H8.2A3.6 3.6 0 0 1 4.6 15.8V8.2A3.6 3.6 0 0 1 8.2 4.6z"
      />
    </svg>
  );
}

/** Facebook — blue tile + white f */
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#1877F2" />
      <path
        fill="#fff"
        d="M16.5 12.3h-2.3v7.5h-3.1v-7.5H9.3V9.7h1.8V8.1c0-1.8 1.1-2.9 2.8-2.9.8 0 1.6.1 1.6.1v1.8h-.9c-.9 0-1.2.6-1.2 1.1v1.5h2.2l-.3 2.6z"
      />
    </svg>
  );
}

/** TikTok — black tile with cyan/magenta note */
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#010101" />
      <path
        fill="#25F4EE"
        d="M16.95 7.55a3.86 3.86 0 0 1-2.28-2.28h-1.78v9.02a2.34 2.34 0 1 1-2.02-2.31v-1.82a4.13 4.13 0 1 0 3.8 4.13V9.4a5.62 5.62 0 0 0 3.28.97V8.56a3.86 3.86 0 0 1-1-.01z"
        transform="translate(.45 .4)"
      />
      <path
        fill="#FE2C55"
        d="M16.95 7.55a3.86 3.86 0 0 1-2.28-2.28h-1.78v9.02a2.34 2.34 0 1 1-2.02-2.31v-1.82a4.13 4.13 0 1 0 3.8 4.13V9.4a5.62 5.62 0 0 0 3.28.97V8.56a3.86 3.86 0 0 1-1-.01z"
        transform="translate(-.4 -.25)"
      />
      <path
        fill="#fff"
        d="M16.5 7.15a3.86 3.86 0 0 1-2.28-2.28h-1.78v9.02a2.34 2.34 0 1 1-2.02-2.31v-1.82a4.13 4.13 0 1 0 3.8 4.13V9a5.62 5.62 0 0 0 3.28.97V8.16a3.86 3.86 0 0 1-1 0z"
      />
    </svg>
  );
}

const LINKS = [
  { name: 'Instagram', href: SOCIAL_INSTAGRAM, Icon: InstagramIcon },
  { name: 'Facebook', href: SOCIAL_FACEBOOK, Icon: FacebookIcon },
  { name: 'TikTok', href: SOCIAL_TIKTOK, Icon: TikTokIcon },
];

export default function FloatingSocial() {
  return (
    <nav
      aria-label="Social media"
      className="pointer-events-none fixed bottom-6 left-3 z-40 flex flex-col items-center gap-2.5 sm:left-5 sm:bottom-7 md:left-6"
    >
      {LINKS.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Prince Esquire on ${name}`}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full shadow-lg shadow-navy-950/35 transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Icon />
        </a>
      ))}
    </nav>
  );
}
