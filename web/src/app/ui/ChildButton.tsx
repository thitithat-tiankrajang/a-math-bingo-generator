import React from 'react';

interface ChildButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function ChildButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}: ChildButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg bg-white border border-gray-300 text-green-900 font-semibold 
        disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200 shadow-sm
        ${className}
      `}
    >
      {children}
    </button>
  );
} 