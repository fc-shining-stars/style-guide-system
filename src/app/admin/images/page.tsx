'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Image } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import ImageUploader from '@/components/Admin/ImageUploader';
import ImageEditor from '@/components/Admin/ImageEditor';

export default function ImagesPage() {
  const { config } = useStyleGuideStore();
  
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<Image | undefined>(undefined);
  const [previewingImage, setPreviewingImage] = useState<Image | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { emitUpdate } = useStyleGuideSocket({ userId });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .order('name');

        if (error) throw error;

        setImages(data as Image[]);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleUpload = () => {
    setIsUploaderOpen(true);
  };

  const handleEdit = (image: Image) => {
    setEditingImage(image);
    setIsEditorOpen(true);
  };

  const handlePreview = (image: Image) => {
    setPreviewingImage(image);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      // First, delete the file from storage
      const imageToDelete = images.find(img => img.id === id);
      if (imageToDelete) {
        const { error: storageError } = await supabase.storage
          .from('images')
          .remove([imageToDelete.url.split('/').pop() || '']);
        
        if (storageError) throw storageError;
        
        // If there's a thumbnail, delete it too
        if (imageToDelete.thumbnailUrl) {
          await supabase.storage
            .from('images')
            .remove([imageToDelete.thumbnailUrl.split('/').pop() || '']);
        }
      }

      // Then delete the database record
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setImages(images.filter(image => image.id !== id));
      
      // Emit update for real-time sync
      emitUpdate('image', 'remove', id);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
    }
  };

  const handleImageSave = (image: Image) => {
    // Update local state
    if (editingImage) {
      setImages(images.map(img => 
        img.id === image.id ? image : img
      ));
      
      // Emit update for real-time sync
      emitUpdate('image', 'update', image);
    } else {
      setImages([...images, image]);
      
      // Emit update for real-time sync
      emitUpdate('image', 'add', image);
    }
    
    setIsEditorOpen(false);
    setIsUploaderOpen(false);
  };

  const handleDownload = (image: Image) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter images based on category and search query
  const filteredImages = images.filter(image => {
    const matchesCategory = activeCategory === 'all' || image.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (image.alt && image.alt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (image.tags && image.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    return matchesCategory && matchesSearch;
  });

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(images.map(img => img.category || 'uncategorized').filter(Boolean)))];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Images</h1>
        <button
          onClick={handleUpload}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Upload Image
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <label htmlFor="search" className="sr-only">
            Search images
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search images"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeCategory === category
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {images.length === 0
              ? 'No images found. Upload your first one!'
              : 'No images match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
            >
              <div 
                className="h-48 bg-gray-200 dark:bg-gray-700 relative cursor-pointer"
                onClick={() => handlePreview(image)}
              >
                <img
                  src={image.thumbnailUrl || image.url}
                  alt={image.alt || image.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={image.name}>
                      {image.name}
                    </h3>
                    {image.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                        {image.category}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(image)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEdit(image)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                {image.tags && image.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {image.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                  <span>{image.width}×{image.height}</span>
                  <span>{(image.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Uploader Dialog */}
      <Dialog
        open={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Upload Image
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <ImageUploader
                onSave={handleImageSave}
                onCancel={() => setIsUploaderOpen(false)}
                userId={userId}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Image Editor Dialog */}
      <Dialog
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Edit Image
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              {editingImage && (
                <ImageEditor
                  image={editingImage}
                  onSave={handleImageSave}
                  onCancel={() => setIsEditorOpen(false)}
                  userId={userId}
                />
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-5xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                {previewingImage?.name}
              </Dialog.Title>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              {previewingImage && (
                <>
                  <div className="max-h-[70vh] overflow-auto">
                    <img
                      src={previewingImage.url}
                      alt={previewingImage.alt || previewingImage.name}
                      className="max-w-full h-auto"
                    />
                  </div>
                  
                  <div className="mt-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Details</h3>
                        <dl className="mt-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500 dark:text-gray-400">Dimensions:</dt>
                            <dd className="text-gray-900 dark:text-white">{previewingImage.width}×{previewingImage.height}</dd>
                          </div>
                          <div className="flex justify-between mt-1">
                            <dt className="text-gray-500 dark:text-gray-400">Size:</dt>
                            <dd className="text-gray-900 dark:text-white">{(previewingImage.size / 1024).toFixed(1)} KB</dd>
                          </div>
                          <div className="flex justify-between mt-1">
                            <dt className="text-gray-500 dark:text-gray-400">Format:</dt>
                            <dd className="text-gray-900 dark:text-white">{previewingImage.format || 'Unknown'}</dd>
                          </div>
                          <div className="flex justify-between mt-1">
                            <dt className="text-gray-500 dark:text-gray-400">Uploaded:</dt>
                            <dd className="text-gray-900 dark:text-white">{new Date(previewingImage.createdAt).toLocaleDateString()}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Usage</h3>
                        <div className="mt-2">
                          <label className="text-xs text-gray-500 dark:text-gray-400">Image URL:</label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                              type="text"
                              readOnly
                              value={previewingImage.url}
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <label className="text-xs text-gray-500 dark:text-gray-400">HTML Code:</label>
                          <div className="mt-1 flex rounded-md shadow-sm">
                            <input
                              type="text"
                              readOnly
                              value={`<img src="${previewingImage.url}" alt="${previewingImage.alt || previewingImage.name}" width="${previewingImage.width}" height="${previewingImage.height}" />`}
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => previewingImage && handleDownload(previewingImage)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Download
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
