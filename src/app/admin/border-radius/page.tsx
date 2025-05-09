'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { BorderRadius } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import BorderRadiusEditor from '@/components/Admin/BorderRadiusEditor';

export default function BorderRadiusPage() {
  const { 
    borderRadiuses, 
    setBorderRadiuses, 
    activeBorderRadius, 
    setActiveBorderRadius,
    config,
    setConfig
  } = useStyleGuideStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBorderRadius, setEditingBorderRadius] = useState<BorderRadius | undefined>(undefined);
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
    const fetchBorderRadiuses = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('border_radiuses')
          .select('*')
          .order('name');

        if (error) throw error;

        setBorderRadiuses(data as BorderRadius[]);
        
        // If there's an active border radius in config, set it
        if (config?.activeBorderRadius) {
          const active = data.find(br => br.id === config.activeBorderRadius);
          if (active) {
            setActiveBorderRadius(active as BorderRadius);
          }
        }
      } catch (err) {
        console.error('Error fetching border radiuses:', err);
        setError('Failed to load border radius settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBorderRadiuses();
  }, [setBorderRadiuses, setActiveBorderRadius, config]);

  const handleCreateNew = () => {
    setEditingBorderRadius(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (borderRadius: BorderRadius) => {
    setEditingBorderRadius(borderRadius);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this border radius setting?')) return;

    try {
      const { error } = await supabase
        .from('border_radiuses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setBorderRadiuses(borderRadiuses.filter(br => br.id !== id));
      
      // If the deleted border radius was active, set active to null
      if (activeBorderRadius?.id === id) {
        setActiveBorderRadius(null);
        
        // Update config if needed
        if (config && config.activeBorderRadius === id) {
          const updatedConfig = { ...config, activeBorderRadius: null };
          setConfig(updatedConfig);
          
          // Update in database
          await supabase
            .from('style_guide_configs')
            .update({ activeBorderRadius: null })
            .eq('id', config.id);
        }
      }

      // Emit update for real-time sync
      emitUpdate('borderRadius', 'remove', id);
    } catch (err) {
      console.error('Error deleting border radius:', err);
      setError('Failed to delete border radius. Please try again.');
    }
  };

  const handleSetActive = async (borderRadius: BorderRadius) => {
    try {
      setActiveBorderRadius(borderRadius);
      
      // Update config if it exists
      if (config) {
        const updatedConfig = { ...config, activeBorderRadius: borderRadius.id };
        setConfig(updatedConfig);
        
        // Update in database
        await supabase
          .from('style_guide_configs')
          .update({ activeBorderRadius: borderRadius.id })
          .eq('id', config.id);
      }

      // Emit update for real-time sync
      emitUpdate('borderRadius', 'setActive', borderRadius);
    } catch (err) {
      console.error('Error setting active border radius:', err);
      setError('Failed to set active border radius. Please try again.');
    }
  };

  const handleSave = async (borderRadius: BorderRadius) => {
    setIsEditorOpen(false);
    
    // Update local state
    if (editingBorderRadius) {
      setBorderRadiuses(borderRadiuses.map(br => 
        br.id === borderRadius.id ? borderRadius : br
      ));
      
      // Emit update for real-time sync
      emitUpdate('borderRadius', 'update', borderRadius);
    } else {
      setBorderRadiuses([...borderRadiuses, borderRadius]);
      
      // Emit update for real-time sync
      emitUpdate('borderRadius', 'add', borderRadius);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Border Radius</h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Border Radius
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
      ) : borderRadiuses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No border radius settings found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {borderRadiuses.map((borderRadius) => (
            <div
              key={borderRadius.id}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {borderRadius.name}
                      </h3>
                      {activeBorderRadius?.id === borderRadius.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      v{borderRadius.version}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(borderRadius)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(borderRadius.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(borderRadius.scale).map(([key, value]) => (
                        <div 
                          key={key} 
                          className="flex flex-col items-center"
                          title={`${key}: ${value}`}
                        >
                          <div 
                            className="w-12 h-12 bg-blue-500 dark:bg-blue-600" 
                            style={{ 
                              borderRadius: value
                            }}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleSetActive(borderRadius)}
                    className={`w-full flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                      activeBorderRadius?.id === borderRadius.id
                        ? 'border-green-500 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {activeBorderRadius?.id === borderRadius.id ? (
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

      {/* Border Radius Editor Dialog */}
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
                {editingBorderRadius ? 'Edit Border Radius' : 'Create New Border Radius'}
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <BorderRadiusEditor
                borderRadius={editingBorderRadius}
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
