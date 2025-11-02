import React, { useEffect, useState } from 'react';
import { Coffee, Image as ImageIcon, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { api, Image, Profile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [featuredImages, setFeaturedImages] = useState<(Image & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedImages();
  }, []);

  const fetchFeaturedImages = async () => {
    try {
      const data = await api.getImages(1, 50); // Get first 50 images for sorting
      // Sort by downloads and take top 6
      const sortedImages = data.images.sort((a: Image, b: Image) => b.downloads - a.downloads).slice(0, 6);
      setFeaturedImages(sortedImages as (Image & { profiles: Profile })[]);
    } catch (error) {
      console.error('Error fetching featured images:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Support Creators,
              <br />
              <span className="text-primary">Download Amazing Art</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover stunning 4K and RAW images from talented creators worldwide. Support their
              work with a single purchase.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => onNavigate('explore')}
                className="bg-primary text-secondary px-8 py-4 rounded-full hover:bg-primary/80 transition-all transform hover:scale-105 font-semibold text-lg flex items-center space-x-2 shadow-lg"
              >
                <span>Explore Images</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              {!user && (
                <button
                  onClick={() => onNavigate('signup')}
                  className="bg-accent text-primary px-8 py-4 rounded-full hover:bg-accent/80 transition-all transform hover:scale-105 font-semibold text-lg border-2 border-primary"
                >
                  Become a Creator
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-primary/25 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transform hover:scale-105 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <ImageIcon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">High Quality</h3>
              <p className="text-gray-600">
                Download premium 4K and RAW images perfect for any project
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transform hover:scale-105 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Support Creators</h3>
              <p className="text-gray-600">
                Directly support talented artists with your purchases
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transform hover:scale-105 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Instant Download</h3>
              <p className="text-gray-600">
                Get immediate access to your purchased images securely
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Images</h2>
            <p className="text-xl text-gray-600">
              Discover the most popular images from our community
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse"
                >
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => onNavigate(`profile/${image.creator_id}`)}
                >
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{image.title}</h3>
                    <p className="text-gray-600 mb-4 flex items-center space-x-2">
                      <Coffee className="w-4 h-4 text-primary" />
                      <span>{image.profiles?.name}</span>
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-black">₹{image.price}</span>
                      <span className="text-sm text-gray-500">{image.downloads} downloads</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl text-gray-600">No images yet. Be the first to upload!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('explore')}
              className="bg-primary text-secondary px-8 py-3 rounded-full hover:bg-primary/80 transition-colors font-semibold inline-flex items-center space-x-2"
            >
              <span>View All Images</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
