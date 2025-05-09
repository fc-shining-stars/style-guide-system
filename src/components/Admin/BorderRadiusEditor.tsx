'use client';

import React, { useState } from 'react';
import { BorderRadius } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BorderRadiusEditorProps {
  borderRadius?: BorderRadius;
  onSave: (borderRadius: BorderRadius) => void;
  onCancel: () => void;
  userId: string;
}

export default function BorderRadiusEditor({
  borderRadius,
  onSave,
  onCancel,
  userId,
}: BorderRadiusEditorProps) {
  const [name, setName] = useState(borderRadius?.name || '');
  const [scale, setScale] = useState<Record<string, string>>(
    borderRadius?.scale || {
      none: '0px',
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    }
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newScaleKey, setNewScaleKey] = useState('');
  const [newScaleValue, setNewScaleValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      
      // Prepare border radius data
      const updatedBorderRadius: BorderRadius = {
        id: borderRadius?.id || uuidv4(),
        name,
        version: borderRadius ? borderRadius.version + 1 : 1,
        scale,
        createdAt: borderRadius?.createdAt || now,
        updatedAt: now,
        createdBy: borderRadius?.createdBy || userId,
      };

      // Save to database
      if (borderRadius) {
        // Update existing border radius
        const { error } = await supabase
          .from('border_radiuses')
          .update(updatedBorderRadius)
          .eq('id', borderRadius.id);

        if (error) throw error;
      } else {
        // Create new border radius
        const { error } = await supabase
          .from('border_radiuses')
          .insert(updatedBorderRadius);

        if (error) throw error;
      }

      // Call onSave with the updated border radius
      onSave(updatedBorderRadius);
    } catch (err) {
      console.error('Error saving border radius:', err);
      setErrorMessage('Failed to save border radius. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScale = () => {
    if (!newScaleKey.trim()) return;
    
    setScale(prev => ({
      ...prev,
      [newScaleKey]: newScaleValue
    }));
    
    setNewScaleKey('');
    setNewScaleValue('');
  };

  const handleRemoveScale = (key: string) => {
    const newScale = { ...scale };
    delete newScale[key];
    setScale(newScale);
  };

  const handleScaleValueChange = (key: string, value: string) => {
    setScale(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Border Radius Scale</h3>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Key"
              value={newScaleKey}
              onChange={(e) => setNewScaleKey(e.target.value)}
              className="w-20 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <input
              type="text"
              placeholder="Value"
              value={newScaleValue}
              onChange={(e) => setNewScaleValue(e.target.value)}
              className="w-24 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleAddScale}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(scale).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className="w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {key}:
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleScaleValueChange(key, e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveScale(key)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preview</h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(scale).map(([key, value]) => (
              <div key={key} className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 bg-blue-500 dark:bg-blue-600" 
                  style={{ borderRadius: value }}
                />
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              </div>
            ))}
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
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
