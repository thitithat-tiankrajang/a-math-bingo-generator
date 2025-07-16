import React, { useState, useEffect, useRef } from 'react';

interface InputNumberBoxProps {
  value: number | '';
  onChange: (val: number | '') => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  step?: number;
}

export default function InputNumberBox({
  value,
  onChange,
  min,
  max,
  placeholder = '',
  className = '',
  onBlur,
  onFocus,
  disabled,
  step = 1,
}: InputNumberBoxProps) {
  const [inputValue, setInputValue] = useState<string>(value === '' ? '' : String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes only when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value === '' ? '' : String(value));
    }
  }, [value, isFocused]);

  const validateAndApplyConstraints = (numValue: number): number => {
    let result = numValue;
    if (typeof min === 'number' && result < min) result = min;
    if (typeof max === 'number' && result > max) result = max;
    return result;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Allow empty string for clearing
    if (val === '') {
      setInputValue('');
      // Don't call onChange immediately for empty - wait for blur
      return;
    }
    
    // Allow negative numbers and numbers being typed
    if (/^-?\d*$/.test(val)) {
      setInputValue(val);
      
      // Only call onChange if it's a complete valid number
      const num = Number(val);
      if (!isNaN(num) && val !== '-') {
        const constrainedNum = validateAndApplyConstraints(num);
        onChange(constrainedNum);
        
        // Update input if value was constrained
        if (constrainedNum !== num) {
          setInputValue(String(constrainedNum));
        }
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.();
    
    // Select all text on focus for easier editing
    setTimeout(() => {
      e.target.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    const val = inputValue.trim();
    
    // Handle empty or invalid input
    if (val === '' || val === '-' || isNaN(Number(val))) {
      if (value === '') {
        // If parent expects empty, keep it empty
        setInputValue('');
        onChange('');
      } else {
        // Otherwise use minimum value or 0
        const defaultValue = typeof min === 'number' ? min : 0;
        setInputValue(String(defaultValue));
        onChange(defaultValue);
      }
    } else {
      // Handle valid number
      const num = Number(val);
      const constrainedNum = validateAndApplyConstraints(num);
      setInputValue(String(constrainedNum));
      onChange(constrainedNum);
    }
    
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key to apply changes immediately
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    
    // Handle up/down arrow keys for incrementing/decrementing
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      
      const currentVal = inputValue === '' ? 0 : Number(inputValue);
      if (!isNaN(currentVal)) {
        const increment = e.key === 'ArrowUp' ? step : -step;
        const newVal = validateAndApplyConstraints(currentVal + increment);
        setInputValue(String(newVal));
        onChange(newVal);
      }
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} ${isFocused ? 'ring-2' : ''}`}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
    />
  );
}