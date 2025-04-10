import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

/**
 * A reusable dropdown component with theme integration
 * 
 * @param {Object} props Component props
 * @param {Array} props.options Array of options with { id, label, icon? } format
 * @param {string} props.value Current selected value (id)
 * @param {Function} props.onChange Function called when selection changes
 * @param {Object} props.theme Theme object for styling
 * @param {string} props.placeholder Placeholder text when no option is selected
 * @param {string} props.className Additional CSS classes
 * @param {boolean} props.fullWidth If true, dropdown takes full width of parent
 * @param {string} props.size 'sm', 'md', or 'lg' for different sizes
 * @param {React.ReactNode} props.leftIcon Icon to display on the left
 */
const Dropdown = ({ 
  options = [], 
  value = null, 
  onChange = () => {}, // Default empty function to prevent errors
  theme,
  placeholder = 'Select option', 
  className = '',
  fullWidth = false,
  size = 'md',
  leftIcon = null,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value); // Local state for selection
  const dropdownRef = useRef(null);
  
  // Determine the selected option
  const selectedOption = options.find(option => option.id === (value !== null ? value : selectedValue));
  
  // Update local state when the value prop changes
  useEffect(() => {
    if (value !== null) {
      setSelectedValue(value);
    }
  }, [value]);
  
  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'py-1 px-2 text-xs',
    md: 'py-2 px-3 text-sm',
    lg: 'py-2.5 px-4 text-base',
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Handle selection
  const handleSelect = (option) => {
    setSelectedValue(option.id);
    setIsOpen(false);
    
    // Only call onChange if it's a function
    if (typeof onChange === 'function') {
      onChange(option.id);
    } else {
      console.warn('Dropdown onChange prop is not a function');
    }
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Dropdown button */}
      <button
        type="button"
        className={`flex items-center justify-between ${theme.inputBackground} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} rounded ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`}
        onClick={toggleDropdown}
        disabled={disabled}
      >
        <div className="flex items-center">
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          <span className={`${selectedOption ? theme.foreground : theme.descriptionForeground} truncate`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <FaChevronDown className={`ml-2 ${theme.iconColor} transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} size={size === 'lg' ? 14 : 12} />
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute z-20 mt-1 ${fullWidth ? 'w-full' : 'min-w-[200px]'} max-h-60 overflow-auto ${theme.menuBackground} rounded shadow-lg border ${theme.menuBorder}`}>
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 flex items-center ${option.id === (value !== null ? value : selectedValue) ? theme.menuActiveBackground : ''} ${theme.menuItemHoverBackground}`}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center flex-1">
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    <span className={theme.foreground}>{option.label}</span>
                  </div>
                  {option.id === (value !== null ? value : selectedValue) && (
                    <FaCheck className={theme.iconActiveColor} size={12} />
                  )}
                </button>
              </li>
            ))}
            {options.length === 0 && (
              <li className={`px-3 py-2 ${theme.descriptionForeground}`}>
                No options available
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown; 