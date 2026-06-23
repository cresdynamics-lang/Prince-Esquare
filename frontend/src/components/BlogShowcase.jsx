import { resolveDisplayImageUrl } from '../utils/cloudinary';
import { Link } from 'react-router-dom';

export default function BlogShowcase({ blog }) {
  const fallbackImage = '/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg';
  const imageUrl = resolveDisplayImageUrl(blog.featured_image_url, { width: 1200 }) || fallbackImage;

  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group block rounded-lg overflow-hidden bg-navy-900/70 border border-gold-600/10 hover:border-gold-500/30 transition-all duration-300"
    >
      <div className="relative w-full h-52 bg-navy-800 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = fallbackImage; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between text-[9px] tracking-[0.25em] font-bold text-gold-500 uppercase">
          <span>{blog.category}</span>
          <span>{new Date(blog.published_date).toLocaleDateString()}</span>
        </div>
        <h3 className="text-lg md:text-xl font-serif font-bold text-white line-clamp-2 leading-tight group-hover:text-gold-300 transition-colors">
          {blog.title}
        </h3>
        <p className="text-sm text-navy-200 line-clamp-2 leading-relaxed">
          {blog.excerpt}
        </p>
        <div className="flex items-center justify-end text-[10px] tracking-[0.18em] uppercase text-gold-400">
          <span>Read story</span>
        </div>
      </div>
    </Link>
  );
}

