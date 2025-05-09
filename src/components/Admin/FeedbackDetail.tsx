'use client';

import React, { useState } from 'react';
import { Feedback, FeedbackComment } from '@/types/style-guide';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { 
  ExclamationTriangleIcon,
  LightBulbIcon,
  BugAntIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface FeedbackDetailProps {
  feedback: Feedback;
  onClose: () => void;
  onStatusChange: (id: string, status: 'open' | 'in-progress' | 'resolved' | 'closed') => void;
  onAddComment: (feedbackId: string, comment: FeedbackComment) => void;
  userId: string;
}

export default function FeedbackDetail({
  feedback,
  onClose,
  onStatusChange,
  onAddComment,
  userId,
}: FeedbackDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <BugAntIcon className="h-5 w-5 text-red-500" />;
      case 'feature':
        return <LightBulbIcon className="h-5 w-5 text-yellow-500" />;
      case 'improvement':
        return <LightBulbIcon className="h-5 w-5 text-blue-500" />;
      case 'question':
        return <QuestionMarkCircleIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
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

  const handleStatusChange = async (newStatus: 'open' | 'in-progress' | 'resolved' | 'closed') => {
    onStatusChange(feedback.id, newStatus);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setCommentError('Please enter a comment.');
      return;
    }
    
    setIsSubmittingComment(true);
    setCommentError(null);
    
    try {
      const now = new Date().toISOString();
      const newComment: FeedbackComment = {
        id: uuidv4(),
        feedbackId: feedback.id,
        content: commentText,
        createdAt: now,
        createdBy: userId,
      };
      
      const { error } = await supabase
        .from('feedback_comments')
        .insert({
          id: newComment.id,
          feedback_id: newComment.feedbackId,
          content: newComment.content,
          created_at: now,
          created_by: userId,
        });
      
      if (error) throw error;
      
      // Call onAddComment with the new comment
      onAddComment(feedback.id, newComment);
      
      // Clear the comment text
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setCommentError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center">
              {getTypeIcon(feedback.type)}
              <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                {feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
              </span>
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(feedback.priority)}`}>
                {feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Created: {new Date(feedback.createdAt).toLocaleString()} by {feedback.createdBy}
            </div>
            {feedback.assignedTo && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Assigned to: {feedback.assignedTo}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Status:</span>
            <select
              value={feedback.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {feedback.description}
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Comments</h3>
        
        {feedback.comments && feedback.comments.length > 0 ? (
          <div className="space-y-4">
            {feedback.comments.map((comment) => (
              <div 
                key={comment.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.createdBy}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
          </div>
        )}
        
        <div className="mt-4">
          <form onSubmit={handleSubmitComment}>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Add a comment
            </label>
            <div className="mt-1">
              <textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Write your comment here..."
              />
            </div>
            
            {commentError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{commentError}</p>
            )}
            
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
