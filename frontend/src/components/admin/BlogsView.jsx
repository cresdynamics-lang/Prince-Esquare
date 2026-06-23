import { useState, useEffect } from 'react';

export default function BlogsView() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Fashion Tips',
    author_name: '',
    featured_image_url: '',
    is_published: false,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch blogs
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/admin/blog', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch blogs');
      const data = await response.json();
      setBlogs(data.posts);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataImg = new FormData();
    formDataImg.append('image', file);

    try {
      const response = await fetch('http://localhost:8000/api/admin/blog/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formDataImg,
      });

      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        featured_image_url: data.url,
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingBlog
        ? `http://localhost:8000/api/admin/blog/${editingBlog.id}`
        : 'http://localhost:8000/api/admin/blog';

      const method = editingBlog ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save blog post');

      alert(editingBlog ? 'Blog post updated!' : 'Blog post created!');
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Fashion Tips',
        author_name: '',
        featured_image_url: '',
        is_published: false,
      });
      setEditingBlog(null);
      setShowForm(false);
      fetchBlogs();
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData(blog);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/admin/blog/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete blog post');

      alert('Blog post deleted!');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      alert(error.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Fashion Tips',
      author_name: '',
      featured_image_url: '',
      is_published: false,
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Post'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <input
              type="text"
              name="slug"
              placeholder="Slug (URL friendly)"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="author_name"
              placeholder="Author Name"
              value={formData.author_name}
              onChange={handleInputChange}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="Fashion Tips">Fashion Tips</option>
              <option value="Trends">Trends</option>
              <option value="Style Guide">Style Guide</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="News">News</option>
            </select>
          </div>

          <textarea
            name="excerpt"
            placeholder="Excerpt (brief summary)"
            value={formData.excerpt}
            onChange={handleInputChange}
            required
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
          />

          <textarea
            name="content"
            placeholder="Content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows="8"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-4"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Featured Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="px-3 py-2 border border-gray-300 rounded-lg w-full"
            />
            {uploadingImage && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
            {formData.featured_image_url && (
              <div className="mt-4">
                <img src={formData.featured_image_url} alt="Preview" className="max-h-48 rounded-lg" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-900">Published</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Blog Posts List */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="pb-3 font-semibold text-gray-900">Title</th>
                <th className="pb-3 font-semibold text-gray-900">Author</th>
                <th className="pb-3 font-semibold text-gray-900">Category</th>
                <th className="pb-3 font-semibold text-gray-900">Status</th>
                <th className="pb-3 font-semibold text-gray-900">Views</th>
                <th className="pb-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 text-gray-900 font-medium">{blog.title}</td>
                  <td className="py-3 text-gray-600">{blog.author_name}</td>
                  <td className="py-3 text-gray-600">{blog.category}</td>
                  <td className="py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      blog.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {blog.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{blog.views || 0}</td>
                  <td className="py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(blog)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {blogs.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No blog posts yet. Create your first one!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
