import { resolveDisplayImageUrl } from '../../utils/cloudinary';
﻿import { useEffect, useState } from 'react';
import { Image as ImageIcon, PencilLine, Plus, Save, Trash2, X } from 'lucide-react';
import API from '../../services/api';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'Fashion Tips',
  author_name: '',
  featured_image_url: '',
  is_published: false,
};

const blogCategories = ['Fashion Tips', 'Trends', 'Style Guide', 'Lifestyle', 'News'];

export default function BlogsView() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/blog', { params: { limit: 12 } });
      setBlogs(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert(error?.response?.data?.error || error.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataImg = new FormData();
    formDataImg.append('image', file);

    try {
      const response = await API.post('/admin/blog/upload-image', formDataImg, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({
        ...prev,
        featured_image_url: response.data?.url || '',
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error?.response?.data?.error || error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreateForm = () => {
    setEditingBlog(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = async (blog) => {
    setSaving(true);
    try {
      let payload = blog;
      if (!payload.content) {
        const response = await API.get('/admin/blog/' + blog.id);
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
      });
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
        author_name: formData.author_name || 'Prince Esquire',
      };

      const response = editingBlog
        ? await API.put('/admin/blog/' + editingBlog.id, payload)
        : await API.post('/admin/blog', payload);

      if (response.status >= 400) throw new Error('Failed to save blog post');

      setFormData(emptyForm);
      setEditingBlog(null);
      setShowForm(false);
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
      await API.delete('/admin/blog/' + id);
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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gold-500/10 bg-navy-900/40 p-5 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-gold-100">Blog Management</h2>
          <p className="mt-1 text-xs text-gold-500/40">Published and draft posts with thumbnail previews.</p>
        </div>
        <button
          onClick={showForm ? handleCancel : openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-600 px-4 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-gold-500"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Close form' : 'Create post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gold-500/10 bg-navy-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4 border-b border-gold-500/10 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-gold-100">{editingBlog ? 'Edit blog post' : 'New blog post'}</h3>
              <p className="mt-1 text-xs text-gold-500/40">Use one image and a clean excerpt for search snippets.</p>
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
              placeholder="Title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
            />
            <input
              type="text"
              name="slug"
              placeholder="Slug"
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
              required
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

          <textarea
            name="excerpt"
            placeholder="Excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            required
            rows={3}
            className="w-full rounded-xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
          />

          <textarea
            name="content"
            placeholder="Content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={10}
            className="w-full rounded-2xl border border-gold-500/15 bg-navy-950/50 px-4 py-3 text-sm leading-6 text-gold-100 outline-none placeholder:text-gold-500/25 focus:border-gold-500/40"
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <label className="block rounded-2xl border border-dashed border-gold-500/20 bg-navy-950/40 p-4">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gold-500/40">Featured image</span>
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-gold-500/60" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full text-sm text-gold-100 file:mr-4 file:rounded-lg file:border-0 file:bg-gold-600 file:px-3 file:py-2 file:text-sm file:font-bold file:text-navy-950 hover:file:bg-gold-500"
                />
              </div>
              {uploadingImage && <p className="mt-3 text-xs text-gold-500/40">Uploading image...</p>}
              {formData.featured_image_url && (
                <img
                  src={resolveDisplayImageUrl(formData.featured_image_url, { width: 1200 })}
                  alt="Featured preview"
                  className="mt-4 h-44 w-full rounded-xl object-cover"
                />
              )}
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-gold-500/15 bg-navy-950/50 px-4 py-4">
              <div>
                <span className="block text-sm font-bold text-gold-100">Publish now</span>
                <span className="block text-xs text-gold-500/40">Drafts stay hidden from the public site.</span>
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
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-600 px-5 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-gold-500 disabled:opacity-50"
            >
              <Save size={18} /> {saving ? 'Saving...' : 'Save post'}
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
              <article key={blog.id} className="overflow-hidden rounded-2xl border border-gold-500/10 bg-navy-950/55 transition-transform hover:-translate-y-0.5">
                <div className="relative h-44 bg-navy-800">
                  {blog.featured_image_url ? (
                    <img src={resolveDisplayImageUrl(blog.featured_image_url, { width: 1200 })} alt={blog.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/WhatsApp Image 2026-05-12 at 8.07.18 PM.jpeg'; }} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gold-500/30">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${blog.is_published ? 'bg-green-400 text-navy-950' : 'bg-amber-300 text-navy-950'}`}>
                    {blog.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-bold text-gold-100">{blog.title}</h3>
                      <span className="shrink-0 rounded-full border border-gold-500/15 px-2.5 py-1 text-[10px] font-bold text-gold-500/60">{blog.category}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gold-200/70">{blog.excerpt}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gold-500/5 pt-3 text-[10px] uppercase tracking-[0.2em] text-gold-500/35">
                    <span>{blog.views || 0} views</span>
                    <span>{blog.published_date ? new Date(blog.published_date).toLocaleDateString() : 'Not published'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditForm(blog)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold-500/15 px-3 py-2.5 text-sm font-bold text-gold-100 hover:border-gold-500/40"
                    >
                      <PencilLine size={16} /> Edit
                    </button>
                    <button
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
          <div className="py-20 text-center text-sm text-gold-500/40">No blog posts found.</div>
        )}
      </div>
    </div>
  );
}
