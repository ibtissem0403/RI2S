import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`dashboard-card ${className}`}>
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        {children}
      </div>
      <style jsx>{`
        .dashboard-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          overflow: hidden;
        }
        
        .card-header {
          background-color: #f8f9fa;
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #495057;
        }
        
        .card-body {
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default DashboardCard;