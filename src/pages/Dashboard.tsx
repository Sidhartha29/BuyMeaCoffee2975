import React, { useEffect, useState, useCallback } from 'react';
import {
  Upload,
  Trash2,
  DollarSign,
  Download,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api, Image } from '../lib/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const categories = ['Nature', 'Architecture', 'Portrait', 'Abstract', 'Street', 'Wildlife', 'Landscape'];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Nature',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);

  const fetchImages = useCallback(async () => {
    try {
      const data = await api.getImagesByCreator(user?.id || '');
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    try {
      const transactions = await api.getTransactionsByCreator(user?.id || '');
      const earnings = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setTotalEarnings(earnings);

      const images = await api.getImagesByCreator(user?.id || '');
      const downloads = images?.reduce((sum, img) => sum + Number(img.downloads), 0) || 0;
      setTotalDownloads(downloads);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchImages();
      fetchStats();
    }
  }, [user, fetchImages, fetchStats]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !thumbnailFile || !user) return;

    setUploading(true);

    try {
      // Upload images to Cloudinary first
      const uploadResult = await api.uploadImages(imageFile, thumbnailFile);

      // Create image record in database
      await api.createImage({
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        creator_id: user.id,
        title: uploadForm.title,
        description: uploadForm.description,
        image_url: uploadResult.image_url,
        thumbnail_url: uploadResult.thumbnail_url,
        price: parseFloat(uploadForm.price) / 83, // Convert INR to USD for storage
        category: uploadForm.category,
        downloads: 0,
      });

      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', price: '', category: 'Nature' });
      setImageFile(null);
      setThumbnailFile(null);
      fetchImages();
      fetchStats();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };



  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.deleteImage(imageId);
      fetchImages();
      fetchStats();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to continue</h2>
          <button
            onClick={() => onNavigate('login')}
            className="bg-amber-500 text-white px-8 py-3 rounded-full hover:bg-amber-600"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900">₹{Math.round(totalEarnings * 83)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <Download className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Downloads</p>
            <p className="text-3xl font-bold text-gray-900">{totalDownloads}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <ImageIcon className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Images</p>
            <p className="text-3xl font-bold text-gray-900">{images.length}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Images</h2>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-amber-500 text-white px-6 py-3 rounded-full hover:bg-amber-600 transition-colors flex items-center space-x-2 font-medium"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Image</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <div className="h-64 overflow-hidden">
                  <img
                    src={image.thumbnail_url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{image.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{image.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-black">₹{Math.round(image.price * 83)}</span>
                    <span className="text-sm text-gray-500">{image.downloads} downloads</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">You haven't uploaded any images yet</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-amber-500 text-white px-8 py-3 rounded-full hover:bg-amber-600"
            >
              Upload Your First Image
            </button>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Upload New Image</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Amazing Sunset"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Describe your image..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={uploadForm.price}
                  onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="99.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Resolution Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
