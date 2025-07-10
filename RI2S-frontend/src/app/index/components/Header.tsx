'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell, faSearch, faUser, faSignOutAlt,
  faCog, faEnvelope, faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from '@/contexts/SidebarContext';
import './header.css';

export default function Header() {
  const router = useRouter();
  const { pinned, togglePin } = useSidebar();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nouveau bénéficiaire ajouté", time: "Il y a 5 minutes", read: false },
    { id: 2, text: "Mise à jour des données cliniques", time: "Il y a 2 heures", read: false },
    { id: 3, text: "Rapport mensuel disponible", time: "Aujourd'hui", read: true }
  ]);

  // Récupération de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Récupérer le token depuis localStorage ou sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          // Pour le développement : skip l'authentification
          setLoading(false);
          return;
          // En production, décommenter la ligne suivante:
          // router.push('/');
          // return;
        }

        // Appel API pour récupérer les infos utilisateur
        const response = await fetch('http://localhost:5000/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Échec de récupération des informations utilisateur');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Erreur:', error);
        // Gérer les erreurs silencieusement pour le développement
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [router]);

  const handleLogout = () => {
    // Supprimer le token et rediriger vers la page de connexion
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    router.push('/');
  };

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Bouton hamburger avec animation X - modifié */}
        <button 
          className={`sidebar-toggle-btn ${pinned ? 'active' : ''}`}
          onClick={togglePin}
          title={pinned ? "Désactiver la sidebar fixe" : "Fixer la sidebar"}
          aria-label="Toggle menu"
        >
          <div className={`hamburger-icon ${pinned ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="search-input" 
          />
        </div>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="header-notification">
          <button className="notification-btn" onClick={toggleNotifications}>
            <FontAwesomeIcon icon={faBell} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>
          
          {notificationsOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="mark-all-read">Tout marquer comme lu</button>
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                      <div className="notification-content">
                        <p>{notification.text}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">Aucune notification</div>
                )}
              </div>
              <div className="notification-footer">
                <button onClick={() => router.push('/notifications')}>Voir toutes les notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profil utilisateur */}
        <div className="user-profile">
          {loading ? (
            <div className="user-loading">Chargement...</div>
          ) : user ? (
            <>
              <button className="profile-dropdown-toggle" onClick={toggleDropdown}>
                <div className="user-avatar">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.fullName}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <FontAwesomeIcon icon={faChevronDown} className="dropdown-arrow" />
              </button>
              
              {dropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-avatar">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="dropdown-user-name">{user.fullName}</div>
                      <div className="dropdown-user-email">{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-menu">
                    <a className="dropdown-item" href="/profile">
                      <FontAwesomeIcon icon={faUser} />
                      <span>Mon profil</span>
                    </a>
                    <a className="dropdown-item" href="/settings">
                      <FontAwesomeIcon icon={faCog} />
                      <span>Paramètres</span>
                    </a>
                    <a className="dropdown-item" href="/messages">
                      <FontAwesomeIcon icon={faEnvelope} />
                      <span>Messages</span>
                    </a>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <FontAwesomeIcon icon={faSignOutAlt} />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="login-button" onClick={() => router.push('/')}>
              Se connecter
            </button>
          )}
        </div>
      </div>
    </header>
  );
}