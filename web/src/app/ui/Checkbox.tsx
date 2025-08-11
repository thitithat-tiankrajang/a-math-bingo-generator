import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'toggle' | 'custom';
}

export default function Checkbox({
  label,
  error,
  variant = 'default',
  className = '',
  ...props
}: CheckboxProps) {
  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  if (variant === 'toggle') {
    return (
      <div className="space-y-2">
        <label htmlFor={checkboxId} className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id={checkboxId}
            className="sr-only"
            {...props}
          />
          <div
            className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer transition-colors duration-300 ${
              props.checked ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-300 ${
                props.checked ? 'transform translate-x-full' : ''
              }`}
            />
          </div>
          {label && (
            <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>
          )}
        </label>
        {error && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'custom') {
    return (
      <div className="space-y-2">
        <label htmlFor={checkboxId} className="flex items-center cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              id={checkboxId}
              className="sr-only"
              {...props}
            />
            <div
              className={`w-5 h-5 rounded border-2 transition-all duration-200 ${
                props.checked
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-gray-300 group-hover:border-gray-400'
              }`}
            >
              {props.checked && (
                <svg
                  className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
          {label && (
            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="text-sm text-red-600 font-medium flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-2">
      <label htmlFor={checkboxId} className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={checkboxId}
          className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 transition-colors ${className}`}
          {...props}
        />
        {label && (
          <span className="ml-2 text-sm text-gray-700">{label}</span>
        )}
      </label>
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
