import React from 'react';

/**
 * A reusable button component with theme integration
 * 
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child elements
 * @param {Object} props.theme Theme object for styling
 * @param {string} props.variant 'primary', 'secondary', or 'text'
 * @param {string} props.size 'sm', 'md', or 'lg'
 * @param {Function} props.onClick Click handler
 * @param {boolean} props.disabled If true, button is disabled
 * @param {string} props.className Additional CSS classes
 * @param {React.ReactNode} props.leftIcon Icon to display on the left
 * @param {React.ReactNode} props.rightIcon Icon to display on the right
 * @param {string} props.type Button type (button, submit, reset)
 * @param {boolean} props.fullWidth If true, button takes full width of parent
 */
const Button = ({
  children,
  theme,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  fullWidth = false,
}) => {
  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'py-1 px-2 text-xs',
    md: 'py-2 px-3 text-sm',
    lg: 'py-2.5 px-4 text-base',
  };
  
  // Variant classes based on the variant prop and theme
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `${theme.buttonBackground} ${theme.buttonForeground}`;
      case 'secondary':
        return `${theme.secondaryButtonBackground} ${theme.secondaryButtonForeground}`;
      case 'text':
        return `bg-transparent ${theme.foreground} hover:bg-opacity-10 ${theme.buttonHoverBackground}`;
      default:
        return `${theme.buttonBackground} ${theme.buttonForeground}`;
    }
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
        rounded
        transition-colors
        duration-200
        flex
        items-center
        justify-center
        ${className}
      `}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button; 