'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Typography } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import TypographyEditor from '@/components/Admin/TypographyEditor';

export default function TypographyPage() {
  const { 
    typographies, 
    setTypographies, 
    activeTypography, 
    setActiveTypography,
    config,
    setConfig
  } = useStyleGuideStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTypography, setEditingTypography] = useState<Typography | undefined>(undefined);
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
    const fetchTypographies = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('typographies')
          .select('*')
          .order('name');

        if (error) throw error;

        setTypographies(data as Typography[]);
        
        // If there's an active typography in config, set it
        if (config?.activeTypography) {
          const active = data.find(typography => typography.id === config.activeTypography);
          if (active) {
            setActiveTypography(active as Typography);
          }
        }
      } catch (err) {
        console.error('Error fetching typographies:', err);
        setError('Failed to load typography settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypographies();
  }, [setTypographies, setActiveTypography, config]);

  const handleCreateNew = () => {
    setEditingTypography(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (typography: Typography) => {
    setEditingTypography(typography);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this typography setting?')) return;

    try {
      const { error } = await supabase
        .from('typographies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTypographies(typographies.filter(typography => typography.id !== id));
      
      // If the deleted typography was active, set active to null
      if (activeTypography?.id === id) {
        setActiveTypography(null);
        
        // Update config if needed
        if (config && config.activeTypography === id) {
          const updatedConfig = { ...config, activeTypography: null };
          setConfig(updatedConfig);
          
          // Update in database
          await supabase
            .from('style_guide_configs')
            .update({ activeTypography: null })
            .eq('id', config.id);
        }
      }

      // Emit update for real-time sync
      emitUpdate('typography', 'remove', id);
    } catch (err) {
      console.error('Error deleting typography:', err);
      setError('Failed to delete typography. Please try again.');
    }
  };

  const handleSetActive = async (typography: Typography) => {
    try {
      setActiveTypography(typography);
      
      // Update config if it exists
      if (config) {
        const updatedConfig = { ...config, activeTypography: typography.id };
        setConfig(updatedConfig);
        
        // Update in database
        await supabase
          .from('style_guide_configs')
          .update({ activeTypography: typography.id })
          .eq('id', config.id);
      }

      // Emit update for real-time sync
      emitUpdate('typography', 'setActive', typography);
    } catch (err) {
      console.error('Error setting active typography:', err);
      setError('Failed to set active typography. Please try again.');
    }
  };

  const handleSave = async (typography: Typography) => {
    setIsEditorOpen(false);
    
    // Update local state
    if (editingTypography) {
      setTypographies(typographies.map(t => 
        t.id === typography.id ? typography : t
      ));
      
      // Emit update for real-time sync
      emitUpdate('typography', 'update', typography);
    } else {
      setTypographies([...typographies, typography]);
      
      // Emit update for real-time sync
      emitUpdate('typography', 'add', typography);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Typography</h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Typography
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
      ) : typographies.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No typography settings found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {typographies.map((typography) => (
            <div
              key={typography.id}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {typography.name}
                      </h3>
                      {activeTypography?.id === typography.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      v{typography.version}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(typography)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(typography.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <p 
                      className="font-bold" 
                      style={{ 
                        fontFamily: typography.fontFamily.primary, 
                        fontSize: '1.5rem',
                        lineHeight: typography.headings?.lineHeight || 1.2
                      }}
                    >
                      Heading Sample
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <p 
                      style={{ 
                        fontFamily: typography.fontFamily.primary, 
                        fontSize: '1rem',
                        lineHeight: typography.body?.lineHeight || 1.5,
                        fontWeight: typography.body?.fontWeight || 400
                      }}
                    >
                      Body text sample with the {typography.name} typography settings. This shows how paragraphs will look in your design system.
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleSetActive(typography)}
                    className={`w-full flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                      activeTypography?.id === typography.id
                        ? 'border-green-500 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {activeTypography?.id === typography.id ? (
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

      {/* Typography Editor Dialog */}
      <Dialog
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                {editingTypography ? 'Edit Typography' : 'Create New Typography'}
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <TypographyEditor
                typography={editingTypography}
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
