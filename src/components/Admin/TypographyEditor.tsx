'use client';

import React, { useState } from 'react';
import { Typography } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface TypographyEditorProps {
  typography?: Typography;
  onSave: (typography: Typography) => void;
  onCancel: () => void;
  userId: string;
}

export default function TypographyEditor({
  typography,
  onSave,
  onCancel,
  userId,
}: TypographyEditorProps) {
  const [name, setName] = useState(typography?.name || '');
  const [primaryFont, setPrimaryFont] = useState(typography?.fontFamily.primary || 'Inter, sans-serif');
  const [secondaryFont, setSecondaryFont] = useState(typography?.fontFamily.secondary || 'Georgia, serif');
  const [monoFont, setMonoFont] = useState(typography?.fontFamily.monospace || 'Menlo, monospace');
  
  const [headingLineHeight, setHeadingLineHeight] = useState(typography?.headings?.lineHeight || 1.2);
  const [headingFontWeight, setHeadingFontWeight] = useState(typography?.headings?.fontWeight || 700);
  const [bodyLineHeight, setBodyLineHeight] = useState(typography?.body?.lineHeight || 1.5);
  const [bodyFontWeight, setBodyFontWeight] = useState(typography?.body?.fontWeight || 400);
  
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Font size presets
  const [fontSizes, setFontSizes] = useState<Record<string, string>>(
    typography?.fontSize || {
      'xs': '0.75rem',
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    }
  );

  // Font weight presets
  const [fontWeights, setFontWeights] = useState<Record<string, number>>(
    typography?.fontWeight || {
      'thin': 100,
      'extralight': 200,
      'light': 300,
      'normal': 400,
      'medium': 500,
      'semibold': 600,
      'bold': 700,
      'extrabold': 800,
      'black': 900,
    }
  );

  // Line height presets
  const [lineHeights, setLineHeights] = useState<Record<string, number>>(
    typography?.lineHeight || {
      'none': 1,
      'tight': 1.25,
      'snug': 1.375,
      'normal': 1.5,
      'relaxed': 1.625,
      'loose': 2,
    }
  );

  // Letter spacing presets
  const [letterSpacings, setLetterSpacings] = useState<Record<string, string>>(
    typography?.letterSpacing || {
      'tighter': '-0.05em',
      'tight': '-0.025em',
      'normal': '0em',
      'wide': '0.025em',
      'wider': '0.05em',
      'widest': '0.1em',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      
      // Prepare typography data
      const updatedTypography: Typography = {
        id: typography?.id || uuidv4(),
        name,
        version: typography ? typography.version + 1 : 1,
        fontFamily: {
          primary: primaryFont,
          secondary: secondaryFont,
          monospace: monoFont,
        },
        fontSize: fontSizes,
        fontWeight: fontWeights,
        lineHeight: lineHeights,
        letterSpacing: letterSpacings,
        headings: {
          fontFamily: primaryFont,
          fontWeight: headingFontWeight,
          lineHeight: headingLineHeight,
          letterSpacing: letterSpacings.tight,
        },
        body: {
          fontFamily: primaryFont,
          fontWeight: bodyFontWeight,
          lineHeight: bodyLineHeight,
          letterSpacing: letterSpacings.normal,
        },
        createdAt: typography?.createdAt || now,
        updatedAt: now,
        createdBy: typography?.createdBy || userId,
      };

      // Save to database
      if (typography) {
        // Update existing typography
        const { error } = await supabase
          .from('typographies')
          .update(updatedTypography)
          .eq('id', typography.id);

        if (error) throw error;
      } else {
        // Create new typography
        const { error } = await supabase
          .from('typographies')
          .insert(updatedTypography);

        if (error) throw error;
      }

      // Call onSave with the updated typography
      onSave(updatedTypography);
    } catch (err) {
      console.error('Error saving typography:', err);
      setErrorMessage('Failed to save typography. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFontSizeChange = (key: string, value: string) => {
    setFontSizes(prev => ({ ...prev, [key]: value }));
  };

  const handleFontWeightChange = (key: string, value: number) => {
    setFontWeights(prev => ({ ...prev, [key]: value }));
  };

  const handleLineHeightChange = (key: string, value: number) => {
    setLineHeights(prev => ({ ...prev, [key]: value }));
  };

  const handleLetterSpacingChange = (key: string, value: string) => {
    setLetterSpacings(prev => ({ ...prev, [key]: value }));
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Font Families</h3>
        <button
          type="button"
          onClick={() => setIsAdvancedMode(!isAdvancedMode)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          {isAdvancedMode ? 'Switch to Basic Mode' : 'Switch to Advanced Mode'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="primaryFont" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Font
          </label>
          <input
            type="text"
            id="primaryFont"
            value={primaryFont}
            onChange={(e) => setPrimaryFont(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: primaryFont }}>
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>

        <div>
          <label htmlFor="secondaryFont" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Secondary Font
          </label>
          <input
            type="text"
            id="secondaryFont"
            value={secondaryFont}
            onChange={(e) => setSecondaryFont(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: secondaryFont }}>
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>

        <div>
          <label htmlFor="monoFont" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monospace Font
          </label>
          <input
            type="text"
            id="monoFont"
            value={monoFont}
            onChange={(e) => setMonoFont(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400" style={{ fontFamily: monoFont }}>
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Typography Settings</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Headings</h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="headingLineHeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Line Height
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="range"
                    id="headingLineHeight"
                    min="0.8"
                    max="2"
                    step="0.1"
                    value={headingLineHeight}
                    onChange={(e) => setHeadingLineHeight(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                    {headingLineHeight}
                  </span>
                </div>
              </div>
              
              <div>
                <label htmlFor="headingFontWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Font Weight
                </label>
                <select
                  id="headingFontWeight"
                  value={headingFontWeight}
                  onChange={(e) => setHeadingFontWeight(parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {Object.entries(fontWeights).map(([name, value]) => (
                    <option key={name} value={value}>
                      {name} ({value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <h2 
                style={{ 
                  fontFamily: primaryFont, 
                  fontWeight: headingFontWeight,
                  lineHeight: headingLineHeight,
                }}
                className="text-xl text-gray-900 dark:text-white"
              >
                Heading Preview
              </h2>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Body Text</h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="bodyLineHeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Line Height
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="range"
                    id="bodyLineHeight"
                    min="1"
                    max="2"
                    step="0.1"
                    value={bodyLineHeight}
                    onChange={(e) => setBodyLineHeight(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                    {bodyLineHeight}
                  </span>
                </div>
              </div>
              
              <div>
                <label htmlFor="bodyFontWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Font Weight
                </label>
                <select
                  id="bodyFontWeight"
                  value={bodyFontWeight}
                  onChange={(e) => setBodyFontWeight(parseInt(e.target.value))}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {Object.entries(fontWeights).map(([name, value]) => (
                    <option key={name} value={value}>
                      {name} ({value})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <p 
                style={{ 
                  fontFamily: primaryFont, 
                  fontWeight: bodyFontWeight,
                  lineHeight: bodyLineHeight,
                }}
                className="text-gray-700 dark:text-gray-300"
              >
                This is a preview of the body text. The quick brown fox jumps over the lazy dog. This text demonstrates how paragraphs will appear in your design system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isAdvancedMode && (
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Font Sizes</h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {Object.entries(fontSizes).map(([name, value]) => (
                <div key={`fontSize-${name}`}>
                  <label htmlFor={`fontSize-${name}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {name}
                  </label>
                  <input
                    type="text"
                    id={`fontSize-${name}`}
                    value={value}
                    onChange={(e) => handleFontSizeChange(name, e.target.value)}
                    className="mt-1 block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Letter Spacing</h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {Object.entries(letterSpacings).map(([name, value]) => (
                <div key={`letterSpacing-${name}`}>
                  <label htmlFor={`letterSpacing-${name}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {name}
                  </label>
                  <input
                    type="text"
                    id={`letterSpacing-${name}`}
                    value={value}
                    onChange={(e) => handleLetterSpacingChange(name, e.target.value)}
                    className="mt-1 block w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
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
