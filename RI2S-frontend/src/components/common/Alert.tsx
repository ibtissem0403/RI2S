import React from 'react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  // Définir les classes en fonction du type
  const getAlertClasses = () => {
    const baseClasses = "p-4 mb-4 rounded-md flex items-center justify-between";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-success-light text-success-color border-l-4 border-success-color`;
      case 'error':
        return `${baseClasses} bg-danger-light text-danger-color border-l-4 border-danger-color`;
      case 'warning':
        return `${baseClasses} bg-warning-light text-warning-color border-l-4 border-warning-color`;
      case 'info':
        return `${baseClasses} bg-secondary-light text-secondary-color border-l-4 border-secondary-color`;
      default:
        return baseClasses;
    }
  };

  // Icônes pour chaque type d'alerte
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <span className="mr-2">✓</span>;
      case 'error':
        return <span className="mr-2">✕</span>;
      case 'warning':
        return <span className="mr-2">⚠</span>;
      case 'info':
        return <span className="mr-2">ℹ</span>;
      default:
        return null;
    }
  };

  return (
    <div className={getAlertClasses()}>
      <div className="flex items-center">
        {getIcon()}
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900 focus:outline-none"
          aria-label="Fermer"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;