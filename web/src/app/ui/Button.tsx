import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: 'green' | 'orange' | 'white';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const colorClasses: Record<string, string> = {
  green:
    'w-full py-3 px-4 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-200',
  orange:
    'w-full py-3 px-4 rounded-lg font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200',
  white:
    'w-full py-3 px-4 rounded-lg font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors duration-200',
};

const disabledClasses: Record<string, string> = {
  green: 'bg-gray-400 cursor-not-allowed',
  orange: 'bg-gray-400 cursor-not-allowed',
  white: 'cursor-not-allowed opacity-60',
};

export default function Button({
  color = 'green',
  loading = false,
  loadingText = 'Loading...',
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={
        (isDisabled
          ? disabledClasses[color] || ''
          : colorClasses[color] || colorClasses.green) +
        ' ' + (props.className || '')
      }
    >
      {loading ? (
        <span className="flex items-center justify-center space-x-2">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
          <span>{loadingText}</span>
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {icon}
          {children}
        </span>
      )}
    </button>
  );
}