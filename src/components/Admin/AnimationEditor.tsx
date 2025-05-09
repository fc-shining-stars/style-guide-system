'use client';

import React, { useState } from 'react';
import { Animation } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon, Tab } from '@heroicons/react/24/outline';
import { Tab as HeadlessTab } from '@headlessui/react';
import CodeEditor from './CodeEditor';

interface AnimationEditorProps {
  animation?: Animation;
  onSave: (animation: Animation) => void;
  onCancel: () => void;
  userId: string;
}

export default function AnimationEditor({
  animation,
  onSave,
  onCancel,
  userId,
}: AnimationEditorProps) {
  const [name, setName] = useState(animation?.name || '');
  const [transitions, setTransitions] = useState<{
    duration: Record<string, string>;
    easing: Record<string, string>;
  }>(
    animation?.transitions || {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        linear: 'linear',
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
      },
    }
  );

  const [keyframes, setKeyframes] = useState<Record<string, string>>(
    animation?.keyframes || {}
  );

  const [animations, setAnimations] = useState<Record<string, {
    name: string;
    duration: string;
    timingFunction: string;
    delay?: string;
    iterationCount?: string;
    direction?: string;
    fillMode?: string;
    playState?: string;
  }>>(
    animation?.animations || {}
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Duration state
  const [newDurationKey, setNewDurationKey] = useState('');
  const [newDurationValue, setNewDurationValue] = useState('');

  // Easing state
  const [newEasingKey, setNewEasingKey] = useState('');
  const [newEasingValue, setNewEasingValue] = useState('');

  // Keyframes state
  const [newKeyframeName, setNewKeyframeName] = useState('');
  const [newKeyframeValue, setNewKeyframeValue] = useState('@keyframes name {\n  0% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}');
  const [editingKeyframe, setEditingKeyframe] = useState<string | null>(null);

  // Animation state
  const [newAnimationName, setNewAnimationName] = useState('');
  const [newAnimation, setNewAnimation] = useState({
    name: '',
    duration: '300ms',
    timingFunction: 'ease',
    delay: '0s',
    iterationCount: '1',
    direction: 'normal',
    fillMode: 'none',
    playState: 'running',
  });
  const [editingAnimation, setEditingAnimation] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();

      // Prepare animation data
      const updatedAnimation: Animation = {
        id: animation?.id || uuidv4(),
        name,
        version: animation ? animation.version + 1 : 1,
        transitions,
        keyframes: Object.keys(keyframes).length > 0 ? keyframes : undefined,
        animations: Object.keys(animations).length > 0 ? animations : undefined,
        createdAt: animation?.createdAt || now,
        updatedAt: now,
        createdBy: animation?.createdBy || userId,
      };

      // Save to database
      if (animation) {
        // Update existing animation
        const { error } = await supabase
          .from('animations')
          .update(updatedAnimation)
          .eq('id', animation.id);

        if (error) throw error;
      } else {
        // Create new animation
        const { error } = await supabase
          .from('animations')
          .insert(updatedAnimation);

        if (error) throw error;
      }

      // Call onSave with the updated animation
      onSave(updatedAnimation);
    } catch (err) {
      console.error('Error saving animation:', err);
      setErrorMessage('Failed to save animation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Duration handlers
  const handleAddDuration = () => {
    if (!newDurationKey.trim()) return;

    setTransitions(prev => ({
      ...prev,
      duration: {
        ...prev.duration,
        [newDurationKey]: newDurationValue
      }
    }));

    setNewDurationKey('');
    setNewDurationValue('');
  };

  const handleRemoveDuration = (key: string) => {
    const newDuration = { ...transitions.duration };
    delete newDuration[key];
    setTransitions(prev => ({
      ...prev,
      duration: newDuration
    }));
  };

  const handleDurationChange = (key: string, value: string) => {
    setTransitions(prev => ({
      ...prev,
      duration: {
        ...prev.duration,
        [key]: value
      }
    }));
  };

  // Easing handlers
  const handleAddEasing = () => {
    if (!newEasingKey.trim()) return;

    setTransitions(prev => ({
      ...prev,
      easing: {
        ...prev.easing,
        [newEasingKey]: newEasingValue
      }
    }));

    setNewEasingKey('');
    setNewEasingValue('');
  };

  const handleRemoveEasing = (key: string) => {
    const newEasing = { ...transitions.easing };
    delete newEasing[key];
    setTransitions(prev => ({
      ...prev,
      easing: newEasing
    }));
  };

  const handleEasingChange = (key: string, value: string) => {
    setTransitions(prev => ({
      ...prev,
      easing: {
        ...prev.easing,
        [key]: value
      }
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

      <HeadlessTab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <HeadlessTab.List className="flex space-x-1 rounded-xl bg-blue-50 dark:bg-gray-700 p-1">
          <HeadlessTab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            Transitions
          </HeadlessTab>
          <HeadlessTab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            Keyframes
          </HeadlessTab>
          <HeadlessTab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected
                ? 'bg-white dark:bg-gray-800 shadow text-blue-700 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'
              }`
            }
          >
            Animations
          </HeadlessTab>
        </HeadlessTab.List>
        <HeadlessTab.Panels className="mt-2">
          {/* Transitions Panel */}
          <HeadlessTab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              {/* Duration Section */}
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </h3>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Name (e.g., fast)"
                    value={newDurationKey}
                    onChange={(e) => setNewDurationKey(e.target.value)}
                    className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., 150ms)"
                    value={newDurationValue}
                    onChange={(e) => setNewDurationValue(e.target.value)}
                    className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddDuration}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                  {Object.keys(transitions.duration).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(transitions.duration).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {key}:
                          </div>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleDurationChange(key, e.target.value)}
                            className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDuration(key)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                      No durations defined yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Easing Section */}
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Easing
                </h3>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Name (e.g., easeIn)"
                    value={newEasingKey}
                    onChange={(e) => setNewEasingKey(e.target.value)}
                    className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., ease-in)"
                    value={newEasingValue}
                    onChange={(e) => setNewEasingValue(e.target.value)}
                    className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddEasing}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                  {Object.keys(transitions.easing).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(transitions.easing).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <div className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {key}:
                          </div>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleEasingChange(key, e.target.value)}
                            className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveEasing(key)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-2">
                      No easing functions defined yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </HeadlessTab.Panel>

          {/* Keyframes Panel */}
          <HeadlessTab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keyframes
                </h3>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Keyframe name"
                    value={newKeyframeName}
                    onChange={(e) => setNewKeyframeName(e.target.value)}
                    className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newKeyframeName.trim()) return;
                      setKeyframes(prev => ({
                        ...prev,
                        [newKeyframeName]: newKeyframeValue
                      }));
                      setNewKeyframeName('');
                      setEditingKeyframe(newKeyframeName);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                {Object.keys(keyframes).length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(keyframes).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEditingKeyframe(key)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              editingKeyframe === key
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {key}
                            <span
                              className="ml-1 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newKeyframes = { ...keyframes };
                                delete newKeyframes[key];
                                setKeyframes(newKeyframes);
                                if (editingKeyframe === key) {
                                  setEditingKeyframe(null);
                                }
                              }}
                            >
                              ×
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {editingKeyframe && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Edit Keyframe: {editingKeyframe}
                        </h4>
                        <CodeEditor
                          value={keyframes[editingKeyframe]}
                          onChange={(value) => {
                            setKeyframes(prev => ({
                              ...prev,
                              [editingKeyframe]: value
                            }));
                          }}
                          language="css"
                          height="200px"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No keyframes defined yet. Add your first keyframe above.
                    </p>
                  </div>
                )}
              </div>

              {!editingKeyframe && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Keyframe Template
                  </h4>
                  <CodeEditor
                    value={newKeyframeValue}
                    onChange={setNewKeyframeValue}
                    language="css"
                    height="200px"
                  />
                </div>
              )}
            </div>
          </HeadlessTab.Panel>

          {/* Animations Panel */}
          <HeadlessTab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <div className="space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Animations
                </h3>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Animation name"
                    value={newAnimationName}
                    onChange={(e) => setNewAnimationName(e.target.value)}
                    className="flex-1 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAnimationName.trim()) return;
                      setAnimations(prev => ({
                        ...prev,
                        [newAnimationName]: {
                          ...newAnimation,
                          name: newAnimationName
                        }
                      }));
                      setNewAnimationName('');
                      setEditingAnimation(newAnimationName);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                {Object.keys(animations).length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(animations).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setEditingAnimation(key)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              editingAnimation === key
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {key}
                            <span
                              className="ml-1 text-red-500 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newAnimations = { ...animations };
                                delete newAnimations[key];
                                setAnimations(newAnimations);
                                if (editingAnimation === key) {
                                  setEditingAnimation(null);
                                }
                              }}
                            >
                              ×
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {editingAnimation && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Edit Animation: {editingAnimation}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={animations[editingAnimation].duration}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    duration: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Timing Function
                            </label>
                            <select
                              value={animations[editingAnimation].timingFunction}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    timingFunction: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              {Object.entries(transitions.easing).map(([key, value]) => (
                                <option key={key} value={value}>
                                  {key} ({value})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Delay
                            </label>
                            <input
                              type="text"
                              value={animations[editingAnimation].delay || '0s'}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    delay: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Iteration Count
                            </label>
                            <input
                              type="text"
                              value={animations[editingAnimation].iterationCount || '1'}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    iterationCount: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="1, 2, infinite"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Direction
                            </label>
                            <select
                              value={animations[editingAnimation].direction || 'normal'}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    direction: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="normal">normal</option>
                              <option value="reverse">reverse</option>
                              <option value="alternate">alternate</option>
                              <option value="alternate-reverse">alternate-reverse</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Fill Mode
                            </label>
                            <select
                              value={animations[editingAnimation].fillMode || 'none'}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    fillMode: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="none">none</option>
                              <option value="forwards">forwards</option>
                              <option value="backwards">backwards</option>
                              <option value="both">both</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Play State
                            </label>
                            <select
                              value={animations[editingAnimation].playState || 'running'}
                              onChange={(e) => {
                                setAnimations(prev => ({
                                  ...prev,
                                  [editingAnimation]: {
                                    ...prev[editingAnimation],
                                    playState: e.target.value
                                  }
                                }));
                              }}
                              className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              <option value="running">running</option>
                              <option value="paused">paused</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Keyframe
                          </label>
                          <select
                            value={animations[editingAnimation].name}
                            onChange={(e) => {
                              setAnimations(prev => ({
                                ...prev,
                                [editingAnimation]: {
                                  ...prev[editingAnimation],
                                  name: e.target.value
                                }
                              }));
                            }}
                            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {Object.keys(keyframes).map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                            {Object.keys(keyframes).length === 0 && (
                              <option disabled>No keyframes available</option>
                            )}
                          </select>
                        </div>

                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preview
                          </h5>
                          <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                            <div
                              className="w-16 h-16 bg-blue-500 dark:bg-blue-600 rounded-md"
                              style={{
                                animation: `${animations[editingAnimation].name} ${animations[editingAnimation].duration} ${animations[editingAnimation].timingFunction} ${animations[editingAnimation].delay || '0s'} ${animations[editingAnimation].iterationCount || '1'} ${animations[editingAnimation].direction || 'normal'} ${animations[editingAnimation].fillMode || 'none'} ${animations[editingAnimation].playState || 'running'}`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No animations defined yet. Add your first animation above.
                    </p>
                  </div>
                )}
              </div>

              {!editingAnimation && Object.keys(keyframes).length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    New Animation Settings
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={newAnimation.duration}
                        onChange={(e) => {
                          setNewAnimation(prev => ({
                            ...prev,
                            duration: e.target.value
                          }));
                        }}
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="300ms, 1s, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timing Function
                      </label>
                      <select
                        value={newAnimation.timingFunction}
                        onChange={(e) => {
                          setNewAnimation(prev => ({
                            ...prev,
                            timingFunction: e.target.value
                          }));
                        }}
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {Object.entries(transitions.easing).map(([key, value]) => (
                          <option key={key} value={value}>
                            {key} ({value})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Keyframe
                      </label>
                      <select
                        value={newAnimation.name}
                        onChange={(e) => {
                          setNewAnimation(prev => ({
                            ...prev,
                            name: e.target.value
                          }));
                        }}
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="" disabled>Select a keyframe</option>
                        {Object.keys(keyframes).map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </HeadlessTab.Panel>
        </HeadlessTab.Panels>
      </HeadlessTab.Group>

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
