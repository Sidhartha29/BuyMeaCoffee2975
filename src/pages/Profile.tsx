import React, { useEffect, useState, useCallback } from 'react';
import { Coffee, ShoppingCart, Download } from 'lucide-react';
import { api, Image, Profile as ProfileType } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
  creatorId: string;
  onNavigate: (page: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ creatorId, onNavigate }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getProfile(creatorId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [creatorId]);

  const fetchImages = useCallback(async () => {
    try {
      const data = await api.getImagesByCreator(creatorId);
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchProfile();
    fetchImages();
  }, [fetchProfile, fetchImages]);

  const handlePurchase = async (image: Image) => {
    if (!user) {
      onNavigate('login');
      return;
    }

    setSelectedImage(image);
  };

  const initiatePayment = async () => {
    if (!selectedImage || !user) return;

    try {
      // Create transaction
      await api.createTransaction({
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        buyer_id: user.id,
        creator_id: selectedImage.creator_id,
        image_id: selectedImage.id,
        amount: selectedImage.price,
        status: 'completed',
        stripe_payment_id: `mock_${Date.now()}`
      });

      alert('Purchase successful! The image has been added to your downloads.');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to complete purchase. Please try again.');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Creator not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8">
            <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.name}</h1>
              <p className="text-gray-600 mb-4">{profile.bio || 'No bio yet'}</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-full">
                  <Coffee className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-gray-900">{images.length} Images</span>
                </div>
                <div className="flex items-center space-x-2 bg-amber-50 px-4 py-2 rounded-full">
                  <Download className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-gray-900">
                    {images.reduce((sum, img) => sum + img.downloads, 0)} Downloads
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Available Images</h2>
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
                    src={image.thumbnail_url.startsWith('data:') ? image.thumbnail_url : image.thumbnail_url}
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
                    <span className="text-2xl font-bold text-black">₹{Math.round(image.price * 83)}</span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                      {image.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePurchase(image)}
                    className="w-full bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Buy & Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No images available yet</p>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Purchase</h2>
            <div className="mb-6">
              <img
                src={selectedImage.thumbnail_url}
                alt={selectedImage.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedImage.title}</h3>
              <p className="text-gray-600 mb-4">{selectedImage.description}</p>
              <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total:</span>
                <span className="text-2xl font-bold text-black">
                  ₹{Math.round(selectedImage.price * 83)}
                </span>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={initiatePayment}
                className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 font-medium"
              >
                Pay with Stripe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
