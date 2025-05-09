'use client';

import React, { useState, useRef } from 'react';
import { Image } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploaderProps {
  onSave: (image: Image) => void;
  onCancel: () => void;
  userId: string;
}

export default function ImageUploader({
  onSave,
  onCancel,
  userId,
}: ImageUploaderProps) {
  const [name, setName] = useState('');
  const [alt, setAlt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setErrorMessage('Please select an image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 5MB.');
        return;
      }
      
      setFile(selectedFile);
      setName(selectedFile.name.split('.')[0]); // Set name to filename without extension
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type
      if (!droppedFile.type.startsWith('image/')) {
        setErrorMessage('Please select an image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (droppedFile.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 5MB.');
        return;
      }
      
      setFile(droppedFile);
      setName(droppedFile.name.split('.')[0]); // Set name to filename without extension
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(droppedFile);
      
      setErrorMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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
    
    if (!file) {
      setErrorMessage('Please select an image to upload.');
      return;
    }
    
    if (!name.trim()) {
      setErrorMessage('Please enter a name for the image.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const imageId = uuidv4();
      const fileExt = file.name.split('.').pop();
      const fileName = `${imageId}.${fileExt}`;
      const thumbnailName = `${imageId}_thumb.${fileExt}`;
      
      // Upload original image
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      // Create thumbnail (in a real app, you might want to use a serverless function for this)
      // For now, we'll just use the same image as the thumbnail
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('images')
        .upload(thumbnailName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (thumbnailError) throw thumbnailError;
      
      // Get thumbnail public URL
      const { data: { publicUrl: thumbnailUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(thumbnailName);
      
      // Get image dimensions
      const img = new Image();
      img.src = preview!;
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      // Create image record in database
      const now = new Date().toISOString();
      const newImage: Image = {
        id: imageId,
        name,
        url: publicUrl,
        thumbnailUrl,
        alt: alt || name,
        category: category || undefined,
        tags: tags.length > 0 ? tags : undefined,
        width: img.width,
        height: img.height,
        size: file.size,
        format: fileExt?.toUpperCase() || 'Unknown',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };
      
      const { error: dbError } = await supabase
        .from('images')
        .insert(newImage);
      
      if (dbError) throw dbError;
      
      // Call onSave with the new image
      onSave(newImage);
    } catch (err) {
      console.error('Error uploading image:', err);
      setErrorMessage('Failed to upload image. Please try again.');
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

      <div>
        <div
          className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer ${
            preview ? 'border-gray-300 dark:border-gray-600' : 'border-blue-300 dark:border-blue-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {preview ? (
            <div className="relative w-full">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto object-contain"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop an image, or click to select
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
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

      {isLoading && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
          <div className="flex items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {uploadProgress}%
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
            Uploading image...
          </p>
        </div>
      )}

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
          disabled={isLoading || !file}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
