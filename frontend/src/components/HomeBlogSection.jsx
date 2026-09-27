import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BlogShowcase from './BlogShowcase';

export default function HomeBlogSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/blog?limit=3', { credentials: 'include' });
        if (!res.ok) throw new Error('Blog fetch failed');
        const data = await res.json();
        if (!cancelled) {
          setPosts(Array.isArray(data.posts) ? data.posts : []);
        }
      } catch (err) {
        console.error('HomeBlogSection:', err);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-t border-gold-600/10 bg-navy-950 py-16 md:py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl space-y-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold-500">
              Style Journal
            </span>
            <h2 className="font-serif text-2xl leading-tight text-white md:text-3xl">
              Latest from Prince Esquire
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-navy-200">
              Style guides, wardrobe tips, and new arrivals — updated regularly to help you dress with confidence.
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex shrink-0 items-center justify-center bg-gold-600 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.25em] text-navy-950 transition-colors hover:bg-gold-500"
          >
            View all articles
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-gold-500/10 bg-navy-900/50"
              />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {posts.map((blog) => (
              <BlogShowcase key={blog.id} blog={blog} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gold-500/15 bg-navy-900/30 py-16 text-center">
            <p className="text-sm text-gold-500/50">New articles coming soon.</p>
            <Link to="/blog" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-gold-400 hover:text-gold-300">
              Visit the journal
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
