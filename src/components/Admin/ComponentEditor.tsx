'use client';

import React, { useState } from 'react';
import { Component } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import CodeEditor from './CodeEditor';

interface ComponentEditorProps {
  component?: Component;
  onSave: (component: Component) => void;
  onCancel: () => void;
  userId: string;
}

export default function ComponentEditor({
  component,
  onSave,
  onCancel,
  userId,
}: ComponentEditorProps) {
  const [name, setName] = useState(component?.name || '');
  const [type, setType] = useState(component?.type || 'button');
  const [description, setDescription] = useState(component?.description || '');
  const [props, setProps] = useState<Record<string, any>>(component?.props || {});
  const [styles, setStyles] = useState<Record<string, any>>(component?.styles || {});
  const [states, setStates] = useState<Record<string, Record<string, any>>>(
    component?.states || { default: {} }
  );
  const [variants, setVariants] = useState<Record<string, { styles: Record<string, any>, states?: Record<string, Record<string, any>> }>>(
    component?.variants || {}
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [newPropKey, setNewPropKey] = useState('');
  const [newPropValue, setNewPropValue] = useState('');
  const [newStyleKey, setNewStyleKey] = useState('');
  const [newStyleValue, setNewStyleValue] = useState('');
  const [newVariantName, setNewVariantName] = useState('');
  const [activeState, setActiveState] = useState('default');
  const [newStateName, setNewStateName] = useState('');
  const [activeVariant, setActiveVariant] = useState('');
  
  // Common component types
  const componentTypes = [
    'button',
    'input',
    'card',
    'alert',
    'badge',
    'modal',
    'dropdown',
    'navigation',
    'tab',
    'accordion',
    'table',
    'form',
    'other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      
      // Prepare component data
      const updatedComponent: Component = {
        id: component?.id || uuidv4(),
        name,
        type,
        description,
        version: component ? component.version + 1 : 1,
        props,
        styles,
        states,
        variants,
        createdAt: component?.createdAt || now,
        updatedAt: now,
        createdBy: component?.createdBy || userId,
      };

      // Save to database
      if (component) {
        // Update existing component
        const { error } = await supabase
          .from('components')
          .update(updatedComponent)
          .eq('id', component.id);

        if (error) throw error;
      } else {
        // Create new component
        const { error } = await supabase
          .from('components')
          .insert(updatedComponent);

        if (error) throw error;
      }

      // Call onSave with the updated component
      onSave(updatedComponent);
    } catch (err) {
      console.error('Error saving component:', err);
      setErrorMessage('Failed to save component. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProp = () => {
    if (!newPropKey.trim()) return;
    
    setProps(prev => ({
      ...prev,
      [newPropKey]: newPropValue
    }));
    
    setNewPropKey('');
    setNewPropValue('');
  };

  const handleRemoveProp = (key: string) => {
    const newProps = { ...props };
    delete newProps[key];
    setProps(newProps);
  };

  const handleAddStyle = () => {
    if (!newStyleKey.trim()) return;
    
    setStyles(prev => ({
      ...prev,
      [newStyleKey]: newStyleValue
    }));
    
    setNewStyleKey('');
    setNewStyleValue('');
  };

  const handleRemoveStyle = (key: string) => {
    const newStyles = { ...styles };
    delete newStyles[key];
    setStyles(newStyles);
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    
    setVariants(prev => ({
      ...prev,
      [newVariantName]: {
        styles: {},
        states: { default: {} }
      }
    }));
    
    setActiveVariant(newVariantName);
    setNewVariantName('');
  };

  const handleRemoveVariant = (name: string) => {
    const newVariants = { ...variants };
    delete newVariants[name];
    setVariants(newVariants);
    
    if (activeVariant === name) {
      setActiveVariant(Object.keys(newVariants)[0] || '');
    }
  };

  const handleAddState = () => {
    if (!newStateName.trim()) return;
    
    if (activeVariant) {
      setVariants(prev => ({
        ...prev,
        [activeVariant]: {
          ...prev[activeVariant],
          states: {
            ...prev[activeVariant].states,
            [newStateName]: {}
          }
        }
      }));
    } else {
      setStates(prev => ({
        ...prev,
        [newStateName]: {}
      }));
    }
    
    setActiveState(newStateName);
    setNewStateName('');
  };

  const handleRemoveState = (name: string) => {
    if (name === 'default') return; // Don't allow removing default state
    
    if (activeVariant) {
      const newVariants = { ...variants };
      delete newVariants[activeVariant].states![name];
      setVariants(newVariants);
    } else {
      const newStates = { ...states };
      delete newStates[name];
      setStates(newStates);
    }
    
    if (activeState === name) {
      setActiveState('default');
    }
  };

  const handleUpdateStateStyles = (state: string, stylesJson: string) => {
    try {
      const parsedStyles = JSON.parse(stylesJson);
      
      if (activeVariant) {
        setVariants(prev => ({
          ...prev,
          [activeVariant]: {
            ...prev[activeVariant],
            states: {
              ...prev[activeVariant].states,
              [state]: parsedStyles
            }
          }
        }));
      } else {
        setStates(prev => ({
          ...prev,
          [state]: parsedStyles
        }));
      }
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  const handleUpdateVariantStyles = (variant: string, stylesJson: string) => {
    try {
      const parsedStyles = JSON.parse(stylesJson);
      
      setVariants(prev => ({
        ...prev,
        [variant]: {
          ...prev[variant],
          styles: parsedStyles
        }
      }));
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

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
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {componentTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
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

      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 dark:bg-gray-700 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            Props
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            Styles
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            States
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            Variants
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          {/* Props Panel */}
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Prop name"
                  value={newPropKey}
                  onChange={(e) => setNewPropKey(e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Default value"
                  value={newPropValue}
                  onChange={(e) => setNewPropValue(e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddProp}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              {Object.keys(props).length > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(props).map(([key, value]) => (
                      <li key={key} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{key}:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-300">{String(value)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProp(key)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No props defined yet. Add some props above.
                </p>
              )}
            </div>
          </Tab.Panel>
          
          {/* Styles Panel */}
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Style property"
                  value={newStyleKey}
                  onChange={(e) => setNewStyleKey(e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newStyleValue}
                  onChange={(e) => setNewStyleValue(e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddStyle}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              {Object.keys(styles).length > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(styles).map(([key, value]) => (
                      <li key={key} className="py-2 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{key}:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-300">{String(value)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStyle(key)}
                          className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No styles defined yet. Add some styles above.
                </p>
              )}
            </div>
          </Tab.Panel>
          
          {/* States Panel */}
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New state name (e.g., hover, focus)"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddState}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {Object.keys(activeVariant ? variants[activeVariant].states || {} : states).map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setActiveState(state)}
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                      activeState === state
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {state}
                    {state !== 'default' && (
                      <span 
                        className="ml-1 text-red-500 hover:text-red-700" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveState(state);
                        }}
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {activeState} State Styles (JSON)
                </h4>
                <CodeEditor
                  value={JSON.stringify(
                    activeVariant 
                      ? (variants[activeVariant]?.states?.[activeState] || {})
                      : (states[activeState] || {}),
                    null, 
                    2
                  )}
                  onChange={(value) => handleUpdateStateStyles(activeState, value)}
                  language="json"
                  height="200px"
                />
              </div>
            </div>
          </Tab.Panel>
          
          {/* Variants Panel */}
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New variant name (e.g., primary, secondary)"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              {Object.keys(variants).length > 0 ? (
                <div className="space-y-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {Object.keys(variants).map((variant) => (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setActiveVariant(variant)}
                        className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                          activeVariant === variant
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {variant}
                        <span 
                          className="ml-1 text-red-500 hover:text-red-700" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveVariant(variant);
                          }}
                        >
                          ×
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  {activeVariant && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {activeVariant} Variant Styles (JSON)
                      </h4>
                      <CodeEditor
                        value={JSON.stringify(variants[activeVariant]?.styles || {}, null, 2)}
                        onChange={(value) => handleUpdateVariantStyles(activeVariant, value)}
                        language="json"
                        height="200px"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No variants defined yet. Add some variants above.
                </p>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

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
