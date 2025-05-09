'use client';

import React, { useState, useRef } from 'react';

interface NaturalLanguageProcessorProps {
  onCommandExecuted?: (result: any) => void;
}

export default function NaturalLanguageProcessor({ onCommandExecuted }: NaturalLanguageProcessorProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate processing the command
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const executionResult = {
        success: true,
        message: `Command "${command}" executed successfully.`,
        data: { command }
      };
      
      setResult(executionResult);
      
      if (onCommandExecuted) {
        onCommandExecuted(executionResult);
      }
      
      // Add command to history
      setHistory((prev) => [command, ...prev.slice(0, 19)]);
      setHistoryIndex(-1);
    } catch (error) {
      console.error('Error executing command:', error);
      setResult({
        success: false,
        message: 'Failed to execute command. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle up/down arrow keys for command history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearResult = () => {
    setResult(null);
  };

  const clearCommand = () => {
    setCommand('');
    inputRef.current?.focus();
  };

  // Example commands to help users
  const exampleCommands = [
    'Create a new button component named Primary Button',
    'Update primary color to #3b82f6',
    'Add a new typography style with font Inter',
    'List all components',
    'Delete component with id "component-123"',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Natural Language Command Processor
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Control your style guide using natural language commands.
        </p>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        <form onSubmit={handleCommandSubmit} className="mb-6">
          <div className="flex">
            <div className="relative flex-grow">
              <input
                type="text"
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a command..."
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                disabled={isProcessing}
              />
              {command && (
                <button
                  type="button"
                  onClick={clearCommand}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isProcessing || !command.trim()}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Execute'}
            </button>
          </div>
        </form>

        {result && (
          <div className={`mb-6 p-4 rounded-md ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex justify-between">
              <p className={`text-sm ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {result.message}
              </p>
              <button
                type="button"
                onClick={clearResult}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {result.data && (
              <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Example Commands:</h4>
          <div className="space-y-2">
            {exampleCommands.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setCommand(example);
                  inputRef.current?.focus();
                }}
                className="inline-block mr-2 mb-2 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Command History:</h4>
            <ul className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
              {history.map((cmd, index) => (
                <li key={index} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={() => setCommand(cmd)}>
                  {cmd}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
