import { Link } from 'react-router-dom';
import { resolveDisplayImageUrl } from '../utils/cloudinary';

export default function BlogShowcase({ blog }) {
  const fallbackImage = '/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg';
  const imageUrl = resolveDisplayImageUrl(blog.featured_image_url, { width: 800 }) || fallbackImage;
  const dateLabel = blog.published_date
    ? new Date(blog.published_date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group block overflow-hidden rounded-2xl border border-gold-600/10 bg-navy-900/70 transition-all duration-300 hover:border-gold-500/30 hover:-translate-y-0.5"
    >
      <div className="relative h-52 w-full overflow-hidden bg-navy-800">
        <img
          src={imageUrl}
          alt={blog.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.25em] text-gold-500">
          <span>{blog.category}</span>
          {dateLabel && <span>{dateLabel}</span>}
        </div>
        <h3 className="line-clamp-2 font-serif text-lg font-bold leading-tight text-white transition-colors group-hover:text-gold-300 md:text-xl">
          {blog.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-navy-200">{blog.excerpt}</p>
        <div className="flex items-center justify-end text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400">
          Read story →
        </div>
      </div>
    </Link>
  );
}
