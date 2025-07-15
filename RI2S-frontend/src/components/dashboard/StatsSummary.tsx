import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
      <style jsx>{`
        .stat-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          color: white;
          font-size: 24px;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-content h3 {
          margin: 0 0 5px 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .stat-content p {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

interface StatsSummaryProps {
  totalBeneficiaires: number;
  actionsEnAttente: number;
  tauxConversionGlobal: number;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ 
  totalBeneficiaires, 
  actionsEnAttente, 
  tauxConversionGlobal 
}) => {
  return (
    <div className="stats-summary">
      <StatCard 
        title="Total Bénéficiaires" 
        value={totalBeneficiaires} 
        icon="fa-users" 
        color="#4e73df" 
      />
      <StatCard 
        title="Actions en Attente" 
        value={actionsEnAttente} 
        icon="fa-tasks" 
        color="#1cc88a" 
      />
      <StatCard 
        title="Taux de Conversion Global" 
        value={`${tauxConversionGlobal}%`} 
        icon="fa-percentage" 
        color="#f6c23e" 
      />
      <style jsx>{`
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        @media (max-width: 768px) {
          .stats-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsSummary;