import React from 'react';
import './StatusBadge.css';
export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'secondary';

interface StatusBadgeProps {
  variant?: StatusVariant;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  withDot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'default',
  label,
  size = 'md',
  withDot = true
}) => {
  // Obtenir les classes pour la variante de couleur
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success-light text-success-color';
      case 'warning':
        return 'bg-warning-light text-warning-color';
      case 'danger':
        return 'bg-danger-light text-danger-color';
      case 'info':
        return 'bg-secondary-light text-secondary-color';
      case 'primary':
        return 'bg-primary-light text-primary-color';
      case 'secondary':
        return 'bg-secondary-light text-secondary-color';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Obtenir les classes pour la taille
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1.5';
      default:
        return 'text-xs px-2.5 py-1';
    }
  };

  // Obtenir les classes pour le point
  const getDotColor = () => {
    switch (variant) {
      case 'success':
        return 'bg-success-color';
      case 'warning':
        return 'bg-warning-color';
      case 'danger':
        return 'bg-danger-color';
      case 'info':
        return 'bg-secondary-color';
      case 'primary':
        return 'bg-primary-color';
      case 'secondary':
        return 'bg-secondary-color';
      default:
        return 'bg-gray-500';
    }
  };

  // Appliquer les classes
  const badgeClasses = `
    inline-flex items-center rounded-full font-medium
    ${getVariantClasses()}
    ${getSizeClasses()}
  `;

  return (
    <span className={badgeClasses}>
      {withDot && (
        <span className={`w-2 h-2 mr-1.5 rounded-full ${getDotColor()}`} />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;