import React, { ButtonHTMLAttributes } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Variantes de couleur
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-color hover:bg-primary-dark text-white shadow-sm';
      case 'secondary':
        return 'bg-secondary-color hover:bg-secondary-dark text-white shadow-sm';
      case 'success':
        return 'bg-success-color hover:bg-success-color/90 text-white shadow-sm';
      case 'danger':
        return 'bg-danger-color hover:bg-danger-color/90 text-white shadow-sm';
      case 'warning':
        return 'bg-warning-color hover:bg-warning-color/90 text-white shadow-sm';
      case 'outline':
        return 'bg-transparent border border-primary-color text-primary-color hover:bg-primary-light/20';
      case 'text':
        return 'bg-transparent text-primary-color hover:bg-primary-light/20';
      default:
        return 'bg-primary-color hover:bg-primary-dark text-white shadow-sm';
    }
  };

  // Tailles
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-2';
      case 'md':
        return 'text-sm py-2 px-4';
      case 'lg':
        return 'text-base py-3 px-6';
      default:
        return 'text-sm py-2 px-4';
    }
  };

  // Classes de base
  const baseClasses = 'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-color';
  
  // Classes complètes
  const buttonClasses = `
    ${baseClasses}
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="flex items-center justify-center">
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {icon && !isLoading && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default Button;