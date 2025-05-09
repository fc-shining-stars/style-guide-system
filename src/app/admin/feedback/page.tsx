'use client';

import React, { useState, useEffect } from 'react';
import { useStyleGuideStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Feedback, FeedbackComment } from '@/types/style-guide';
import { Dialog } from '@headlessui/react';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  ExclamationTriangleIcon,
  LightBulbIcon,
  BugAntIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useStyleGuideSocket } from '@/hooks/useStyleGuideSocket';
import FeedbackForm from '@/components/Admin/FeedbackForm';
import FeedbackDetail from '@/components/Admin/FeedbackDetail';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | undefined>(undefined);
  const [viewingFeedback, setViewingFeedback] = useState<Feedback | undefined>(undefined);
  const [userId, setUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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
    const fetchFeedbacks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select(`
            *,
            comments:feedback_comments(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to match our types
        const transformedData = data.map((item: any) => ({
          ...item,
          comments: item.comments as FeedbackComment[]
        }));

        setFeedbacks(transformedData as Feedback[]);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleCreateNew = () => {
    setEditingFeedback(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setIsFormOpen(true);
  };

  const handleView = (feedback: Feedback) => {
    setViewingFeedback(feedback);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      // First delete all comments
      const { error: commentsError } = await supabase
        .from('feedback_comments')
        .delete()
        .eq('feedback_id', id);

      if (commentsError) throw commentsError;

      // Then delete the feedback
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setFeedbacks(feedbacks.filter(feedback => feedback.id !== id));
      
      // Emit update for real-time sync
      emitUpdate('feedback', 'remove', id);
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Failed to delete feedback. Please try again.');
    }
  };

  const handleStatusChange = async (id: string, status: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setFeedbacks(feedbacks.map(feedback => 
        feedback.id === id ? { ...feedback, status, updatedAt: new Date().toISOString() } : feedback
      ));
      
      // Update viewing feedback if open
      if (viewingFeedback && viewingFeedback.id === id) {
        setViewingFeedback({ ...viewingFeedback, status, updatedAt: new Date().toISOString() });
      }
      
      // Emit update for real-time sync
      emitUpdate('feedback', 'update', { id, status });
    } catch (err) {
      console.error('Error updating feedback status:', err);
      setError('Failed to update feedback status. Please try again.');
    }
  };

  const handleSaveFeedback = (feedback: Feedback) => {
    // Update local state
    if (editingFeedback) {
      setFeedbacks(feedbacks.map(f => 
        f.id === feedback.id ? feedback : f
      ));
      
      // Emit update for real-time sync
      emitUpdate('feedback', 'update', feedback);
    } else {
      setFeedbacks([feedback, ...feedbacks]);
      
      // Emit update for real-time sync
      emitUpdate('feedback', 'add', feedback);
    }
    
    setIsFormOpen(false);
  };

  const handleAddComment = (feedbackId: string, comment: FeedbackComment) => {
    // Update local state
    setFeedbacks(feedbacks.map(feedback => {
      if (feedback.id === feedbackId) {
        const updatedComments = [...(feedback.comments || []), comment];
        return { ...feedback, comments: updatedComments };
      }
      return feedback;
    }));
    
    // Update viewing feedback if open
    if (viewingFeedback && viewingFeedback.id === feedbackId) {
      const updatedComments = [...(viewingFeedback.comments || []), comment];
      setViewingFeedback({ ...viewingFeedback, comments: updatedComments });
    }
    
    // Emit update for real-time sync
    emitUpdate('feedback', 'comment', { feedbackId, comment });
  };

  // Filter feedbacks based on status, type and search query
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
    const matchesType = typeFilter === 'all' || feedback.type === typeFilter;
    const matchesSearch = searchQuery === '' || 
      feedback.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <BugAntIcon className="h-5 w-5 text-red-500" />;
      case 'feature':
        return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
      case 'improvement':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      case 'question':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Feedback</h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Feedback
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
            Search feedback
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
              placeholder="Search feedback"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="improvement">Improvement</option>
            <option value="question">Question</option>
          </select>
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
      ) : filteredFeedbacks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {feedbacks.length === 0
              ? 'No feedback found. Create your first one!'
              : 'No feedback matches your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredFeedbacks.map((feedback) => (
              <li 
                key={feedback.id}
                className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleView(feedback)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getTypeIcon(feedback.type)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {feedback.title}
                        </h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(feedback.status)}`}>
                          {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1).replace('-', ' ')}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(feedback.priority)}`}>
                          {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Created: {new Date(feedback.createdAt).toLocaleDateString()}
                        </span>
                        <span className="ml-2">
                          By: {feedback.createdBy}
                        </span>
                        {feedback.comments && feedback.comments.length > 0 && (
                          <span className="ml-2 inline-flex items-center">
                            <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                            {feedback.comments.length} comment{feedback.comments.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(feedback);
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(feedback.id);
                      }}
                      className="ml-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                {editingFeedback ? 'Edit Feedback' : 'New Feedback'}
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              <FeedbackForm
                feedback={editingFeedback}
                onSave={handleSaveFeedback}
                onCancel={() => setIsFormOpen(false)}
                userId={userId}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Feedback Detail Dialog */}
      <Dialog
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                {viewingFeedback && getTypeIcon(viewingFeedback.type)}
                <span className="ml-2">{viewingFeedback?.title}</span>
              </Dialog.Title>
            </div>
            
            <div className="p-6">
              {viewingFeedback && (
                <FeedbackDetail
                  feedback={viewingFeedback}
                  onClose={() => setIsDetailOpen(false)}
                  onStatusChange={handleStatusChange}
                  onAddComment={handleAddComment}
                  userId={userId}
                />
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
