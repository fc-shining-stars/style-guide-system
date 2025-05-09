'use client';

import React, { useState } from 'react';
import { Component } from '@/types/style-guide';
import { Tab } from '@headlessui/react';
import CodeEditor from './CodeEditor';

interface ComponentPreviewProps {
  component: Component;
  onClose: () => void;
}

export default function ComponentPreview({
  component,
  onClose,
}: ComponentPreviewProps) {
  const [activeVariant, setActiveVariant] = useState<string>('');
  const [activeState, setActiveState] = useState<string>('default');
  const [customProps, setCustomProps] = useState<Record<string, any>>({});
  const [customPropsJson, setCustomPropsJson] = useState('{}');

  // Generate React component code
  const generateReactCode = () => {
    const variantStyles = activeVariant ? component.variants?.[activeVariant]?.styles || {} : {};
    const stateStyles = activeVariant 
      ? component.variants?.[activeVariant]?.states?.[activeState] || {}
      : component.states[activeState] || {};
    
    const mergedStyles = {
      ...component.styles,
      ...variantStyles,
      ...stateStyles
    };
    
    const styleString = Object.entries(mergedStyles)
      .map(([key, value]) => `  ${key}: "${value}"`)
      .join(',\n');
    
    const propsString = Object.entries({...component.props, ...customProps})
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `  ${key}="${value}"`;
        } else {
          return `  ${key}={${JSON.stringify(value)}}`;
        }
      })
      .join('\n');
    
    let code = '';
    
    switch (component.type) {
      case 'button':
        code = `import React from 'react';

const ${component.name.replace(/\s+/g, '')} = (props) => {
  const styles = {
${styleString}
  };

  return (
    <button
      style={styles}
${propsString}
      {...props}
    >
      {props.children || "Button Text"}
    </button>
  );
};

export default ${component.name.replace(/\s+/g, '')};`;
        break;
        
      case 'input':
        code = `import React from 'react';

const ${component.name.replace(/\s+/g, '')} = (props) => {
  const styles = {
${styleString}
  };

  return (
    <input
      style={styles}
${propsString}
      {...props}
    />
  );
};

export default ${component.name.replace(/\s+/g, '')};`;
        break;
        
      case 'card':
        code = `import React from 'react';

const ${component.name.replace(/\s+/g, '')} = (props) => {
  const styles = {
${styleString}
  };

  return (
    <div
      style={styles}
${propsString}
      {...props}
    >
      {props.children || (
        <>
          <h3>Card Title</h3>
          <p>Card content goes here</p>
        </>
      )}
    </div>
  );
};

export default ${component.name.replace(/\s+/g, '')};`;
        break;
        
      default:
        code = `import React from 'react';

const ${component.name.replace(/\s+/g, '')} = (props) => {
  const styles = {
${styleString}
  };

  return (
    <div
      style={styles}
${propsString}
      {...props}
    >
      {props.children || "Component Content"}
    </div>
  );
};

export default ${component.name.replace(/\s+/g, '')};`;
    }
    
    return code;
  };

  // Generate CSS code
  const generateCssCode = () => {
    const variantStyles = activeVariant ? component.variants?.[activeVariant]?.styles || {} : {};
    const stateStyles = activeVariant 
      ? component.variants?.[activeVariant]?.states?.[activeState] || {}
      : component.states[activeState] || {};
    
    const mergedStyles = {
      ...component.styles,
      ...variantStyles,
      ...stateStyles
    };
    
    const styleString = Object.entries(mergedStyles)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
    
    let className = component.name.replace(/\s+/g, '-').toLowerCase();
    if (activeVariant) {
      className += `-${activeVariant}`;
    }
    if (activeState !== 'default') {
      className += `:${activeState}`;
    }
    
    return `.${className} {
${styleString}
}`;
  };

  // Generate HTML code
  const generateHtmlCode = () => {
    let className = component.name.replace(/\s+/g, '-').toLowerCase();
    if (activeVariant) {
      className += `-${activeVariant}`;
    }
    
    const propsString = Object.entries({...component.props, ...customProps})
      .map(([key, value]) => `  ${key}="${value}"`)
      .join('\n');
    
    let html = '';
    
    switch (component.type) {
      case 'button':
        html = `<button class="${className}"${propsString ? '\n' + propsString : ''}>
  Button Text
</button>`;
        break;
        
      case 'input':
        html = `<input class="${className}"${propsString ? '\n' + propsString : ''} />`;
        break;
        
      case 'card':
        html = `<div class="${className}"${propsString ? '\n' + propsString : ''}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>`;
        break;
        
      default:
        html = `<div class="${className}"${propsString ? '\n' + propsString : ''}>
  Component Content
</div>`;
    }
    
    return html;
  };

  const handleCustomPropsChange = (json: string) => {
    setCustomPropsJson(json);
    try {
      const parsed = JSON.parse(json);
      setCustomProps(parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  // Render the component preview
  const renderPreview = () => {
    const variantStyles = activeVariant ? component.variants?.[activeVariant]?.styles || {} : {};
    const stateStyles = activeVariant 
      ? component.variants?.[activeVariant]?.states?.[activeState] || {}
      : component.states[activeState] || {};
    
    const mergedStyles = {
      ...component.styles,
      ...variantStyles,
      ...stateStyles
    };
    
    const mergedProps = {
      ...component.props,
      ...customProps
    };
    
    switch (component.type) {
      case 'button':
        return (
          <button
            style={mergedStyles}
            {...mergedProps}
          >
            {mergedProps.children || "Button Text"}
          </button>
        );
        
      case 'input':
        return (
          <input
            style={mergedStyles}
            {...mergedProps}
          />
        );
        
      case 'card':
        return (
          <div
            style={mergedStyles}
            {...mergedProps}
          >
            <h3>Card Title</h3>
            <p>Card content goes here</p>
          </div>
        );
        
      default:
        return (
          <div
            style={mergedStyles}
            {...mergedProps}
          >
            Component Content
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {component.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {component.description}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={activeVariant}
            onChange={(e) => setActiveVariant(e.target.value)}
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Default</option>
            {Object.keys(component.variants || {}).map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
          
          <select
            value={activeState}
            onChange={(e) => setActiveState(e.target.value)}
            className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {Object.keys(activeVariant 
              ? (component.variants?.[activeVariant]?.states || { default: {} }) 
              : component.states
            ).map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg flex items-center justify-center min-h-[200px]">
        {renderPreview()}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-700 dark:text-gray-300">
          Custom Props (JSON)
        </h3>
        <CodeEditor
          value={customPropsJson}
          onChange={handleCustomPropsChange}
          language="json"
          height="100px"
        />
      </div>
      
      <Tab.Group>
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
            React
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
            CSS
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
            HTML
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <CodeEditor
              value={generateReactCode()}
              language="javascript"
              height="300px"
              readOnly
            />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <CodeEditor
              value={generateCssCode()}
              language="css"
              height="300px"
              readOnly
            />
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white dark:bg-gray-800 p-3">
            <CodeEditor
              value={generateHtmlCode()}
              language="html"
              height="300px"
              readOnly
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
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
