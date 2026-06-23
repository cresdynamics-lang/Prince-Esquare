import { Link } from 'react-router-dom';

export default function BlogShowcase({ blog }) {
  const fallbackImage = '/default-blog-image.jpg';
  const imageUrl = blog.featured_image_url || fallbackImage;

  return (
    <Link to={`/blog/${blog.slug}`} className="block hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden bg-white">
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={blog.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={(e) => {e.target.src = fallbackImage;}}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg md:text-xl font-serif font-bold text-gray-900 line-clamp-2 mb-2">
          {blog.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {blog.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{blog.author_name}</span>
          <span>{new Date(blog.published_date).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
