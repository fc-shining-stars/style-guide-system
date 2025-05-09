'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Component } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import ComponentEditor from '@/components/Admin/ComponentEditor';
import ComponentPreview from '@/components/Admin/ComponentPreview';

export default function ComponentsPage() {
  const { 
    components, 
    setComponents,
    addComponent,
    updateComponent,
    removeComponent,
    config
  } = useStyleGuideStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | undefined>(undefined);
  const [previewingComponent, setPreviewingComponent] = useState<Component | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    const fetchComponents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('components')
          .select('*')
          .order('name');

        if (error) throw error;

        setComponents(data as Component[]);
      } catch (err) {
        console.error('Error fetching components:', err);
        setError('Failed to load components. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, [setComponents]);

  const handleCreateNew = () => {
    setEditingComponent(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setIsEditorOpen(true);
  };

  const handlePreview = (component: Component) => {
    setPreviewingComponent(component);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    try {
      const { error } = await supabase
        .from('components')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      removeComponent(id);
      
      // Emit update for real-time sync
      emitUpdate('component', 'remove', id);
    } catch (err) {
      console.error('Error deleting component:', err);
      setError('Failed to delete component. Please try again.');
    }
  };

  const handleSave = async (component: Component) => {
    setIsEditorOpen(false);
    
    try {
      // Update local state
      if (editingComponent) {
        updateComponent(component);
        
        // Emit update for real-time sync
        emitUpdate('component', 'update', component);
      } else {
        addComponent(component);
        
        // Emit update for real-time sync
        emitUpdate('component', 'add', component);
      }
    } catch (err) {
      console.error('Error saving component:', err);
      setError('Failed to save component. Please try again.');
    }
  };

  // Filter components based on type and search query
  const filteredComponents = components.filter(component => {
    const matchesFilter = activeFilter === 'all' || component.type === activeFilter;
    const matchesSearch = searchQuery === '' || 
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Get unique component types for filter
  const componentTypes = ['all', ...Array.from(new Set(components.map(c => c.type)))];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Components</h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Component
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
            Search components
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search components"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {componentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                activeFilter === type
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
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
      ) : filteredComponents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {components.length === 0
              ? 'No components found. Create your first one!'
              : 'No components match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {component.name}
                      </h3>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {component.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      v{component.version}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePreview(component)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      title="Preview"
                    >
                      <EyeIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEdit(component)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(component.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                  {component.description}
                </p>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <CodeBracketIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Object.keys(component.variants || {}).length} variants
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Updated {new Date(component.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Component Editor Dialog */}
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
                {editingComponent ? 'Edit Component' : 'Create New Component'}
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <ComponentEditor
                component={editingComponent}
                onSave={handleSave}
                onCancel={() => setIsEditorOpen(false)}
                userId={userId}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Component Preview Dialog */}
      <Dialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                {previewingComponent?.name} Preview
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              {previewingComponent && (
                <ComponentPreview
                  component={previewingComponent}
                  onClose={() => setIsPreviewOpen(false)}
                />
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
