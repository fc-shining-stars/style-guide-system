'use client';

import React, { useState } from 'react';
import { ColorScheme } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ColorSchemeEditorProps {
  colorScheme?: ColorScheme;
  onSave: (colorScheme: ColorScheme) => void;
  onCancel: () => void;
  userId: string;
}

export default function ColorSchemeEditor({
  colorScheme,
  onSave,
  onCancel,
  userId,
}: ColorSchemeEditorProps) {
  const [name, setName] = useState(colorScheme?.name || '');
  const [primary, setPrimary] = useState(colorScheme?.primary || '#3b82f6');
  const [secondary, setSecondary] = useState(colorScheme?.secondary || '#6b7280');
  const [accent, setAccent] = useState(colorScheme?.accent || '#8b5cf6');
  const [success, setSuccess] = useState(colorScheme?.success || '#10b981');
  const [warning, setWarning] = useState(colorScheme?.warning || '#f59e0b');
  const [error, setError] = useState(colorScheme?.error || '#ef4444');
  const [info, setInfo] = useState(colorScheme?.info || '#3b82f6');
  const [background, setBackground] = useState(colorScheme?.background || '#ffffff');
  const [surface, setSurface] = useState(colorScheme?.surface || '#f3f4f6');
  const [text, setText] = useState(colorScheme?.text || '#111827');
  
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Advanced color options (shades)
  const [primaryShades, setPrimaryShades] = useState<Record<string, string>>(
    colorScheme?.colors?.primary || {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
    }
  );

  const [secondaryShades, setSecondaryShades] = useState<Record<string, string>>(
    colorScheme?.colors?.secondary || {
      '50': '#f9fafb',
      '100': '#f3f4f6',
      '200': '#e5e7eb',
      '300': '#d1d5db',
      '400': '#9ca3af',
      '500': '#6b7280',
      '600': '#4b5563',
      '700': '#374151',
      '800': '#1f2937',
      '900': '#111827',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      
      // Prepare color scheme data
      const updatedColorScheme: ColorScheme = {
        id: colorScheme?.id || uuidv4(),
        name,
        version: colorScheme ? colorScheme.version + 1 : 1,
        primary,
        secondary,
        accent,
        success,
        warning,
        error,
        info,
        background,
        surface,
        text,
        colors: {
          primary: primaryShades,
          secondary: secondaryShades,
        },
        createdAt: colorScheme?.createdAt || now,
        updatedAt: now,
        createdBy: colorScheme?.createdBy || userId,
      };

      // Save to database
      if (colorScheme) {
        // Update existing color scheme
        const { error } = await supabase
          .from('color_schemes')
          .update(updatedColorScheme)
          .eq('id', colorScheme.id);

        if (error) throw error;
      } else {
        // Create new color scheme
        const { error } = await supabase
          .from('color_schemes')
          .insert(updatedColorScheme);

        if (error) throw error;
      }

      // Call onSave with the updated color scheme
      onSave(updatedColorScheme);
    } catch (err) {
      console.error('Error saving color scheme:', err);
      setErrorMessage('Failed to save color scheme. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimaryShadeChange = (shade: string, value: string) => {
    setPrimaryShades(prev => ({ ...prev, [shade]: value }));
    
    // If it's the 500 shade, also update the main primary color
    if (shade === '500') {
      setPrimary(value);
    }
  };

  const handleSecondaryShadeChange = (shade: string, value: string) => {
    setSecondaryShades(prev => ({ ...prev, [shade]: value }));
    
    // If it's the 500 shade, also update the main secondary color
    if (shade === '500') {
      setSecondary(value);
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

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Colors</h3>
        <button
          type="button"
          onClick={() => setIsAdvancedMode(!isAdvancedMode)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          {isAdvancedMode ? 'Switch to Basic Mode' : 'Switch to Advanced Mode'}
        </button>
      </div>

      {!isAdvancedMode ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="primary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="primary"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="secondary" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Secondary
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="secondary"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="accent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Accent
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="accent"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="success" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Success
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="success"
                value={success}
                onChange={(e) => setSuccess(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={success}
                onChange={(e) => setSuccess(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="warning" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Warning
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="warning"
                value={warning}
                onChange={(e) => setWarning(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={warning}
                onChange={(e) => setWarning(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="error" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Error
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="error"
                value={error}
                onChange={(e) => setError(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={error}
                onChange={(e) => setError(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="info" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Info
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="info"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="background" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Background
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="surface" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Surface
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="surface"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Text
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="color"
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-10 w-10 border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Color Shades</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
              {Object.entries(primaryShades).map(([shade, color]) => (
                <div key={`primary-${shade}`}>
                  <label htmlFor={`primary-${shade}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {shade}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="color"
                      id={`primary-${shade}`}
                      value={color}
                      onChange={(e) => handlePrimaryShadeChange(shade, e.target.value)}
                      className="h-8 w-8 border-gray-300 dark:border-gray-600 rounded-l-md"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handlePrimaryShadeChange(shade, e.target.value)}
                      className="flex-1 min-w-0 block w-full px-2 py-1 text-xs rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Secondary Color Shades</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
              {Object.entries(secondaryShades).map(([shade, color]) => (
                <div key={`secondary-${shade}`}>
                  <label htmlFor={`secondary-${shade}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {shade}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="color"
                      id={`secondary-${shade}`}
                      value={color}
                      onChange={(e) => handleSecondaryShadeChange(shade, e.target.value)}
                      className="h-8 w-8 border-gray-300 dark:border-gray-600 rounded-l-md"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleSecondaryShadeChange(shade, e.target.value)}
                      className="flex-1 min-w-0 block w-full px-2 py-1 text-xs rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
