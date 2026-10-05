import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import {
  buildBreadcrumbSchema,
  buildBlogPostingSchema,
  buildFaqSchema,
  organizationSchema,
  CONTACT_PHONE,
} from '../seo/seoData';
import { resolveDisplayImageUrl } from '../utils/cloudinary';
import { WHATSAPP_NUMBER } from '../lib/storeContact';

function isHtmlContent(content = '') {
  return /<\/?(h2|h3|p|ul|ol|li|table|a|strong|em|div|section)\b/i.test(content);
}

function whatsappJournalUrl(title) {
  const text = `Hi Prince Esquire — I read your journal “${title}” and need sizing / colour matching help.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/** Pull visible FAQ pairs from journal HTML for AEO schema */
function faqsFromHtml(content = '') {
  const faqChunk = content.split(/<h2[^>]*>\s*FAQ\s*<\/h2>/i)[1] || '';
  if (!faqChunk) return [];
  const pairs = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(faqChunk)) && pairs.length < 8) {
    const question = m[1].replace(/<[^>]+>/g, '').trim();
    const answer = m[2].replace(/<[^>]+>/g, '').trim();
    if (question && answer) pairs.push({ question, answer });
  }
  return pairs;
}

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
          throw new Error('Journal post not found');
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
      <div className="min-h-screen bg-navy-950">
        <Navbar />
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-navy-950 text-white">
        <Navbar />
        <div className="flex flex-col justify-center items-center min-h-[50vh] px-6">
          <h1 className="text-2xl font-serif font-bold text-white mb-4 text-center">
            {error || 'Journal post not found'}
          </h1>
          <Link to="/blog" className="text-gold-400 hover:text-gold-300 font-medium underline">
            Back to Style Journal
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const fallbackImage = '/models/shirts/lilac-contrast.jpg';
  const imageUrl = resolveDisplayImageUrl(blog.featured_image_url, { width: 1600 }) || fallbackImage;
  const seoTitle = blog.meta_title || blog.title;
  const seoDescription = blog.meta_description || blog.excerpt || blog.title;
  const html = isHtmlContent(blog.content);
  const published = blog.published_date || blog.created_at;
  const updated = blog.updated_at || published;
  const waUrl = whatsappJournalUrl(blog.title);
  const faqSchema = buildFaqSchema(faqsFromHtml(blog.content));

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Navbar />
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={`/blog/${blog.slug}`}
        image={imageUrl}
        type="article"
        keywords={[
          blog.title,
          blog.category,
          'Prince Esquire journal',
          'menswear Kenya',
          'Nairobi style',
        ].filter(Boolean)}
        schema={[
          organizationSchema,
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Style Journal', path: '/blog' },
            { name: blog.title, path: `/blog/${blog.slug}` },
          ]),
          buildBlogPostingSchema({
            ...blog,
            excerpt: seoDescription,
            featured_image_url: imageUrl?.startsWith('http')
              ? imageUrl
              : `https://prince-esquire.co.ke${imageUrl}`,
          }),
          faqSchema,
        ]}
      />

      {imageUrl && (
        <div className="relative w-full h-80 md:h-96 bg-navy-900 overflow-hidden">
          <img
            src={imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12 pt-8">
        <div className="mb-8">
          <Link to="/blog" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
            ← Style Journal
          </Link>
        </div>

        <header className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold-500/70 mb-3">
            {blog.category || 'Style Journal'}
          </p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4 leading-snug">
            {blog.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-navy-200 mb-4">
            <span>{blog.author_name || 'Prince Esquire Editorial'}</span>
            <span aria-hidden className="text-gold-600/40">·</span>
            <time dateTime={published}>
              {new Date(published).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {updated && updated !== published && (
              <>
                <span aria-hidden className="text-gold-600/40">·</span>
                <time dateTime={updated}>
                  Updated{' '}
                  {new Date(updated).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </>
            )}
          </div>
        </header>

        {blog.excerpt && (
          <div className="mb-10 text-lg text-navy-200 italic border-l-4 border-gold-500 pl-4">
            {blog.excerpt}
          </div>
        )}

        <article className="mb-12">
          {html ? (
            <div
              className="journal-prose text-navy-100 leading-relaxed
                [&_h2]:font-serif [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:text-white [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:leading-snug
                [&_h3]:font-serif [&_h3]:text-lg [&_h3]:text-gold-200 [&_h3]:mt-7 [&_h3]:mb-3
                [&_p]:mb-4 [&_p]:text-[15px] [&_p]:md:text-base [&_p]:leading-relaxed
                [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
                [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
                [&_li]:text-[15px] [&_li]:leading-relaxed
                [&_a]:text-gold-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-gold-300
                [&_strong]:text-white [&_strong]:font-semibold
                [&_table]:w-full [&_table]:mb-6 [&_table]:text-sm [&_table]:border-collapse
                [&_th]:text-left [&_th]:border-b [&_th]:border-gold-600/30 [&_th]:py-2.5 [&_th]:pr-3 [&_th]:text-gold-300 [&_th]:font-medium
                [&_td]:border-b [&_td]:border-gold-600/10 [&_td]:py-2.5 [&_td]:pr-3 [&_td]:align-top
                [&_blockquote]:border-l-4 [&_blockquote]:border-gold-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-navy-200 [&_blockquote]:my-6
                [&_hr]:border-gold-600/15 [&_hr]:my-8
                [&_img]:rounded-sm [&_img]:my-6 [&_img]:w-full [&_img]:object-cover"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          ) : (
            <div className="text-navy-100 leading-relaxed whitespace-pre-wrap">{blog.content}</div>
          )}
        </article>

        <div className="rounded-sm border border-gold-600/15 bg-navy-900/70 p-6 mb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold-500/70 mb-2">Author</p>
          <h3 className="font-serif text-lg text-white mb-2">
            {blog.author_name || 'Prince Esquire Editorial'}
          </h3>
          <p className="text-sm text-navy-200 leading-relaxed">
            Prince Esquire — The Man&apos;s Shop — is a Nairobi menswear house at Yala Towers,
            curating shirts, suits, blazers, trousers, shoes and accessories with delivery across Kenya.
            Call or WhatsApp {CONTACT_PHONE.replace('+254', '0')} for sizing and colour matching.
          </p>
          <p className="mt-3 text-xs text-navy-300">
            Last updated{' '}
            {new Date(updated).toLocaleDateString('en-KE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="text-center py-8 border-t border-gold-600/10 space-y-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#25D366] text-white rounded-full hover:bg-[#1ebe57] transition-colors text-[11px] font-bold uppercase tracking-[0.18em]"
          >
            Chat with us on WhatsApp
          </a>
          <div>
            <Link
              to="/blog"
              className="inline-block text-gold-400 hover:text-gold-300 text-sm font-medium"
            >
              More from the Style Journal
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
