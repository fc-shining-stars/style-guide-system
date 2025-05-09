'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { ColorScheme } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import ColorSchemeEditor from '@/components/Admin/ColorSchemeEditor';

export default function ColorsPage() {
  const { 
    colorSchemes, 
    setColorSchemes, 
    activeColorScheme, 
    setActiveColorScheme,
    config,
    setConfig
  } = useStyleGuideStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingColorScheme, setEditingColorScheme] = useState<ColorScheme | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
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
    const fetchColorSchemes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('color_schemes')
          .select('*')
          .order('name');

        if (error) throw error;

        setColorSchemes(data as ColorScheme[]);
        
        // If there's an active color scheme in config, set it
        if (config?.activeColorScheme) {
          const active = data.find(scheme => scheme.id === config.activeColorScheme);
          if (active) {
            setActiveColorScheme(active as ColorScheme);
          }
        }
      } catch (err) {
        console.error('Error fetching color schemes:', err);
        setError('Failed to load color schemes. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchColorSchemes();
  }, [setColorSchemes, setActiveColorScheme, config]);

  const handleCreateNew = () => {
    setEditingColorScheme(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (colorScheme: ColorScheme) => {
    setEditingColorScheme(colorScheme);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this color scheme?')) return;

    try {
      const { error } = await supabase
        .from('color_schemes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setColorSchemes(colorSchemes.filter(scheme => scheme.id !== id));
      
      // If the deleted scheme was active, set active to null
      if (activeColorScheme?.id === id) {
        setActiveColorScheme(null);
        
        // Update config if needed
        if (config && config.activeColorScheme === id) {
          const updatedConfig = { ...config, activeColorScheme: null };
          setConfig(updatedConfig);
          
          // Update in database
          await supabase
            .from('style_guide_configs')
            .update({ activeColorScheme: null })
            .eq('id', config.id);
        }
      }

      // Emit update for real-time sync
      emitUpdate('colorScheme', 'remove', id);
    } catch (err) {
      console.error('Error deleting color scheme:', err);
      setError('Failed to delete color scheme. Please try again.');
    }
  };

  const handleSetActive = async (colorScheme: ColorScheme) => {
    try {
      setActiveColorScheme(colorScheme);
      
      // Update config if it exists
      if (config) {
        const updatedConfig = { ...config, activeColorScheme: colorScheme.id };
        setConfig(updatedConfig);
        
        // Update in database
        await supabase
          .from('style_guide_configs')
          .update({ activeColorScheme: colorScheme.id })
          .eq('id', config.id);
      }

      // Emit update for real-time sync
      emitUpdate('colorScheme', 'setActive', colorScheme);
    } catch (err) {
      console.error('Error setting active color scheme:', err);
      setError('Failed to set active color scheme. Please try again.');
    }
  };

  const handleSave = async (colorScheme: ColorScheme) => {
    setIsEditorOpen(false);
    
    // Update local state
    if (editingColorScheme) {
      setColorSchemes(colorSchemes.map(scheme => 
        scheme.id === colorScheme.id ? colorScheme : scheme
      ));
      
      // Emit update for real-time sync
      emitUpdate('colorScheme', 'update', colorScheme);
    } else {
      setColorSchemes([...colorSchemes, colorScheme]);
      
      // Emit update for real-time sync
      emitUpdate('colorScheme', 'add', colorScheme);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Color Schemes</h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Color Scheme
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

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
      ) : colorSchemes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No color schemes found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {colorSchemes.map((colorScheme) => (
            <div
              key={colorScheme.id}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {colorScheme.name}
                      </h3>
                      {activeColorScheme?.id === colorScheme.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      v{colorScheme.version}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(colorScheme)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(colorScheme.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {colorScheme.colors && colorScheme.colors.primary ? (
                    // New format with nested colors
                    Object.entries(colorScheme.colors.primary).map(([shade, color]) => (
                      <div 
                        key={`primary-${shade}`}
                        className="h-8 rounded"
                        style={{ backgroundColor: color }}
                        title={`Primary ${shade}: ${color}`}
                      />
                    ))
                  ) : (
                    // Old format with direct color properties
                    <div 
                      className="h-8 rounded col-span-4"
                      style={{ backgroundColor: colorScheme.primary }}
                      title={`Primary: ${colorScheme.primary}`}
                    />
                  )}
                </div>
                
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {colorScheme.colors && colorScheme.colors.secondary ? (
                    // New format with nested colors
                    Object.entries(colorScheme.colors.secondary).map(([shade, color]) => (
                      <div 
                        key={`secondary-${shade}`}
                        className="h-8 rounded"
                        style={{ backgroundColor: color }}
                        title={`Secondary ${shade}: ${color}`}
                      />
                    ))
                  ) : (
                    // Old format with direct color properties
                    <div 
                      className="h-8 rounded col-span-4"
                      style={{ backgroundColor: colorScheme.secondary }}
                      title={`Secondary: ${colorScheme.secondary}`}
                    />
                  )}
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleSetActive(colorScheme)}
                    className={`w-full flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                      activeColorScheme?.id === colorScheme.id
                        ? 'border-green-500 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {activeColorScheme?.id === colorScheme.id ? (
                      <>
                        <CheckIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                        Active
                      </>
                    ) : (
                      'Set as Active'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Color Scheme Editor Dialog */}
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
                {editingColorScheme ? 'Edit Color Scheme' : 'Create New Color Scheme'}
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <ColorSchemeEditor
                colorScheme={editingColorScheme}
                onSave={handleSave}
                onCancel={() => setIsEditorOpen(false)}
                userId={userId}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
