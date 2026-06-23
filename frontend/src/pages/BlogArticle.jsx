import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function BlogArticle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/blog/${slug}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Blog post not found');
        }

        const data = await response.json();
        setBlog(data);

        // Increment view count
        try {
          await fetch(`http://localhost:8000/api/blog/${data.id}/views`, {
            method: 'PATCH',
            credentials: 'include',
          });
        } catch (err) {
          console.warn('Could not update views:', err);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">
          {error || 'Blog post not found'}
        </h1>
        <Link 
          to="/blog" 
          className="text-gray-900 hover:text-gray-700 font-medium underline"
        >
          Return to blog
        </Link>
      </div>
    );
  }

  const fallbackImage = '/default-blog-image.jpg';
  const imageUrl = blog.featured_image_url || fallbackImage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      {imageUrl && (
        <div className="relative w-full h-96 bg-gray-200 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {e.target.src = fallbackImage;}}
          />
        </div>
      )}

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            to="/blog" 
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            ← Back to blog
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            {blog.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="font-medium">{blog.author_name}</span>
            <span>•</span>
            <time dateTime={blog.published_date}>
              {new Date(blog.published_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>•</span>
            <span className="inline-block bg-gray-200 px-3 py-1 rounded-full">
              {blog.category}
            </span>
            <span>•</span>
            <span>{blog.views || 0} views</span>
          </div>
        </header>

        {/* Excerpt */}
        <div className="mb-8 text-lg text-gray-700 italic border-l-4 border-gray-900 pl-4">
          {blog.excerpt}
        </div>

        {/* Content */}
        <article className="prose prose-lg max-w-none mb-12">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {blog.content}
          </div>
        </article>

        {/* Author Bio */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-2">
            About {blog.author_name}
          </h3>
          <p className="text-gray-600">
            {blog.author_name} is a contributor at Prince Esquire, sharing insights on fashion, style, and lifestyle trends.
          </p>
        </div>

        {/* Related Articles Link */}
        <div className="text-center py-8 border-t border-gray-200">
          <Link 
            to={`/blog?category=${encodeURIComponent(blog.category)}`}
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Explore more {blog.category} articles
          </Link>
        </div>
      </div>
    </div>
  );
}
