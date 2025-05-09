'use client';

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStyleGuideStore } from '@/lib/store';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  height = '200px',
  readOnly = false,
}: CodeEditorProps) {
  const { isDarkMode } = useStyleGuideStore();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative rounded-md overflow-hidden" style={{ height }}>
      {!readOnly && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none bg-transparent z-10 text-transparent caret-gray-900 dark:caret-white"
          style={{ caretColor: isDarkMode ? 'white' : 'black' }}
        />
      )}
      <div className={`absolute inset-0 overflow-auto ${readOnly ? '' : 'pointer-events-none'}`}>
        <SyntaxHighlighter
          language={language}
          style={isDarkMode ? vscDarkPlus : prism}
          customStyle={{
            margin: 0,
            padding: '1rem',
            height: '100%',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            backgroundColor: 'transparent',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'monospace',
            },
          }}
        >
          {value || ' '}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
