import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Form({
  children,
  title,
  subtitle,
  className = '',
  ...props
}: FormProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && (
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <form
        className={`bg-white rounded-2xl shadow-xl p-8 space-y-6 ${className}`}
        {...props}
      >
        {children}
      </form>
    </div>
  );
}
