import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BlogShowcase from '../components/BlogShowcase';
import SEO from '../components/SEO';
import { buildBreadcrumbSchema, buildBlogPostingSchema, routeSeo } from '../seo/seoData';

const BLOGS_PER_PAGE = 9;

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: BLOGS_PER_PAGE,
          ...(selectedCategory && { category: selectedCategory }),
          ...(searchQuery && { search: searchQuery }),
        });

        const response = await fetch(`/api/blog?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch blogs');
        const data = await response.json();
        setBlogs(data.posts);
        setTotal(data.pagination.total);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [currentPage, selectedCategory, searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/blog?limit=1000', {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        const uniqueCategories = [...new Set(data.posts.map((blog) => blog.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const totalPages = Math.ceil(total / BLOGS_PER_PAGE);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <SEO
        title={routeSeo.blog.title}
        description={routeSeo.blog.description}
        path={routeSeo.blog.path}
        keywords={routeSeo.blog.keywords}
        schema={[
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
          blogs[0] ? buildBlogPostingSchema(blogs[0]) : null,
        ]}
      />

      <section className="relative border-b border-gold-600/10 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg")' }}
        />
        <div className="absolute inset-0 bg-navy-950/80" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl space-y-4">
            <span className="text-gold-500 text-[9px] tracking-[0.35em] font-bold uppercase">
              Prince Esquire Journal
            </span>
            <h1 className="text-3xl md:text-4xl font-serif leading-tight text-white">
              Style notes, wardrobe ideas, and editorial stories from the brand
            </h1>
            <p className="text-navy-200 text-sm md:text-base max-w-3xl leading-relaxed">
              A tighter, more useful blog built around the products, categories, and styling language already on the site.
            </p>
            <div className="pt-3">
              <Link
                to="/"
                className="inline-flex items-center text-gold-400 text-[9px] font-bold tracking-[0.25em] uppercase hover:text-gold-300 transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-14">
        <div className="mb-10 space-y-4">
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-4 py-3 bg-navy-900/70 border border-gold-600/15 rounded-lg text-white placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryFilter('')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-gold-600 text-navy-950'
                    : 'bg-navy-900/70 text-navy-200 border border-gold-600/15 hover:border-gold-500/30'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-gold-600 text-navy-950'
                      : 'bg-navy-900/70 text-navy-200 border border-gold-600/15 hover:border-gold-500/30'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
          </div>
        )}

        {!loading && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogs.map((blog) => (
              <BlogShowcase key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        {!loading && blogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-navy-200 mb-4">No blog posts found.</p>
            {searchQuery || selectedCategory ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setCurrentPage(1);
                }}
                className="text-gold-400 hover:text-gold-300 font-medium underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            {currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 bg-gold-600 text-navy-950 rounded-lg hover:bg-gold-500 transition-colors font-medium"
              >
                Previous
              </button>
            )}

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-gold-600 text-navy-950'
                      : 'bg-navy-900/70 text-navy-200 border border-gold-600/15 hover:border-gold-500/30'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {currentPage < totalPages && (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-4 py-2 bg-gold-600 text-navy-950 rounded-lg hover:bg-gold-500 transition-colors font-medium"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
