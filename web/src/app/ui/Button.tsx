import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  // Legacy support
  color?: 'green' | 'orange' | 'white';
}

// Legacy color classes
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

// New variant classes
const variantClasses: Record<string, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
  outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600 hover:border-blue-700',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText = 'Loading...',
  icon,
  children,
  disabled,
  fullWidth = true,
  // Legacy support
  color,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  // Use legacy color if provided, otherwise use new variant system
  let buttonClasses = '';
  
  if (color) {
    // Legacy mode
    buttonClasses = isDisabled 
      ? disabledClasses[color] || '' 
      : colorClasses[color] || colorClasses.green;
  } else {
    // New variant system
    const baseClasses = 'rounded-lg font-medium border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
    const variantClass = variantClasses[variant] || variantClasses.primary;
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const widthClass = fullWidth ? 'w-full' : '';
    const disabledClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    
    buttonClasses = `${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${disabledClass}`;
  }

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${buttonClasses} ${props.className || ''}`}
    >
      {loading ? (
        <span className="flex items-center justify-center space-x-2">
          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></span>
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