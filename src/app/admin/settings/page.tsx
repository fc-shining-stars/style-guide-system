'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { StyleGuideConfig, VersionHistory } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { 
  ArrowPathIcon, 
  CloudArrowUpIcon, 
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

export default function SettingsPage() {
  const { 
    config, 
    setConfig, 
    isRealTimeEnabled,
    toggleRealTime,
    isLoading, 
    setIsLoading, 
    error, 
    setError 
  } = useStyleGuideStore();
  
  const [name, setName] = useState(config?.name || '');
  const [description, setDescription] = useState(config?.description || '');
  const [version, setVersion] = useState(config?.version || '1.0.0');
  const [customFeatures, setCustomFeatures] = useState<Record<string, boolean>>(
    config?.customFeatures || {
      customCursor: false,
      customScrollbar: false,
    }
  );
  
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [newVersionChanges, setNewVersionChanges] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    if (config) {
      setName(config.name);
      setDescription(config.description);
      setVersion(config.version);
      setCustomFeatures(config.customFeatures);
    }
  }, [config]);

  useEffect(() => {
    const fetchVersionHistory = async () => {
      if (!config) return;
      
      try {
        const { data, error } = await supabase
          .from('version_histories')
          .select('*')
          .eq('style_guide_id', config.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setVersionHistory(data as VersionHistory[]);
      } catch (err) {
        console.error('Error fetching version history:', err);
        setError('Failed to load version history. Please try again.');
      }
    };

    fetchVersionHistory();
  }, [config, setError]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name for the style guide.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const now = new Date().toISOString();
      
      if (config) {
        // Update existing config
        const { error } = await supabase
          .from('style_guide_configs')
          .update({
            name,
            description,
            version,
            custom_features: customFeatures,
            updated_at: now,
          })
          .eq('id', config.id);
        
        if (error) throw error;
        
        // Update local state
        setConfig({
          ...config,
          name,
          description,
          version,
          customFeatures,
          updatedAt: now,
        });
        
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Create new config
        const newConfig: StyleGuideConfig = {
          id: uuidv4(),
          name,
          description,
          version,
          activeColorScheme: '',
          activeTypography: '',
          activeSpacing: '',
          activeBorderRadius: '',
          activeShadow: '',
          activeAnimation: '',
          customFeatures,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };
        
        const { error } = await supabase
          .from('style_guide_configs')
          .insert({
            id: newConfig.id,
            name,
            description,
            version,
            active_color_scheme: null,
            active_typography: null,
            active_spacing: null,
            active_border_radius: null,
            active_shadow: null,
            active_animation: null,
            custom_features: customFeatures,
            created_at: now,
            updated_at: now,
            created_by: userId,
          });
        
        if (error) throw error;
        
        // Update local state
        setConfig(newConfig);
        
        setSuccessMessage('Settings created successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVersionChanges.trim()) {
      setError('Please enter changes for the new version.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      if (!config) {
        throw new Error('No style guide configuration found.');
      }
      
      // Parse current version and increment
      const versionParts = version.split('.').map(Number);
      versionParts[2] += 1; // Increment patch version
      const newVersion = versionParts.join('.');
      
      const now = new Date().toISOString();
      
      // Create version history record
      const newVersionHistory: VersionHistory = {
        id: uuidv4(),
        styleGuideId: config.id,
        version: newVersion,
        changes: newVersionChanges,
        snapshot: { ...config },
        createdAt: now,
        createdBy: userId,
      };
      
      const { error: versionError } = await supabase
        .from('version_histories')
        .insert({
          id: newVersionHistory.id,
          style_guide_id: newVersionHistory.styleGuideId,
          version: newVersionHistory.version,
          changes: newVersionHistory.changes,
          snapshot: newVersionHistory.snapshot,
          created_at: now,
          created_by: userId,
        });
      
      if (versionError) throw versionError;
      
      // Update config with new version
      const { error: configError } = await supabase
        .from('style_guide_configs')
        .update({
          version: newVersion,
          updated_at: now,
        })
        .eq('id', config.id);
      
      if (configError) throw configError;
      
      // Update local state
      setConfig({
        ...config,
        version: newVersion,
        updatedAt: now,
      });
      
      setVersion(newVersion);
      setVersionHistory([newVersionHistory, ...versionHistory]);
      setNewVersionChanges('');
      setIsVersionDialogOpen(false);
      
      setSuccessMessage('New version created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error creating new version:', err);
      setError('Failed to create new version. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFeature = (feature: string) => {
    setCustomFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <button
          onClick={() => setIsVersionDialogOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create New Version
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md flex justify-between items-center">
          <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700 dark:hover:text-green-300"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Style Guide Configuration</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Basic settings for your style guide.
          </p>
        </div>
        
        <form onSubmit={handleSaveSettings} className="px-4 py-5 sm:p-6">
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
              <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Version
              </label>
              <input
                type="text"
                id="version"
                value={version}
                readOnly
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use the "Create New Version" button to update the version.
              </p>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Features</h3>
            <div className="mt-2 space-y-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="customCursor"
                    type="checkbox"
                    checked={customFeatures.customCursor || false}
                    onChange={() => handleToggleFeature('customCursor')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="customCursor" className="font-medium text-gray-700 dark:text-gray-300">
                    Custom Cursor
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    Enable custom cursor styles for your style guide.
                  </p>
                </div>
              </div>
              
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="customScrollbar"
                    type="checkbox"
                    checked={customFeatures.customScrollbar || false}
                    onChange={() => handleToggleFeature('customScrollbar')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="customScrollbar" className="font-medium text-gray-700 dark:text-gray-300">
                    Custom Scrollbar
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    Enable custom scrollbar styles for your style guide.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time Updates</h3>
            <div className="mt-2 space-y-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="realTimeUpdates"
                    type="checkbox"
                    checked={isRealTimeEnabled}
                    onChange={toggleRealTime}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="realTimeUpdates" className="font-medium text-gray-700 dark:text-gray-300">
                    Enable Real-time Updates
                  </label>
                  <p className="text-gray-500 dark:text-gray-400">
                    When enabled, changes will be synchronized in real-time across all connected clients.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Version History</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Track changes to your style guide over time.
          </p>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {versionHistory.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400">No version history available.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {versionHistory.map((version) => (
                <li key={version.id} className="py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          Version {version.version}
                        </h4>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {version.changes}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* New Version Dialog */}
      <Dialog
        open={isVersionDialogOpen}
        onClose={() => setIsVersionDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Version
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleCreateNewVersion} className="p-6">
              <div>
                <label htmlFor="currentVersion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Version
                </label>
                <input
                  type="text"
                  id="currentVersion"
                  value={version}
                  readOnly
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 sm:text-sm"
                />
              </div>
              
              <div className="mt-4">
                <label htmlFor="newVersionChanges" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Changes in this Version
                </label>
                <textarea
                  id="newVersionChanges"
                  value={newVersionChanges}
                  onChange={(e) => setNewVersionChanges(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe the changes in this version..."
                  required
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsVersionDialogOpen(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Version'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
