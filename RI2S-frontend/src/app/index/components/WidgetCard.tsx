'use client';

import React from 'react';
import Image from 'next/image';
import './WidgetCard.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


type WidgetCardProps = {
  title: string;
  participants?: number;
  status?: string;
  description?: string;
  iconClass?: string;
  logoPath?: string; // Nouvelle prop pour le chemin du logo
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  isAddCard?: boolean;
};

export default function WidgetCard({
  title,
  participants,
  status,
  description,
  iconClass,
  logoPath,
  onClick,
  variant = 'primary',
  isAddCard = false,
}: WidgetCardProps) {
  // Déterminer la classe CSS selon le status
  const getStatusClass = () => {
    if (!status) return '';
    return status.toLowerCase().includes('en cours') ? 'active' : 
           status.toLowerCase().includes('terminé') ? 'inactive' : 'pending';
  };

  return (
    <div 
      className={`widget ${variant} ${isAddCard ? 'add-card' : ''}`} 
      onClick={onClick} 
      style={{cursor: onClick ? 'pointer' : 'default'}}
    >
      {!isAddCard ? (
        <>
          <div className="widget-title">{title}</div>
          <div className="widget-content">
            <div>
              {participants !== undefined && <div>Participants : {participants}</div>}
              {status && <div className={`status ${getStatusClass()}`}>{status}</div>}
            </div>
            {logoPath ? (
              <div className="widget-logo">
                <Image 
                  src={logoPath}
                  alt={`Logo ${title}`}
                  width={60}
                  height={60}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : iconClass && (
              <div className="widget-icon-large">
                <i className={iconClass}></i>
              </div>
            )}
          </div>
          {description && <div className="widget-description">{description}</div>}
        </>
      ) : (
        <>
          <div className="widget-icon-large">
            <i className="fas fa-plus"></i>
          </div>
          <div className="widget-title">{title}</div>
        </>
      )}
    </div>
  );
}