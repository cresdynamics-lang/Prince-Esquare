import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { buildBreadcrumbSchema, buildBlogPostingSchema } from '../seo/seoData';

export default function BlogArticle() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Blog post not found');
        }

        const data = await response.json();
        setBlog(data);

        try {
          await fetch(`/api/blog/${data.id}/views`, {
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
      <div className="flex justify-center items-center min-h-screen bg-navy-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-navy-950 text-white px-6">
        <h1 className="text-2xl font-serif font-bold text-white mb-4 text-center">
          {error || 'Blog post not found'}
        </h1>
        <Link to="/blog" className="text-gold-400 hover:text-gold-300 font-medium underline">
          Return to blog
        </Link>
      </div>
    );
  }

  const fallbackImage = '/default-blog-image.jpg';
  const imageUrl = blog.featured_image_url || fallbackImage;

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <SEO
        title={blog.title}
        description={blog.excerpt || blog.title}
        path={`/blog/${blog.slug}`}
        image={blog.featured_image_url}
        keywords={[blog.title, blog.category, 'Prince Esquire blog', 'menswear Kenya'].filter(Boolean)}
        schema={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: blog.title, path: `/blog/${blog.slug}` },
          ]),
          buildBlogPostingSchema(blog),
        ]}
      />

      {imageUrl && (
        <div className="relative w-full h-96 bg-navy-900 overflow-hidden">
          <img
            src={imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = fallbackImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/blog" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
            {"<- Back to blog"}
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-navy-200 mb-4">
            <span className="font-medium">{blog.author_name}</span>
            <span>-</span>
            <time dateTime={blog.published_date}>
              {new Date(blog.published_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>-</span>
            <span className="inline-block bg-gold-600/10 px-3 py-1 rounded-full border border-gold-600/15 text-gold-400">
              {blog.category}
            </span>
            <span>-</span>
            <span>{blog.views || 0} views</span>
          </div>
        </header>

        <div className="mb-8 text-lg text-navy-200 italic border-l-4 border-gold-500 pl-4">
          {blog.excerpt}
        </div>

        <article className="max-w-none mb-12">
          <div className="text-navy-100 leading-relaxed whitespace-pre-wrap">
            {blog.content}
          </div>
        </article>

        <div className="bg-navy-900/70 border border-gold-600/10 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-serif font-bold text-white mb-2">
            About {blog.author_name}
          </h3>
          <p className="text-navy-200">
            {blog.author_name} is a contributor at Prince Esquire, sharing insights on fashion, style, and lifestyle trends.
          </p>
        </div>

        <div className="text-center py-8 border-t border-gold-600/10">
          <Link
            to={`/blog?category=${encodeURIComponent(blog.category)}`}
            className="inline-block px-6 py-3 bg-gold-600 text-navy-950 rounded-lg hover:bg-gold-500 transition-colors font-medium"
          >
            Explore more {blog.category} articles
          </Link>
        </div>
      </div>
    </div>
  );
}
