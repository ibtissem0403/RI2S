import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DashboardNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="dashboard-nav">
      <Link href="/dashboard" passHref>
        <div className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <i className="fas fa-tachometer-alt"></i>
          <span>Tableau de Bord</span>
        </div>
      </Link>
      
      <Link href="/dashboard/efficacite" passHref>
        <div className={`nav-item ${isActive('/dashboard/efficacite') ? 'active' : ''}`}>
          <i className="fas fa-chart-line"></i>
          <span>Efficacité des Actions</span>
        </div>
      </Link>
      
      <Link href="/dashboard/comparaison" passHref>
        <div className={`nav-item ${isActive('/dashboard/comparaison') ? 'active' : ''}`}>
          <i className="fas fa-exchange-alt"></i>
          <span>Comparaison</span>
        </div>
      </Link>
      
      <style jsx>{`
        .dashboard-nav {
          display: flex;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
          overflow: hidden;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 3px solid transparent;
        }
        
        .nav-item:hover {
          color: #4e73df;
          background-color: #f8f9fa;
        }
        
        .nav-item.active {
          color: #4e73df;
          border-bottom-color: #4e73df;
          font-weight: 600;
        }
        
        .nav-item i {
          margin-right: 10px;
        }
        
        @media (max-width: 768px) {
          .dashboard-nav {
            flex-direction: column;
          }
          
          .nav-item {
            border-bottom: none;
            border-left: 3px solid transparent;
          }
          
          .nav-item.active {
            border-bottom-color: transparent;
            border-left-color: #4e73df;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardNav;