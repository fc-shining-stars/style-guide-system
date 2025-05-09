'use client';

import React, { useState } from 'react';
import { Feedback } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface FeedbackFormProps {
  feedback?: Feedback;
  onSave: (feedback: Feedback) => void;
  onCancel: () => void;
  userId: string;
}

export default function FeedbackForm({
  feedback,
  onSave,
  onCancel,
  userId,
}: FeedbackFormProps) {
  const [title, setTitle] = useState(feedback?.title || '');
  const [description, setDescription] = useState(feedback?.description || '');
  const [type, setType] = useState<'bug' | 'feature' | 'improvement' | 'question'>(
    feedback?.type || 'bug'
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(
    feedback?.priority || 'medium'
  );
  const [status, setStatus] = useState<'open' | 'in-progress' | 'resolved' | 'closed'>(
    feedback?.status || 'open'
  );
  const [assignedTo, setAssignedTo] = useState(feedback?.assignedTo || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setErrorMessage('Please enter a title for the feedback.');
      return;
    }
    
    if (!description.trim()) {
      setErrorMessage('Please enter a description for the feedback.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const now = new Date().toISOString();
      
      if (feedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('feedback')
          .update({
            title,
            description,
            type,
            priority,
            status,
            assigned_to: assignedTo || null,
            updated_at: now,
          })
          .eq('id', feedback.id);
        
        if (error) throw error;
        
        // Call onSave with the updated feedback
        onSave({
          ...feedback,
          title,
          description,
          type,
          priority,
          status,
          assignedTo: assignedTo || undefined,
          updatedAt: now,
        });
      } else {
        // Create new feedback
        const newFeedback: Feedback = {
          id: uuidv4(),
          title,
          description,
          type,
          priority,
          status,
          assignedTo: assignedTo || undefined,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          comments: [],
        };
        
        const { error } = await supabase
          .from('feedback')
          .insert({
            id: newFeedback.id,
            title,
            description,
            type,
            priority,
            status,
            assigned_to: assignedTo || null,
            created_at: now,
            updated_at: now,
            created_by: userId,
          });
        
        if (error) throw error;
        
        // Call onSave with the new feedback
        onSave(newFeedback);
      }
    } catch (err) {
      console.error('Error saving feedback:', err);
      setErrorMessage('Failed to save feedback. Please try again.');
      setIsLoading(false);
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="improvement">Improvement</option>
            <option value="question">Question</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assigned To (User ID)
          </label>
          <input
            type="text"
            id="assignedTo"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Optional"
          />
        </div>
      </div>

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
          {isLoading ? 'Saving...' : feedback ? 'Update' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
