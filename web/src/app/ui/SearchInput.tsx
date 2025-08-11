import React from 'react';
import Input from './Input';
import Button from './Button';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export default function SearchInput({
  onClear,
  showClearButton = true,
  className = '',
  ...props
}: SearchInputProps) {
  const searchIcon = (
    <svg
      className="h-5 w-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );

  const clearIcon = (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  return (
    <div className="relative">
      <Input
        type="text"
        icon={searchIcon}
        className={`${showClearButton && props.value ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {showClearButton && props.value && onClear && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            type="button"
            onClick={onClear}
            variant="ghost"
            size="sm"
            fullWidth={false}
            className="p-1 h-auto hover:text-gray-600 transition-colors"
          >
            {clearIcon}
          </Button>
        </div>
      )}
    </div>
  );
}
