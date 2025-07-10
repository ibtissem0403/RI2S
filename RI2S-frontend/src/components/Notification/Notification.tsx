// components/Notification/index.tsx
import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'react-feather';
import './Notification.css';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  position?: 'inline' | 'fixed';
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 3000,
  position = 'inline'
}) => {
  useEffect(() => {
    if (isVisible && autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, onClose, duration]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const notificationContent = (
    <div className={`notification ${type}`}>
      {getIcon()}
      <p>{message}</p>
      {onClose && (
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      )}
    </div>
  );

  // Position fixe ou en ligne selon l'option
  if (position === 'fixed') {
    return (
      <div className="notification-container">
        {notificationContent}
      </div>
    );
  }

  return notificationContent;
};

export default Notification;