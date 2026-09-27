import { useEffect, useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, PencilLine, Plus, Save, Trash2, X, Upload, Smartphone } from 'lucide-react';
import API from '../../services/api';
import { resolveDisplayImageUrl } from '../../utils/cloudinary';
import { compressImageFile, formatBytes } from '../../utils/compressImage';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'Fashion Tips',
  author_name: '',
  featured_image_url: '',
  is_published: false,
  meta_title: '',
  meta_description: '',
};

const blogCategories = ['Fashion Tips', 'Trends', 'Style Guide', 'Lifestyle', 'News'];

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BlogsView() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/blog', { params: { limit: 50 } });
      setBlogs(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert(error?.response?.data?.error || error.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTitleBlur = () => {
    setFormData((prev) => {
      if (prev.slug?.trim()) return prev;
      const next = slugify(prev.title);
      return next ? { ...prev, slug: next } : prev;
    });
  };

  const uploadImageFile = async (file) => {
    if (!file?.type?.startsWith('image/')) {
      alert('Please choose an image file (JPEG, PNG, or WebP).');
      return;
    }

    setUploadingImage(true);
    setUploadNote('Compressing image…');

    try {
      const originalSize = file.size;
      const compressed = await compressImageFile(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.8,
        skipBelowBytes: 200_000,
      }).catch(() => file);

      if (compressed.size < originalSize) {
        setUploadNote(`Compressed ${formatBytes(originalSize)} → ${formatBytes(compressed.size)}. Uploading…`);
      } else {
        setUploadNote('Uploading…');
      }

      const body = new FormData();
      body.append('image', compressed);

      const response = await API.post('/admin/blog/upload-image', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = response.data?.url || '';
      if (!url) throw new Error('No image URL returned');

      setFormData((prev) => ({ ...prev, featured_image_url: url }));
      setUploadNote('Image uploaded.');
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadNote('');
      alert(error?.response?.data?.error || error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadImageFile(file);
  };

  const openCreateForm = () => {
    setEditingBlog(null);
    setFormData(emptyForm);
    setUploadNote('');
    setShowForm(true);
  };

  const openEditForm = async (blog) => {
    setSaving(true);
    try {
      let payload = blog;
      if (!payload.content) {
        const response = await API.get(`/admin/blog/${blog.id}`);
        payload = response.data;
      }
      setEditingBlog(payload);
      setFormData({
        title: payload.title || '',
        slug: payload.slug || '',
        excerpt: payload.excerpt || '',
        content: payload.content || '',
        category: payload.category || 'Fashion Tips',
        author_name: payload.author_name || '',
        featured_image_url: payload.featured_image_url || '',
        is_published: Boolean(payload.is_published),
        meta_title: payload.meta_title || '',
        meta_description: payload.meta_description || '',
      });
      setUploadNote('');
      setShowForm(true);
    } catch (error) {
      console.error('Error loading blog for edit:', error);
      alert(error?.response?.data?.error || error.message || 'Failed to load blog');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        slug: formData.slug || slugify(formData.title),
        author_name: formData.author_name || 'Prince Esquire',
      };

      if (editingBlog) {
        await API.put(`/admin/blog/${editingBlog.id}`, payload);
      } else {
        await API.post('/admin/blog', payload);
      }

      setFormData(emptyForm);
      setEditingBlog(null);
      setShowForm(false);
      setUploadNote('');
      await fetchBlogs();
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert(error?.response?.data?.error || error.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await API.delete(`/admin/blog/${id}`);
      await fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert(error?.response?.data?.error || error.message || 'Failed to delete blog post');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBlog(null);
    setFormData(emptyForm);
    setUploadNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gold-500/10 bg-navy-900/40 p-5 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-gold-100">Blog & SEO</h2>
          <p className="mt-1 text-xs text-gold-500/40">
            Write articles for Google. Upload photos from your phone or computer — we compress them automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={showForm ? handleCancel : openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-600 px-4 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-gold-500"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Close form' : 'New blog post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gold-500/10 bg-navy-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gold-500/10 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-gold-100">
                {editingBlog ? 'Edit blog post' : 'New blog post'}
              </h3>
              <p className="mt-1 text-xs text-gold-500/40">Fill in the story, add a featured image, then publish.</p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-lg border border-gold-500/15 px-3 py-2 text-xs font-bold text-gold-100 hover:border-gold-500/40"
            >
              <X size={14} /> Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <input
              type="text"
              name="title"
              placeholder="Post title"
              value={formData.title}
              onChange={handleInputChange}
              onBlur={handleTitleBlur}
              required
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <input
              type="text"
              name="slug"
              placeholder="url-slug (auto from title)"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <input
              type="text"
              name="author_name"
              placeholder="Author name"
              value={formData.author_name}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none focus:border-gold-500/40"
            >
              {blogCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-gold-500/15 bg-navy-950/30 p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-500/50">SEO</p>
            <input
              type="text"
              name="meta_title"
              placeholder="Meta title (optional)"
              value={formData.meta_title}
              onChange={handleInputChange}
              maxLength={60}
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <textarea
              name="meta_description"
              placeholder="Meta description for Google (optional)"
              value={formData.meta_description}
              onChange={handleInputChange}
              maxLength={160}
              rows={2}
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <p className="text-[10px] text-gold-500/35">Live URL: /blog/{formData.slug || 'your-slug'}</p>
          </div>

          <textarea
            name="excerpt"
            placeholder="Short excerpt (shows in search & blog list)"
            value={formData.excerpt}
            onChange={handleInputChange}
            required
            rows={3}
            className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
          />

          <textarea
            name="content"
            placeholder="Full article content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={10}
            className="w-full rounded-2xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm leading-6 text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="rounded-2xl border border-dashed border-gold-500/25 bg-navy-950/40 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold-500/50">Featured image</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/*"
                capture="environment"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="sr-only"
                id="blog-featured-upload"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-600 px-4 py-3 text-sm font-bold text-navy-950 hover:bg-gold-500 disabled:opacity-50"
                >
                  <Upload size={18} />
                  {uploadingImage ? 'Uploading…' : 'Choose from device'}
                </button>
                <p className="flex items-center gap-2 text-[10px] text-gold-500/40 sm:max-w-[140px]">
                  <Smartphone size={14} className="shrink-0" />
                  Phone gallery or camera works
                </p>
              </div>

              {uploadNote && (
                <p className="mt-3 text-xs text-gold-500/60">{uploadNote}</p>
              )}

              {formData.featured_image_url && (
                <div className="mt-4 relative">
                  <img
                    src={resolveDisplayImageUrl(formData.featured_image_url, { width: 800 })}
                    alt="Featured preview"
                    className="h-48 w-full rounded-xl object-cover border border-gold-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, featured_image_url: '' }))}
                    className="absolute top-2 right-2 rounded-lg bg-navy-950/80 px-2 py-1 text-[10px] font-bold text-red-400 border border-red-400/30"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-gold-500/15 bg-navy-950/50 px-4 py-4 min-w-[200px]">
              <div>
                <span className="block text-sm font-bold text-gold-100">Publish now</span>
                <span className="block text-xs text-gold-500/40">Drafts stay hidden.</span>
              </div>
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                className="h-5 w-5 rounded border-gold-500/20 bg-navy-900 text-gold-600 focus:ring-0"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-600 px-5 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-gold-500 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Saving…' : 'Save post'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-gold-500/15 px-5 py-3 text-sm font-bold text-gold-100 transition-colors hover:border-gold-500/40"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl border border-gold-500/10 bg-navy-900/40 p-5 backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
          </div>
        ) : blogs.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="overflow-hidden rounded-2xl border border-gold-500/10 bg-navy-950/55 transition-transform hover:-translate-y-0.5"
              >
                <div className="relative h-44 bg-navy-800">
                  {blog.featured_image_url ? (
                    <img
                      src={resolveDisplayImageUrl(blog.featured_image_url, { width: 600 })}
                      alt={blog.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gold-500/30">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                      blog.is_published ? 'bg-green-400 text-navy-950' : 'bg-amber-300 text-navy-950'
                    }`}
                  >
                    {blog.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-bold text-gold-100">{blog.title}</h3>
                      <span className="shrink-0 rounded-full border border-gold-500/15 px-2.5 py-1 text-[10px] font-bold text-gold-500/60">
                        {blog.category}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gold-200/70">{blog.excerpt}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gold-500/5 pt-3 text-[10px] uppercase tracking-[0.2em] text-gold-500/35">
                    <span>{blog.views || 0} views</span>
                    <span>
                      {blog.published_date
                        ? new Date(blog.published_date).toLocaleDateString()
                        : 'Not published'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(blog)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold-500/15 px-3 py-2.5 text-sm font-bold text-gold-100 hover:border-gold-500/40"
                    >
                      <PencilLine size={16} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog.id)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-400/20 px-3 py-2.5 text-red-400 hover:bg-red-400/10"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <ImageIcon size={40} className="mx-auto mb-4 text-gold-500/20" />
            <p className="text-sm text-gold-500/40">No blog posts yet.</p>
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-600 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-500"
            >
              <Plus size={16} /> Create your first post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
