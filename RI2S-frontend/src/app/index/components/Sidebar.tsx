'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars, faHome, faChartLine, faUserCheck,
  faBroadcastTower, faHeartbeat, faUsers,
  faFileAlt, faExclamationTriangle, faUserCog, faCog,
  faFileImport // Ajout de l'icône pour l'import
} from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from '@/contexts/SidebarContext';
import { usePermissions } from '@/hooks/usePermissions';
import './sidebar.css';

export default function Sidebar() {
  const router = useRouter();
  const { expanded, pinned, expand, collapse } = useSidebar();
  const permissions = usePermissions();

  useEffect(() => {
    const wrapper = document.querySelector('.dashboard-wrapper');
    if (wrapper) {
      if (!expanded) {
        wrapper.classList.add('sidebar-collapsed');
      } else {
        wrapper.classList.remove('sidebar-collapsed');
      }
    }
  }, [expanded]);

  return (
    <aside 
      className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={expand}
      onMouseLeave={pinned ? undefined : collapse}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo_transparent.png" alt="Logo Ri2S" width="60" height="40" />
        </div>
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-section">
          <div className="menu-section-title">Menu principal</div>
          <a className="menu-item" onClick={() => router.push('/index')} style={{cursor: 'pointer'}} data-title="Accueil">
            <FontAwesomeIcon icon={faHome} />
            <span>Accueil</span>
          </a>
          <a className="menu-item" onClick={() => router.push('/dashboard')} style={{cursor: 'pointer'}} data-title="Tableau de bord">
            <FontAwesomeIcon icon={faChartLine} />
            <span>Tableau de bord</span>
          </a>
        </div>
       
        <div className="menu-section">
          <div className="menu-section-title">Expérimentations</div>
          <a className="menu-item" onClick={() => router.push('/experimentations/685187d451bb1674b47606ca')} style={{cursor: 'pointer'}} data-title="Telegrafik">
            <FontAwesomeIcon icon={faBroadcastTower} />
            <span>Telegrafik</span>
          </a>
          <a className="menu-item" onClick={() => router.push('/experimentations/6818c30a26c8263ab34bafe8')} style={{cursor: 'pointer'}} data-title="Presage">
            <FontAwesomeIcon icon={faHeartbeat} />
            <span>Presage</span>
          </a>
        </div>
       
        <div className="menu-section">
          <div className="menu-section-title">Gestion</div>
          <a className="menu-item" onClick={() => router.push('/beneficiaires')} style={{cursor: 'pointer'}} data-title="Bénéficiaires">
            <FontAwesomeIcon icon={faUsers} />
            <span>Bénéficiaires</span>
          </a>
          <a className="menu-item" onClick={() => router.push('/recrutement')} style={{cursor: 'pointer'}} data-title="Formulaires">
            <FontAwesomeIcon icon={faFileAlt} />
            <span>Formulaires</span>
          </a>
          {permissions.canViewSignals && !permissions.isManager && (
            <a className="menu-item" onClick={() => router.push('/signals')} style={{cursor: 'pointer'}} data-title="Signaux">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>Alertes</span>
            </a>
          )}
          
          {/* Menu Import - Visible seulement pour admin et gestionnaire */}
          {permissions.canViewImport && (
            <a className="menu-item" onClick={() => router.push('/import')} style={{cursor: 'pointer'}} data-title="Import de données">
              <FontAwesomeIcon icon={faFileImport} />
              <span>Import</span>
            </a>
          )}
        </div>
       
        <div className="menu-section">
          <div className="menu-section-title">Administration</div>
          <a className="menu-item" onClick={() => router.push('/utilisateurs')} style={{cursor: 'pointer'}} data-title="Utilisateurs">
            <FontAwesomeIcon icon={faUserCog} />
            <span>Utilisateurs</span>
          </a>
          <a className="menu-item" onClick={() => router.push('/parametres')} style={{cursor: 'pointer'}} data-title="Paramètres">
            <FontAwesomeIcon icon={faCog} />
            <span>Paramètres</span>
          </a>
        </div>
      </div>
    </aside>
  );
}