'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Animation } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import AnimationEditor from '@/components/Admin/AnimationEditor';

export default function AnimationsPage() {
  const { 
    animations, 
    setAnimations, 
    activeAnimation, 
    setActiveAnimation,
    config,
    setConfig
  } = useStyleGuideStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnimation, setEditingAnimation] = useState<Animation | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
  const [previewAnimation, setPreviewAnimation] = useState<string | null>(null);
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
    const fetchAnimations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('animations')
          .select('*')
          .order('name');

        if (error) throw error;

        setAnimations(data as Animation[]);
        
        // If there's an active animation in config, set it
        if (config?.activeAnimation) {
          const active = data.find(animation => animation.id === config.activeAnimation);
          if (active) {
            setActiveAnimation(active as Animation);
          }
        }
      } catch (err) {
        console.error('Error fetching animations:', err);
        setError('Failed to load animation settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnimations();
  }, [setAnimations, setActiveAnimation, config]);

  const handleCreateNew = () => {
    setEditingAnimation(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (animation: Animation) => {
    setEditingAnimation(animation);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this animation setting?')) return;

    try {
      const { error } = await supabase
        .from('animations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAnimations(animations.filter(animation => animation.id !== id));
      
      // If the deleted animation was active, set active to null
      if (activeAnimation?.id === id) {
        setActiveAnimation(null);
        
        // Update config if needed
        if (config && config.activeAnimation === id) {
          const updatedConfig = { ...config, activeAnimation: null };
          setConfig(updatedConfig);
          
          // Update in database
          await supabase
            .from('style_guide_configs')
            .update({ activeAnimation: null })
            .eq('id', config.id);
        }
      }

      // Emit update for real-time sync
      emitUpdate('animation', 'remove', id);
    } catch (err) {
      console.error('Error deleting animation:', err);
      setError('Failed to delete animation. Please try again.');
    }
  };

  const handleSetActive = async (animation: Animation) => {
    try {
      setActiveAnimation(animation);
      
      // Update config if it exists
      if (config) {
        const updatedConfig = { ...config, activeAnimation: animation.id };
        setConfig(updatedConfig);
        
        // Update in database
        await supabase
          .from('style_guide_configs')
          .update({ activeAnimation: animation.id })
          .eq('id', config.id);
      }

      // Emit update for real-time sync
      emitUpdate('animation', 'setActive', animation);
    } catch (err) {
      console.error('Error setting active animation:', err);
      setError('Failed to set active animation. Please try again.');
    }
  };

  const handleSave = async (animation: Animation) => {
    setIsEditorOpen(false);
    
    // Update local state
    if (editingAnimation) {
      setAnimations(animations.map(a => 
        a.id === animation.id ? animation : a
      ));
      
      // Emit update for real-time sync
      emitUpdate('animation', 'update', animation);
    } else {
      setAnimations([...animations, animation]);
      
      // Emit update for real-time sync
      emitUpdate('animation', 'add', animation);
    }
  };

  const handlePreview = (animationName: string) => {
    setPreviewAnimation(animationName === previewAnimation ? null : animationName);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Animations</h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Animation
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
      ) : animations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No animation settings found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {animations.map((animation) => (
            <div
              key={animation.id}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {animation.name}
                      </h3>
                      {activeAnimation?.id === animation.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      v{animation.version}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreview(animation.id)}
                      className={`text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 ${
                        previewAnimation === animation.id ? 'text-blue-500 dark:text-blue-400' : ''
                      }`}
                      title="Preview"
                    >
                      <PlayIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEdit(animation)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(animation.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <div className="flex justify-center">
                      <div 
                        className={`w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-md ${
                          previewAnimation === animation.id ? 'animate-bounce' : ''
                        }`}
                      />
                    </div>
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Transitions</h4>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Duration:</span>
                            <ul className="mt-1 space-y-1">
                              {Object.entries(animation.transitions.duration).map(([key, value]) => (
                                <li key={key}>{key}: {value}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-medium">Easing:</span>
                            <ul className="mt-1 space-y-1">
                              {Object.entries(animation.transitions.easing).map(([key, value]) => (
                                <li key={key}>{key}: {value}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    {animation.animations && Object.keys(animation.animations).length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Animations</h4>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <ul className="space-y-1">
                            {Object.keys(animation.animations).map((key) => (
                              <li key={key}>{key}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={() => handleSetActive(animation)}
                    className={`w-full flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                      activeAnimation?.id === animation.id
                        ? 'border-green-500 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {activeAnimation?.id === animation.id ? (
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

      {/* Animation Editor Dialog */}
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
                {editingAnimation ? 'Edit Animation' : 'Create New Animation'}
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <AnimationEditor
                animation={editingAnimation}
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
