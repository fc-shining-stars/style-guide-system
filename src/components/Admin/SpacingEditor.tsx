'use client';

import React, { useState } from 'react';
import { Spacing } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SpacingEditorProps {
  spacing?: Spacing;
  onSave: (spacing: Spacing) => void;
  onCancel: () => void;
  userId: string;
}

export default function SpacingEditor({
  spacing,
  onSave,
  onCancel,
  userId,
}: SpacingEditorProps) {
  const [name, setName] = useState(spacing?.name || '');
  const [scale, setScale] = useState<Record<string, string>>(
    spacing?.scale || {
      '0': '0px',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '32': '8rem',
      '40': '10rem',
      '48': '12rem',
      '56': '14rem',
      '64': '16rem',
      '80': '20rem',
      '96': '24rem',
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
      
      // Prepare spacing data
      const updatedSpacing: Spacing = {
        id: spacing?.id || uuidv4(),
        name,
        version: spacing ? spacing.version + 1 : 1,
        scale,
        createdAt: spacing?.createdAt || now,
        updatedAt: now,
        createdBy: spacing?.createdBy || userId,
      };

      // Save to database
      if (spacing) {
        // Update existing spacing
        const { error } = await supabase
          .from('spacings')
          .update(updatedSpacing)
          .eq('id', spacing.id);

        if (error) throw error;
      } else {
        // Create new spacing
        const { error } = await supabase
          .from('spacings')
          .insert(updatedSpacing);

        if (error) throw error;
      }

      // Call onSave with the updated spacing
      onSave(updatedSpacing);
    } catch (err) {
      console.error('Error saving spacing:', err);
      setErrorMessage('Failed to save spacing. Please try again.');
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Spacing Scale</h3>
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
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spacing Scale</h4>
              <div className="flex flex-wrap gap-4">
                {Object.entries(scale)
                  .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 dark:bg-blue-600" 
                        style={{ 
                          width: value,
                          height: '8px',
                          borderRadius: '2px'
                        }}
                      />
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Margin Example</h4>
              <div className="flex flex-wrap gap-4">
                {Object.entries(scale)
                  .filter(([key]) => ['2', '4', '8', '16'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center">
                      <div className="bg-gray-200 dark:bg-gray-700 p-1">
                        <div 
                          className="bg-blue-500 dark:bg-blue-600 w-16 h-16 flex items-center justify-center text-white"
                          style={{ margin: value }}
                        >
                          m-{key}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        margin: {value}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Padding Example</h4>
              <div className="flex flex-wrap gap-4">
                {Object.entries(scale)
                  .filter(([key]) => ['2', '4', '8', '16'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 dark:bg-blue-600 w-20 h-20 flex items-center justify-center text-white"
                        style={{ padding: value }}
                      >
                        p-{key}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        padding: {value}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
