'use client';

import React, { useState } from 'react';
import { Image } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageEditorProps {
  image: Image;
  onSave: (image: Image) => void;
  onCancel: () => void;
  userId: string;
}

export default function ImageEditor({
  image,
  onSave,
  onCancel,
  userId,
}: ImageEditorProps) {
  const [name, setName] = useState(image.name);
  const [alt, setAlt] = useState(image.alt || '');
  const [category, setCategory] = useState(image.category || '');
  const [tags, setTags] = useState<string[]>(image.tags || []);
  const [tagInput, setTagInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrorMessage('Please enter a name for the image.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Update image record in database
      const updatedImage: Image = {
        ...image,
        name,
        alt: alt || name,
        category: category || undefined,
        tags: tags.length > 0 ? tags : undefined,
        updatedAt: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('images')
        .update({
          name,
          alt: alt || name,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', image.id);
      
      if (error) throw error;
      
      // Call onSave with the updated image
      onSave(updatedImage);
    } catch (err) {
      console.error('Error updating image:', err);
      setErrorMessage('Failed to update image. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-center">
        <img
          src={image.url}
          alt={image.alt || image.name}
          className="max-h-64 object-contain rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="alt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Alt Text
          </label>
          <input
            type="text"
            id="alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Describe the image for accessibility"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., icons, backgrounds, logos"
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="flex-1 min-w-0 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Add tags and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 sm:text-sm"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    <XMarkIcon className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{image.width}×{image.height}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Size:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{(image.size / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Format:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{image.format || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Uploaded:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{new Date(image.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
