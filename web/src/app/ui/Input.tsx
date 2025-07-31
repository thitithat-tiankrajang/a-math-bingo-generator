import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  const baseClasses = 'w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-in-out bg-white shadow-sm hover:shadow-md focus:shadow-lg text-black caret-black';
  const errorClasses = error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300';
  const combinedClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 tracking-wide">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-blue-500">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`${combinedClasses} ${icon ? 'pl-12' : ''} placeholder-gray-400`}
        />
        <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-blue-200 group-focus-within:ring-opacity-50"></div>
      </div>
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